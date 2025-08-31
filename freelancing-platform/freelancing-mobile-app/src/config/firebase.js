import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

// Initialize Firebase Authentication (simplified)
const auth = getAuth(app);

// Initialize Cloud Firestore
const db = getFirestore(app);

export { app, auth, db };
