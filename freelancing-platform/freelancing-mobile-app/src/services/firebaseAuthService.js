import { 
  signInWithPhoneNumber, 
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './apiService';

class FirebaseAuthService {
  constructor() {
    this.verificationId = null;
  }

  // Send OTP via Firebase Phone Auth (React Native compatible)
  async sendOTP(phoneNumber) {
    try {
      console.log('📱 Firebase: Sending OTP to:', phoneNumber);
      
      // Format phone number
      const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
      
      console.log('📱 Firebase: Attempting to send OTP...');
      
      // Send OTP using Firebase Phone Auth
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone);
      this.verificationId = confirmationResult.verificationId;
      
      console.log('✅ Firebase: OTP sent successfully');
      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('❌ Firebase: Error sending OTP:', error);
      console.error('❌ Firebase: Error code:', error.code);
      console.error('❌ Firebase: Error message:', error.message);
      
      return { 
        success: false, 
        message: this.getErrorMessage(error.code) 
      };
    }
  }

  // Verify OTP and sign in
  async verifyOTP(otp, phoneNumber, role) {
    try {
      console.log('📱 Firebase: Verifying OTP for:', phoneNumber, 'Role:', role);
      
      if (!this.verificationId) {
        throw new Error('No verification ID found. Please send OTP first.');
      }

      // Create credential
      const credential = PhoneAuthProvider.credential(this.verificationId, otp);
      
      // Sign in with credential
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      
      console.log('✅ Firebase: OTP verified, user signed in:', user.uid);

      // Get Firebase ID token
      const idToken = await user.getIdToken();
      
      // Send token to backend for user creation/verification
      const backendResult = await this.authenticateWithBackend(idToken, phoneNumber, role);
      
      if (backendResult.success) {
        // Store authentication data
        await this.storeAuthData(backendResult.data, user.uid);
        return backendResult;
      } else {
        throw new Error(backendResult.message);
      }
    } catch (error) {
      console.error('❌ Firebase: Error verifying OTP:', error);
      return { 
        success: false, 
        message: this.getErrorMessage(error.code) || error.message 
      };
    }
  }

  // Authenticate with backend using Firebase token
  async authenticateWithBackend(idToken, phoneNumber, role) {
    try {
      const result = await apiService.authenticateWithFirebase(idToken, phoneNumber, role);
      return result;
    } catch (error) {
      console.error('❌ Backend authentication error:', error);
      return { 
        success: false, 
        message: 'Failed to authenticate with server' 
      };
    }
  }

  // Store authentication data
  async storeAuthData(data, firebaseUid) {
    try {
      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('userRole', data.user.role);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      await AsyncStorage.setItem('userId', data.user.id);
      await AsyncStorage.setItem('firebaseUid', firebaseUid);
      await AsyncStorage.setItem('authMethod', 'firebase');
      
      console.log('✅ Firebase: Auth data stored successfully');
    } catch (error) {
      console.error('❌ Firebase: Error storing auth data:', error);
    }
  }

  // Sign out
  async signOut() {
    try {
      await auth.signOut();
      await AsyncStorage.multiRemove([
        'authToken',
        'userRole', 
        'userData',
        'userId',
        'firebaseUid',
        'authMethod'
      ]);
      console.log('✅ Firebase: User signed out successfully');
    } catch (error) {
      console.error('❌ Firebase: Error signing out:', error);
    }
  }

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!auth.currentUser;
  }

  // Get error message from Firebase error code
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/invalid-phone-number': 'Invalid phone number format',
      'auth/invalid-verification-code': 'Invalid OTP code',
      'auth/invalid-verification-id': 'Invalid verification ID',
      'auth/quota-exceeded': 'Too many requests. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/operation-not-allowed': 'Phone authentication is not enabled',
      'auth/captcha-check-failed': 'reCAPTCHA verification failed',
      'auth/missing-verification-code': 'Please enter the OTP code',
      'auth/missing-verification-id': 'Verification session expired. Please try again',
      'auth/argument-error': 'Phone authentication configuration error. Please check Firebase settings.'
    };
    
    return errorMessages[errorCode] || 'Authentication failed. Please try again.';
  }

  // Listen to authentication state changes
  onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
  }
}

const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;
