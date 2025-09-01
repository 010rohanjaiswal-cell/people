const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OTPService = require('../utils/otpService');
const JWTService = require('../utils/jwtService');
const { validationRules, handleValidationErrors } = require('../utils/validation');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const bcrypt = require('bcryptjs');

// Send OTP for login/signup
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
        message: 'OTP sent successfully'
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

// Verify OTP and login/signup
router.post('/verify-otp',
  validationRules.phone,
  validationRules.otp,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { phone, otp, role = 'client' } = req.body;

      // Verify OTP
      const verification = await OTPService.verifyOTP(phone, otp, 'login');
      
      if (!verification.isValid) {
        return res.status(400).json({
          success: false,
          message: verification.message
        });
      }

      // Find or create user
      let user = await User.findOne({ phone });
      
      if (!user) {
        // Create new user
        user = new User({
          phone,
          role,
          isVerified: true
        });
        await user.save();
      } else {
        // Update last login
        user.lastLogin = new Date();
        user.isVerified = true;
        await user.save();
      }

      // Generate JWT token
      const token = JWTService.generateToken(user._id, user.role);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user._id,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified
          }
        }
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify OTP'
      });
    }
  }
);

// Admin login (email + password)
router.post('/admin/login',
  validationRules.adminLogin,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find admin user
      const user = await User.findOne({ 
        email, 
        role: 'admin',
        isActive: true 
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = JWTService.generateToken(user._id, user.role);

      res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            role: user.role
          }
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }
);

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// Firebase authentication
router.post('/firebase', async (req, res) => {
  try {
    const { idToken, phone, role = 'client' } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID token is required'
      });
    }

    // Verify Firebase ID token
    const { auth } = require('../config/firebase');
    if (!auth) {
      return res.status(500).json({
        success: false,
        message: 'Firebase not properly configured'
      });
    }

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Firebase token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid Firebase token'
      });
    }

    const { uid, phoneNumber } = decodedToken;
    const userPhone = phone || phoneNumber;

    if (!userPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { phone: userPhone },
        { firebaseUid: uid }
      ]
    });

    if (!user) {
      // Create new user
      user = new User({
        phone: userPhone,
        firebaseUid: uid,
        role,
        isVerified: true,
        authMethod: 'firebase'
      });
      await user.save();
    } else {
      // Update existing user
      user.firebaseUid = uid;
      user.lastLogin = new Date();
      user.isVerified = true;
      user.authMethod = 'firebase';
      user.role = role; // Update role if switching
      await user.save();
    }

    // Generate JWT token
    const token = JWTService.generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Firebase authentication successful',
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
    });

  } catch (error) {
    console.error('Firebase authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Firebase authentication failed',
      error: error.message
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', auth, async (req, res) => {
  try {
    // In a more advanced setup, you might want to blacklist the token
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

module.exports = router;
