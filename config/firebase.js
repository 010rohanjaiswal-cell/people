const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// In production, you'll need to download your service account key from Firebase Console
// For now, we'll use environment variables or initialize without credentials for development

let firebaseApp;

try {
  // Check if Firebase is already initialized
  if (admin.apps.length === 0) {
    // Initialize Firebase Admin SDK
    // In production, you should use a service account key file
    // For development, we can initialize without credentials
    firebaseApp = admin.initializeApp({
      // If you have a service account key file, use this:
      // credential: admin.credential.cert(require('../path/to/serviceAccountKey.json')),
      
      // For development without service account (limited functionality)
      // credential: admin.credential.applicationDefault(),
      
      // Project ID from environment variable
      projectId: process.env.FIREBASE_PROJECT_ID || 'freelancing-platform',
    });
  } else {
    firebaseApp = admin.app();
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  firebaseApp = null;
}

// Export Firebase Admin SDK
module.exports = {
  admin,
  firebaseApp,
  
  // Helper function to verify Firebase ID token
  async verifyIdToken(idToken) {
    try {
      if (!firebaseApp) {
        throw new Error('Firebase not initialized');
      }
      
      const decodedToken = await firebaseApp.auth().verifyIdToken(idToken);
      return {
        success: true,
        uid: decodedToken.uid,
        phoneNumber: decodedToken.phone_number,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        claims: decodedToken
      };
    } catch (error) {
      console.error('Firebase token verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Helper function to create custom token
  async createCustomToken(uid, additionalClaims = {}) {
    try {
      if (!firebaseApp) {
        throw new Error('Firebase not initialized');
      }
      
      const customToken = await firebaseApp.auth().createCustomToken(uid, additionalClaims);
      return {
        success: true,
        customToken
      };
    } catch (error) {
      console.error('Firebase custom token creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};
