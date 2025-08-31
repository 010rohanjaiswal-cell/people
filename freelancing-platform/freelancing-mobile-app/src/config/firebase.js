import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXxIqwOiVUDFJWA4LfHpxUS2iN6FUiJiI",
  authDomain: "freelancing-platform-69389.firebaseapp.com",
  projectId: "freelancing-platform-69389",
  storageBucket: "freelancing-platform-69389.firebasestorage.app",
  messagingSenderId: "144033473194",
  appId: "1:144033473194:web:d55288b52d90bb7ad2a6d3",
  measurementId: "G-BSQP0LSV40"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with React Native persistence
// This is the recommended approach for React Native
let auth;
try {
  // Try to get existing auth instance
  auth = getAuth(app);
} catch (error) {
  // If no auth instance exists, initialize with React Native persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Initialize Cloud Firestore
const db = getFirestore(app);

export { app, auth, db };
