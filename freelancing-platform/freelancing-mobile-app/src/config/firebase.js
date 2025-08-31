import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// New Firebase configuration for freelancing-platform-v2
const firebaseConfig = {
  apiKey: "AIzaSyDr_KGBQE7WiisZkhHZR8Yz9icfndxTkVE",
  authDomain: "freelancing-platform-v2.firebaseapp.com",
  projectId: "freelancing-platform-v2",
  storageBucket: "freelancing-platform-v2.firebasestorage.app",
  messagingSenderId: "713504655146",
  appId: "1:713504655146:web:1d73bc6ffcdb61a8938053",
  measurementId: "G-KBR56WFJPP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with React Native persistence
// This is the correct way to handle React Native Firebase auth
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Cloud Firestore
const db = getFirestore(app);

export { app, auth, db };
