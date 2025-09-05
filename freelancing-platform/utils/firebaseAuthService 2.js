const { admin, verifyIdToken, createCustomToken } = require('../config/firebase');
const User = require('../models/User');
const JWTService = require('./jwtService');
const RoleConflictService = require('./roleConflictService');

class FirebaseAuthService {
  // Verify Firebase ID token and get user info
  static async verifyFirebaseToken(idToken) {
    try {
      const result = await verifyIdToken(idToken);
      
      if (!result.success) {
        return {
          success: false,
          message: 'Invalid Firebase token',
          error: result.error
        };
      }

      return {
        success: true,
        uid: result.uid,
        phoneNumber: result.phoneNumber,
        email: result.email,
        emailVerified: result.emailVerified
      };
    } catch (error) {
      console.error('Firebase token verification error:', error);
      return {
        success: false,
        message: 'Token verification failed',
        error: error.message
      };
    }
  }

  // Authenticate user with Firebase token
  static async authenticateWithFirebase(idToken, role = 'client') {
    try {
      // Verify Firebase token
      const verification = await this.verifyFirebaseToken(idToken);
      
      if (!verification.success) {
        return {
          success: false,
          message: verification.message
        };
      }

      const { uid, phoneNumber, email } = verification;

      // Check for role conflicts before creating/updating user
      const roleValidation = await RoleConflictService.validateRoleSwitch(phoneNumber, role);
      
      if (!roleValidation.canSwitch) {
        return {
          success: false,
          message: roleValidation.message,
          conflicts: roleValidation.openJobs || roleValidation.activeJobs,
          openJobsCount: roleValidation.openJobsCount,
          activeJobsCount: roleValidation.activeJobsCount
        };
      }

      // Find or create user
      let user = await User.findOne({ 
        $or: [
          { phone: phoneNumber },
          { firebaseUid: uid }
        ]
      });

      if (!user) {
        // Create new user
        user = new User({
          phone: phoneNumber,
          firebaseUid: uid,
          email: email,
          role,
          isVerified: true,
          authMethod: 'firebase'
        });
        await user.save();
      } else {
        // Update existing user (role switch allowed)
        user.firebaseUid = uid;
        user.lastLogin = new Date();
        user.isVerified = true;
        user.authMethod = 'firebase';
        user.role = role; // Update role if switching
        if (email && !user.email) {
          user.email = email;
        }
        await user.save();
      }

      // Generate JWT token
      const token = JWTService.generateToken(user._id, user.role);

      return {
        success: true,
        message: 'Firebase authentication successful',
        data: {
          token,
          user: {
            id: user._id,
            phone: user.phone,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            authMethod: user.authMethod
          }
        }
      };
    } catch (error) {
      console.error('Firebase authentication error:', error);
      return {
        success: false,
        message: 'Firebase authentication failed',
        error: error.message
      };
    }
  }

  // Get user preference for authentication method
  static async getUserAuthPreference(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { authMethod: 'otp' }; // Default to OTP
      }
      return { authMethod: user.authMethod || 'otp' };
    } catch (error) {
      console.error('Get auth preference error:', error);
      return { authMethod: 'otp' };
    }
  }

  // Update user authentication method preference
  static async updateAuthPreference(userId, authMethod) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      user.authMethod = authMethod;
      await user.save();

      return {
        success: true,
        message: 'Authentication preference updated',
        data: { authMethod }
      };
    } catch (error) {
      console.error('Update auth preference error:', error);
      return {
        success: false,
        message: 'Failed to update authentication preference',
        error: error.message
      };
    }
  }

  // Check if Firebase is available
  static isFirebaseAvailable() {
    return admin && admin.apps.length > 0;
  }

  // Get Firebase configuration for client
  static getFirebaseConfig() {
    // This should return your Firebase web app configuration
    // You'll need to get this from your Firebase Console
    return {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    };
  }
}

module.exports = FirebaseAuthService;
