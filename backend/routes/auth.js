const express = require('express');
const { auth, firestore } = require('../config/firebase');
const { verifyFirebaseToken, verifyJWT } = require('../middleware/auth');
const { 
  validatePhoneAuth, 
  validatePhoneVerification, 
  validateProfileUpdate,
  validateCustomToken 
} = require('../middleware/validation');
const jwt = require('jsonwebtoken');

const router = express.Router();

/**
 * @route   POST /api/auth/send-verification-code
 * @desc    Send verification code to phone number (for testing, you can use Firebase test numbers)
 * @access  Public
 */
router.post('/send-verification-code', validatePhoneAuth, async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // For testing purposes, you can use Firebase test phone numbers
    // These are predefined numbers that Firebase provides for testing
    const testPhoneNumbers = [
      '+16505550000', // Test number 1
      '+16505550001', // Test number 2
      '+16505550002', // Test number 3
      '+16505550003', // Test number 4
      '+16505550004', // Test number 5
      '+919090909090' // Custom test number configured in Firebase
    ];

    // Check if it's a test phone number
    const isTestNumber = testPhoneNumbers.includes(phoneNumber);
    
    if (isTestNumber) {
      let verificationCode;
      
      // For your custom test number, use the configured OTP
      if (phoneNumber === '+919090909090') {
        verificationCode = '909090';
      } else {
        // For other test numbers, generate a random code
        verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      }
      
      // Store the verification code temporarily (in production, use a proper cache like Redis)
      // For now, we'll store it in memory (not recommended for production)
      if (!global.verificationCodes) {
        global.verificationCodes = new Map();
      }
      
      global.verificationCodes.set(phoneNumber, {
        code: verificationCode,
        expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
      });

      return res.json({
        success: true,
        message: 'Verification code sent successfully',
        phoneNumber,
        isTestNumber: true,
        verificationCode, // Only include this for test numbers in development
        expiresIn: '10 minutes',
        note: phoneNumber === '+919090909090' ? 'Using configured OTP: 909090' : 'Generated test OTP'
      });
    }

    // For real phone numbers, you would integrate with Firebase Phone Auth
    // This is a placeholder for production implementation
    return res.status(400).json({
      error: 'Phone number verification not implemented for production numbers yet',
      message: 'Please use one of the test phone numbers for development'
    });

  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({
      error: 'Failed to send verification code',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/auth/verify-phone
 * @desc    Verify phone number with verification code and create/authenticate user
 * @access  Public
 */
router.post('/verify-phone', validatePhoneVerification, async (req, res) => {
  try {
    const { phoneNumber, verificationCode } = req.body;

    // Check if verification code exists and is valid
    if (!global.verificationCodes || !global.verificationCodes.has(phoneNumber)) {
      return res.status(400).json({
        error: 'Verification code expired or not found',
        message: 'Please request a new verification code'
      });
    }

    const storedData = global.verificationCodes.get(phoneNumber);
    
    // Check if code has expired
    if (Date.now() > storedData.expiresAt) {
      global.verificationCodes.delete(phoneNumber);
      return res.status(400).json({
        error: 'Verification code expired',
        message: 'Please request a new verification code'
      });
    }

    // Check if verification code matches
    if (storedData.code !== verificationCode) {
      return res.status(400).json({
        error: 'Invalid verification code',
        message: 'Please check your verification code and try again'
      });
    }

    // Clean up the verification code
    global.verificationCodes.delete(phoneNumber);

    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByPhoneNumber(phoneNumber);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await auth.createUser({
          phoneNumber: phoneNumber,
          displayName: `User_${Date.now()}`,
          disabled: false
        });
      } else {
        throw error;
      }
    }

    // Create custom JWT token
    const customToken = jwt.sign(
      { 
        uid: userRecord.uid, 
        phoneNumber: userRecord.phoneNumber,
        email: userRecord.email,
        displayName: userRecord.displayName
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store user data in Firestore (optional)
    try {
      await firestore.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        phoneNumber: userRecord.phoneNumber,
        email: userRecord.email || null,
        displayName: userRecord.displayName,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isPhoneVerified: true
      }, { merge: true });
    } catch (firestoreError) {
      console.error('Error storing user data in Firestore:', firestoreError);
      // Don't fail the request if Firestore fails
    }

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      user: {
        uid: userRecord.uid,
        phoneNumber: userRecord.phoneNumber,
        email: userRecord.email,
        displayName: userRecord.displayName,
        isPhoneVerified: true
      },
      token: customToken,
      expiresIn: '7 days'
    });

  } catch (error) {
    console.error('Error verifying phone number:', error);
    res.status(500).json({
      error: 'Failed to verify phone number',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh-token', verifyJWT, async (req, res) => {
  try {
    const { uid, phoneNumber, email, displayName } = req.user;

    // Create new token
    const newToken = jwt.sign(
      { uid, phoneNumber, email, displayName },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken,
      expiresIn: '7 days'
    });

  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      error: 'Failed to refresh token',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', verifyJWT, async (req, res) => {
  try {
    const { uid, phoneNumber, email, displayName } = req.user;

    // For JWT tokens, we can return the user data from the token
    // or optionally fetch from Firestore if you want the latest data
    const userData = {
      uid,
      phoneNumber,
      email,
      displayName,
      isPhoneVerified: true,
      lastLoginAt: new Date()
    };

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      error: 'Failed to get user profile',
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', [verifyJWT, validateProfileUpdate], async (req, res) => {
  try {
    const { uid } = req.user;
    const { displayName, email } = req.body;

    const updateData = {};
    if (displayName) updateData.displayName = displayName;
    if (email) updateData.email = email;
    updateData.updatedAt = new Date();

    // Update in Firestore (optional)
    try {
      await firestore.collection('users').doc(uid).update(updateData);
    } catch (firestoreError) {
      console.error('Error updating Firestore:', firestoreError);
      // Continue with Firebase Auth update
    }

    // Update in Firebase Auth if displayName or email changed
    if (displayName || email) {
      try {
        const authUpdateData = {};
        if (displayName) authUpdateData.displayName = displayName;
        if (email) authUpdateData.email = email;
        
        await auth.updateUser(uid, authUpdateData);
      } catch (authError) {
        console.error('Error updating Firebase Auth:', authError);
        // Continue with response
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt')
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      error: 'Failed to update user profile',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client should discard token)
 * @access  Private
 */
router.post('/logout', verifyJWT, async (req, res) => {
  try {
    // In a real application, you might want to add the token to a blacklist
    // For now, we'll just return success (client should discard the token)
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({
      error: 'Failed to logout',
      message: error.message
    });
  }
});

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', verifyJWT, async (req, res) => {
  try {
    const { uid } = req.user;

    // Delete from Firestore (optional)
    try {
      await firestore.collection('users').doc(uid).delete();
    } catch (firestoreError) {
      console.error('Error deleting from Firestore:', firestoreError);
      // Continue with Firebase Auth deletion
    }

    // Delete from Firebase Auth
    try {
      await auth.deleteUser(uid);
    } catch (authError) {
      console.error('Error deleting from Firebase Auth:', authError);
      return res.status(500).json({
        error: 'Failed to delete account from Firebase Auth',
        message: authError.message
      });
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      error: 'Failed to delete account',
      message: error.message
    });
  }
});

module.exports = router;
