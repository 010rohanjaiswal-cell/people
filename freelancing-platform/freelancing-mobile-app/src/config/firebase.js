import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Firebase configuration for freelancing-platform-v2 (Android App)
// Note: React Native Firebase automatically reads from google-services.json
// No need to manually configure the firebaseConfig object

// Initialize Firebase Authentication
const firebaseAuth = auth();

// Initialize Cloud Firestore
const firestoreDb = firestore();

export { firebaseAuth as auth, firestoreDb as db };
