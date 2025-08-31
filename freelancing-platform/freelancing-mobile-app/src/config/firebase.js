import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

// Initialize Firebase Authentication (simpler approach)
const auth = getAuth(app);

// Initialize Cloud Firestore
const db = getFirestore(app);

export { app, auth, db };
