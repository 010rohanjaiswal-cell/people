const admin = require('firebase-admin');
require('dotenv').config();

// Firebase service account configuration
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
  token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

// Initialize Firebase Admin SDK
let firebaseApp;

try {
  if (admin.apps.length === 0) {
    // Check if we have service account credentials
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // Initialize with service account credentials
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
      });
      console.log('Firebase Admin SDK initialized successfully with service account');
    } else {
      // Initialize without credentials for development (limited functionality)
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'freelancing-platform-69389',
      });
      console.log('Firebase Admin SDK initialized without service account (limited functionality)');
    }
  } else {
    firebaseApp = admin.app();
    console.log('Firebase Admin SDK already initialized');
  }
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    firebaseApp = admin.app();
    console.log('Firebase Admin SDK already initialized');
  } else {
    console.error('Error initializing Firebase Admin SDK:', error);
    firebaseApp = null;
  }
}

// Export Firebase Admin instances
const auth = firebaseApp ? firebaseApp.auth() : null;
const firestore = firebaseApp ? firebaseApp.firestore() : null;

module.exports = {
  admin,
  auth,
  firestore,
  firebaseApp,
  
  // Helper function to verify Firebase ID token
  async verifyIdToken(idToken) {
    try {
      if (!firebaseApp || !auth) {
        throw new Error('Firebase not initialized');
      }
      
      const decodedToken = await auth.verifyIdToken(idToken);
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
      if (!firebaseApp || !auth) {
        throw new Error('Firebase not initialized');
      }
      
      const customToken = await auth.createCustomToken(uid, additionalClaims);
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
