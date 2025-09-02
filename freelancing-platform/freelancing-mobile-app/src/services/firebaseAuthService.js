import auth from '@react-native-firebase/auth';
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
      
      // React Native Firebase handles reCAPTCHA automatically for mobile apps
      const confirmationResult = await auth().signInWithPhoneNumber(formattedPhone);
      this.verificationId = confirmationResult.verificationId;
      
      console.log('✅ Firebase: OTP sent successfully');
      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('❌ Firebase: Error sending OTP:', error);
      console.error('❌ Firebase: Error code:', error.code);
      console.error('❌ Firebase: Error message:', error.message);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-phone-number') {
        return { 
          success: false, 
          message: 'Invalid phone number format. Please use +91XXXXXXXXXX' 
        };
      } else if (error.code === 'auth/too-many-requests') {
        return { 
          success: false, 
          message: 'Too many requests. Please try again later.' 
        };
      } else if (error.code === 'auth/quota-exceeded') {
        return { 
          success: false, 
          message: 'SMS quota exceeded. Please try again later.' 
        };
      } else if (error.code === 'auth/operation-not-allowed') {
        return { 
          success: false, 
          message: 'Phone authentication is not enabled for this app.' 
        };
      }
      
      return { 
        success: false, 
        message: this.getErrorMessage(error.code) || 'Failed to send OTP. Please try again.' 
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

      // Create credential using React Native Firebase
      const credential = auth.PhoneAuthProvider.credential(this.verificationId, otp);
      
      // Sign in with credential
      const userCredential = await auth().signInWithCredential(credential);
      const user = userCredential.user;
      
      console.log('✅ Firebase: OTP verified, user signed in:', user.uid);

      // Get Firebase ID token
      const idToken = await user.getIdToken();
      
      // Send token to backend for user creation/verification
      const backendResult = await this.authenticateWithBackend(idToken, phoneNumber, role);
      
      if (backendResult.success) {
        // Store authentication data with proper error handling
        try {
          await this.storeAuthData(backendResult.data, user.uid, role);
          return backendResult;
        } catch (error) {
          console.error('❌ Firebase: Failed to store auth data:', error);
          return {
            success: false,
            message: 'Authentication successful but failed to save data locally'
          };
        }
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
      
      // Debug: Log the backend response structure
      console.log('🔍 Backend response:', JSON.stringify(result, null, 2));
      
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
  async storeAuthData(data, firebaseUid, selectedRole) {
    try {
      // Handle nested data structure from backend
      let token, user;
      
      if (data && data.data) {
        // Backend returns: { data: { data: { token, user } } }
        token = data.data.token;
        user = data.data.user;
      } else if (data) {
        // Direct structure: { token, user }
        token = data.token;
        user = data.user;
      }
      
      // Validate data before storing
      if (!token) {
        console.error('❌ Firebase: No token found in data:', data);
        throw new Error('Authentication token is missing');
      }
      
      if (!user) {
        console.error('❌ Firebase: No user data found in data:', data);
        throw new Error('User data is missing');
      }
      
      // Use the selected role from the user's choice, not from backend
      // This allows the same phone number to have different roles
      const userRole = selectedRole || user.role;
      
      if (!userRole) {
        console.error('❌ Firebase: No role specified for user');
        throw new Error('User role is required');
      }
      
      // Store the data with the selected role
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userRole', userRole); // Store the selected role
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      await AsyncStorage.setItem('userId', user.id);
      await AsyncStorage.setItem('firebaseUid', firebaseUid);
      await AsyncStorage.setItem('authMethod', 'firebase');
      await AsyncStorage.setItem('selectedRole', userRole); // Additional role storage for clarity
      
      console.log('✅ Firebase: Auth data stored successfully');
      console.log('📱 Stored token:', token ? 'Present' : 'Missing');
      console.log('📱 Stored user:', user ? 'Present' : 'Missing');
      console.log('🎭 Stored role:', userRole);
      console.log('📱 User can now access:', userRole === 'client' ? 'Client features' : 'Freelancer features');
      
    } catch (error) {
      console.error('❌ Firebase: Error storing auth data:', error);
      console.error('❌ Data received:', JSON.stringify(data, null, 2));
      console.error('❌ Selected role:', selectedRole);
      throw error; // Re-throw to handle in calling function
    }
  }

  // Sign out
  async signOut() {
    try {
      await auth().signOut();
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
    return auth().currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!auth().currentUser;
  }

  // Get current user role from AsyncStorage
  async getCurrentUserRole() {
    try {
      const role = await AsyncStorage.getItem('userRole');
      const selectedRole = await AsyncStorage.getItem('selectedRole');
      
      // Return the selected role if available, otherwise fall back to userRole
      return selectedRole || role;
    } catch (error) {
      console.error('❌ Firebase: Error getting user role:', error);
      return null;
    }
  }

  // Switch user role (for same phone number, different role)
  async switchUserRole(newRole) {
    try {
      if (!['client', 'freelancer'].includes(newRole)) {
        throw new Error('Invalid role. Must be "client" or "freelancer"');
      }

      // Update the stored role
      await AsyncStorage.setItem('userRole', newRole);
      await AsyncStorage.setItem('selectedRole', newRole);
      
      console.log('🔄 Firebase: User role switched to:', newRole);
      return { success: true, newRole };
    } catch (error) {
      console.error('❌ Firebase: Error switching role:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user can access specific role features
  async canAccessRole(requiredRole) {
    try {
      const currentRole = await this.getCurrentUserRole();
      return currentRole === requiredRole;
    } catch (error) {
      console.error('❌ Firebase: Error checking role access:', error);
      return false;
    }
  }

  // Get user's available roles (if they have multiple)
  async getUserAvailableRoles() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        // You can extend this to check backend for available roles
        return ['client', 'freelancer']; // Default available roles
      }
      return [];
    } catch (error) {
      console.error('❌ Firebase: Error getting available roles:', error);
      return [];
    }
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
    return auth().onAuthStateChanged(callback);
  }
}

const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;
