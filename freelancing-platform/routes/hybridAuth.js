const express = require('express');
const router = express.Router();
const FirebaseAuthService = require('../utils/firebaseAuthService');
const OTPService = require('../utils/otpService');
const JWTService = require('../utils/jwtService');
const RoleConflictService = require('../utils/roleConflictService');
const User = require('../models/User');
const { validationRules, handleValidationErrors } = require('../utils/validation');
const auth = require('../middleware/auth');

// Hybrid authentication - supports both Firebase and OTP
router.post('/login',
  async (req, res) => {
    try {
      const { phone, otp, idToken, role = 'client', authMethod = 'auto' } = req.body;

      // Determine authentication method
      let method = authMethod;
      if (authMethod === 'auto') {
        if (idToken) {
          method = 'firebase';
        } else if (otp) {
          method = 'otp';
        } else {
          return res.status(400).json({
            success: false,
            message: 'Please provide either Firebase ID token or OTP',
            availableMethods: ['firebase', 'otp']
          });
        }
      }

      let result;

      if (method === 'firebase') {
        // Firebase authentication
        if (!idToken) {
          return res.status(400).json({
            success: false,
            message: 'Firebase ID token is required for Firebase authentication',
            fallback: 'otp'
          });
        }

        result = await FirebaseAuthService.authenticateWithFirebase(idToken, role);
        
        if (!result.success) {
          return res.status(400).json({
            success: false,
            message: result.message,
            fallback: 'otp',
            suggestion: 'Try using OTP authentication instead'
          });
        }
      } else if (method === 'otp') {
        // OTP authentication
        if (!phone || !otp) {
          return res.status(400).json({
            success: false,
            message: 'Phone number and OTP are required for OTP authentication'
          });
        }

        // Verify OTP
        const verification = await OTPService.verifyOTP(phone, otp, 'login');
        
        if (!verification.isValid) {
          return res.status(400).json({
            success: false,
            message: verification.message
          });
        }

        // Check for role conflicts before creating/updating user
        const roleValidation = await RoleConflictService.validateRoleSwitch(phone, role);
        
        if (!roleValidation.canSwitch) {
          return res.status(400).json({
            success: false,
            message: roleValidation.message,
            conflicts: roleValidation.openJobs || roleValidation.activeJobs,
            openJobsCount: roleValidation.openJobsCount,
            activeJobsCount: roleValidation.activeJobsCount
          });
        }

        // Find or create user
        let user = await User.findOne({ phone });
        
        if (!user) {
          // Create new user
          user = new User({
            phone,
            role,
            isVerified: true,
            authMethod: 'otp'
          });
          await user.save();
        } else {
          // Update existing user (role switch allowed)
          user.lastLogin = new Date();
          user.isVerified = true;
          user.authMethod = 'otp';
          user.role = role; // Update role if switching
          await user.save();
        }

        // Generate JWT token
        const token = JWTService.generateToken(user._id, user.role);

        result = {
          success: true,
          message: 'OTP authentication successful',
          data: {
            token,
            user: {
              id: user._id,
              phone: user.phone,
              role: user.role,
              isVerified: user.isVerified,
              authMethod: user.authMethod
            }
          }
        };
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid authentication method',
          availableMethods: ['firebase', 'otp', 'auto']
        });
      }

      res.json({
        success: true,
        message: `${method.toUpperCase()} authentication successful`,
        data: {
          ...result.data,
          authMethod: method
        }
      });
    } catch (error) {
      console.error('Hybrid authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed',
        error: error.message
      });
    }
  }
);

// Send OTP (fallback method)
router.post('/send-otp',
  validationRules.phone,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { phone } = req.body;

      // Send OTP
      await OTPService.sendOTP(phone, 'login');

      res.json({
        success: true,
        message: 'OTP sent successfully',
        authMethod: 'otp'
      });
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP'
      });
    }
  }
);

// Get available authentication methods
router.get('/methods',
  async (req, res) => {
    try {
      const firebaseAvailable = FirebaseAuthService.isFirebaseAvailable();
      const firebaseConfig = FirebaseAuthService.getFirebaseConfig();
      const firebaseConfigured = Object.values(firebaseConfig).every(value => value);

      res.json({
        success: true,
        data: {
          methods: {
            firebase: {
              available: firebaseAvailable && firebaseConfigured,
              configured: firebaseConfigured
            },
            otp: {
              available: true,
              configured: true
            }
          },
          recommended: firebaseAvailable && firebaseConfigured ? 'firebase' : 'otp',
          fallback: 'otp'
        }
      });
    } catch (error) {
      console.error('Get auth methods error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get authentication methods'
      });
    }
  }
);

// Get user's preferred authentication method
router.get('/preference',
  auth,
  async (req, res) => {
    try {
      const preference = await FirebaseAuthService.getUserAuthPreference(req.user.id);
      
      res.json({
        success: true,
        data: preference
      });
    } catch (error) {
      console.error('Get auth preference error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get authentication preference'
      });
    }
  }
);

// Update user's authentication preference
router.put('/preference',
  auth,
  validationRules.authMethod,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { authMethod } = req.body;
      
      const result = await FirebaseAuthService.updateAuthPreference(req.user.id, authMethod);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        message: 'Authentication preference updated',
        data: result.data
      });
    } catch (error) {
      console.error('Update auth preference error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update authentication preference'
      });
    }
  }
);

// Check role conflicts for a phone number
router.post('/check-role-conflicts',
  async (req, res) => {
    try {
      const { phone, role } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      const roleInfo = await RoleConflictService.getUserRoleInfo(phone);
      const roleValidation = role ? await RoleConflictService.validateRoleSwitch(phone, role) : null;

      res.json({
        success: true,
        data: {
          userInfo: roleInfo,
          roleValidation: roleValidation,
          canSwitch: roleValidation ? roleValidation.canSwitch : null
        }
      });
    } catch (error) {
      console.error('Check role conflicts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check role conflicts'
      });
    }
  }
);

module.exports = router;
