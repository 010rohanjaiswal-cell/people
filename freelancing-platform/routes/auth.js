const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OTPService = require('../utils/otpService');
const JWTService = require('../utils/jwtService');
const { validationRules, handleValidationErrors } = require('../utils/validation');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const bcrypt = require('bcryptjs');

// Send OTP for login/signup (DISABLED - Use Firebase Authentication)
router.post('/send-otp', 
  validationRules.phone,
  handleValidationErrors,
  async (req, res) => {
    res.status(400).json({
      success: false,
      message: 'OTP authentication is disabled. Please use Firebase authentication.'
    });
  }
);

// Verify OTP and login/signup (DISABLED - Use Firebase Authentication)
router.post('/verify-otp',
  validationRules.phone,
  validationRules.otp,
  handleValidationErrors,
  async (req, res) => {
    res.status(400).json({
      success: false,
      message: 'OTP authentication is disabled. Please use Firebase authentication.'
    });
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
