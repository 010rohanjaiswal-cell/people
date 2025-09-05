const admin = require('firebase-admin');
let firebaseApp;

try {
  if (admin.apps.length === 0) {
    // Check if we have the required environment variables
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // Use environment variables for Firebase Admin SDK
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID || 'freelancing-platform-v2',
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL
      };

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || 'freelancing-platform-v2',
      });
      console.log('✅ Firebase Admin SDK initialized with service account');
    } else {
      // Fallback for local development - initialize without credentials
      console.log('⚠️ Firebase credentials not found, initializing for local development only');
      firebaseApp = admin.initializeApp({
        projectId: 'freelancing-platform-v2'
      });
    }
  } else {
    firebaseApp = admin.app();
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  firebaseApp = null;
}

module.exports = {
  admin,
  firebaseApp,
  async verifyIdToken(idToken) {
    try {
      if (!firebaseApp) {
        throw new Error('Firebase not initialized');
      }
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Firebase token verification error:', error);
      throw error;
    }
  },
  async createCustomToken(uid, additionalClaims = {}) {
    try {
      if (!firebaseApp) {
        throw new Error('Firebase not initialized');
      }
      const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
      return customToken;
    } catch (error) {
      console.error('Firebase custom token creation error:', error);
      throw error;
    }
  }
};
