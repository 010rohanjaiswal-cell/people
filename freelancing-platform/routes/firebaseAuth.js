const express = require('express');
const router = express.Router();
const { adminAuth } = require('../config/firebase');
const { validationRules, handleValidationErrors } = require('../utils/validation');
const JWTService = require('../utils/jwtService');
const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');

// Firebase authentication endpoint
router.post('/firebase',
  validationRules.firebaseAuth,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { idToken, phone, role = 'client' } = req.body;

      console.log('🔥 Firebase Auth: Verifying token for phone:', phone, 'Role:', role);

      // Verify Firebase ID token
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const firebaseUid = decodedToken.uid;
      const firebasePhone = decodedToken.phone_number;

      console.log('🔥 Firebase Auth: Token verified, UID:', firebaseUid, 'Phone:', firebasePhone);

      // Check if phone numbers match
      if (firebasePhone !== phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number mismatch'
        });
      }

      // Find or create user
      let user = await User.findOne({ phone });
      
      if (!user) {
        // Create new user with Firebase UID
        user = new User({
          phone,
          role,
          firebaseUid,
          isVerified: true,
          lastLogin: new Date()
        });
        await user.save();
        console.log('🔥 Firebase Auth: New user created:', user._id);
      } else {
        // Update existing user with Firebase UID and last login
        user.firebaseUid = firebaseUid;
        user.lastLogin = new Date();
        user.isVerified = true;
        await user.save();
        console.log('🔥 Firebase Auth: Existing user updated:', user._id);
      }

      // Generate JWT token for backend authentication
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
            firebaseUid: user.firebaseUid,
            isVerified: user.isVerified
          }
        }
      });
    } catch (error) {
      console.error('🔥 Firebase Auth Error:', error);
      
      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({
          success: false,
          message: 'Firebase token expired. Please sign in again.'
        });
      } else if (error.code === 'auth/id-token-revoked') {
        return res.status(401).json({
          success: false,
          message: 'Firebase token revoked. Please sign in again.'
        });
      } else if (error.code === 'auth/invalid-id-token') {
        return res.status(401).json({
          success: false,
          message: 'Invalid Firebase token.'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Firebase authentication failed'
      });
    }
  }
);

// Verify Firebase token middleware
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No Firebase token provided'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Firebase token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid Firebase token'
    });
  }
};

// Protected route example
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Get user profile based on role
    let profile = null;
    if (user.role === 'freelancer') {
      profile = await FreelancerProfile.findOne({ userId: user._id });
    } else if (user.role === 'client') {
      profile = await ClientProfile.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          phone: user.phone,
          role: user.role,
          firebaseUid: user.firebaseUid,
          isVerified: user.isVerified
        },
        profile
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

module.exports = { router, verifyFirebaseToken };
