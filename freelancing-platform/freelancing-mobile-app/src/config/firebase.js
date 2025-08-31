import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Minimal Firebase configuration for testing
const firebaseConfig = {
  apiKey: "AIzaSyBXxIqwOiVUDFJWA4LfHpxUS2iN6FUiJiI",
  projectId: "freelancing-platform-69389",
  authDomain: "freelancing-platform-69389.firebaseapp.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication (minimal approach)
const auth = getAuth(app);

// Initialize Cloud Firestore
const db = getFirestore(app);

export { app, auth, db };
