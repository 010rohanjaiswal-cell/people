const express = require('express');
const router = express.Router();
const FirebaseAuthService = require('../utils/firebaseAuthService');
const { validationRules, handleValidationErrors } = require('../utils/validation');
const auth = require('../middleware/auth');

// Firebase authentication with ID token
router.post('/authenticate',
  validationRules.firebaseToken,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { idToken, role = 'client' } = req.body;

      // Check if Firebase is available
      if (!FirebaseAuthService.isFirebaseAvailable()) {
        return res.status(503).json({
          success: false,
          message: 'Firebase authentication is not available. Please use OTP authentication.',
          fallback: 'otp'
        });
      }

      // Authenticate with Firebase
      const result = await FirebaseAuthService.authenticateWithFirebase(idToken, role);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          fallback: 'otp'
        });
      }

      res.json({
        success: true,
        message: 'Firebase authentication successful',
        data: result.data
      });
    } catch (error) {
      console.error('Firebase authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'Firebase authentication failed',
        fallback: 'otp'
      });
    }
  }
);

// Get user authentication preference
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

// Update user authentication preference
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

// Get Firebase configuration for client
router.get('/config',
  async (req, res) => {
    try {
      const config = FirebaseAuthService.getFirebaseConfig();
      
      // Check if Firebase is properly configured
      const isConfigured = Object.values(config).every(value => value);
      
      res.json({
        success: true,
        data: {
          config,
          isConfigured,
          isAvailable: FirebaseAuthService.isFirebaseAvailable()
        }
      });
    } catch (error) {
      console.error('Get Firebase config error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Firebase configuration'
      });
    }
  }
);

// Health check for Firebase authentication
router.get('/health',
  async (req, res) => {
    try {
      const isAvailable = FirebaseAuthService.isFirebaseAvailable();
      const config = FirebaseAuthService.getFirebaseConfig();
      const isConfigured = Object.values(config).every(value => value);
      
      res.json({
        success: true,
        data: {
          firebaseAvailable: isAvailable,
          firebaseConfigured: isConfigured,
          status: isAvailable && isConfigured ? 'healthy' : 'unavailable'
        }
      });
    } catch (error) {
      console.error('Firebase health check error:', error);
      res.status(500).json({
        success: false,
        message: 'Firebase health check failed'
      });
    }
  }
);

module.exports = router;
