import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseAuthService from '../../services/firebaseAuthService';
import networkTestService from '../../services/networkTest';

const AuthScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOTP = async () => {
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    setIsLoading(true);
    try {
      const fullPhoneNumber = `+91${phoneNumber}`;
      console.log('📱 Firebase: Sending OTP to:', fullPhoneNumber);
      
      // Initialize reCAPTCHA (for web, this would be different)
      firebaseAuthService.initializeRecaptcha('recaptcha-container');
      
      const result = await firebaseAuthService.sendOTP(fullPhoneNumber);
      if (result.success) {
        setShowOtpInput(true);
        setTimer(60);
        setShowSuccessModal(true);
        // Auto-hide success modal after 2 seconds
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        Alert.alert('Error', result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.trim();
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }
    if (!selectedRole) {
      Alert.alert('Error', 'Please select your role');
      return;
    }
    setIsLoading(true);
    try {
      const fullPhoneNumber = `+91${phoneNumber}`;
      console.log('📱 Firebase: Verifying OTP for:', fullPhoneNumber, 'OTP:', otpString);
      const result = await firebaseAuthService.verifyOTP(otpString, fullPhoneNumber, selectedRole);
      if (result.success && result.data && result.data.data) {
        // Store authentication data
        const token = result.data.data.token;
        const user = result.data.data.user;
        
        if (token && user) {
          await AsyncStorage.setItem('authToken', token);
          await AsyncStorage.setItem('userRole', selectedRole);
          await AsyncStorage.setItem('userData', JSON.stringify(user));
          await AsyncStorage.setItem('userId', user.id);
          await AsyncStorage.setItem('authMethod', 'otp');
          
          // Check user verification status and navigate accordingly
          const userStatus = await checkUserVerificationStatus(user.phone);

          if (userStatus.exists && userStatus.verified) {
            // Verified user - go to dashboard
            console.log('Navigating to Dashboard (verified user)');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Dashboard', params: { userRole: selectedRole } }],
            });
          } else if (userStatus.exists && !userStatus.verified && userStatus.status === 'pending') {
            // User exists but verification pending - go to verification pending
            console.log('Navigating to Verification Pending');
            navigation.reset({
              index: 0,
              routes: [{ name: 'VerificationPending', params: { userRole: selectedRole } }],
            });
          } else if (userStatus.exists && !userStatus.verified && userStatus.status === 'rejected') {
            // User exists but verification rejected - go to profile creation to resubmit
            console.log('Navigating to Profile Creation (rejected user)');
            navigation.reset({
              index: 0,
              routes: [{ name: 'ProfileCreation', params: { userRole: selectedRole, userData: user, isResubmission: true } }],
            });
          } else {
            // New user or no profile - go to profile creation
            console.log('Navigating to Profile Creation (new user)');
            navigation.reset({
              index: 0,
              routes: [{ name: 'ProfileCreation', params: { userRole: selectedRole, userData: user } }],
            });
          }
        } else {
          Alert.alert('Error', 'Invalid response data');
        }
      } else {
        Alert.alert('Error', result.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check user verification status
  const checkUserVerificationStatus = async (phoneNumber) => {
    try {
      console.log('Checking user verification status for:', phoneNumber);
      
      const result = await apiService.getVerificationStatus(phoneNumber);
      
      if (result.success) {
        console.log('User verification status:', result.data);
        return { 
          exists: result.data.exists, 
          verified: result.data.verified,
          status: result.data.status 
        };
      } else {
        console.log('Failed to check verification status, treating as new user');
        return { exists: false, verified: false };
      }
    } catch (error) {
      console.error('Error checking user verification status:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      });
      return { exists: false, verified: false };
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    setIsLoading(true);
    try {
      const fullPhoneNumber = `+91${phoneNumber}`;
      const result = await apiService.sendOTP(fullPhoneNumber);
      if (result.success) {
        setTimer(60);
        Alert.alert('Success', 'OTP resent successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNetwork = async () => {
    console.log('🔧 Testing network connectivity...');
    const result = await networkTestService.testAllConnections();
    if (result.success) {
      Alert.alert('Network Test', `✅ Connection successful!\nWorking URL: ${result.workingUrl}`);
    } else {
      Alert.alert('Network Test', '❌ No working connections found. Please check your network settings.');
    }
  };

  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.slice(0, 10);
    setPhoneNumber(limited);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Ionicons name="phone-portrait" size={80} color="#007AFF" />
            <Text style={styles.title}>Welcome to Freelancing Platform</Text>
            <Text style={styles.subtitle}>
              {showOtpInput ? 'Enter the OTP sent to your phone' : 'Enter your phone number to get started'}
            </Text>
          </View>

          {!showOtpInput && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChangeText={formatPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!isLoading}
                />
              </View>
            </View>
          )}

          {showOtpInput && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>OTP Code</Text>
              <TextInput
                style={styles.otpInput}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
              />
              <Text style={styles.otpHint}>
                Test OTPs: 828657 (+918286574914), 999999 (+919999999999), 888888 (+918888888888), 777777 (+917777777777)
              </Text>
              <TouchableOpacity
                style={[styles.resendButton, timer > 0 && styles.resendButtonDisabled]}
                onPress={handleResendOTP}
                disabled={timer > 0 || isLoading}
              >
                <Text style={[styles.resendText, timer > 0 && styles.resendTextDisabled]}>
                  {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {showOtpInput && (
            <View style={styles.roleContainer}>
              <Text style={styles.label}>Select Your Role</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    selectedRole === 'client' && styles.roleButtonSelected
                  ]}
                  onPress={() => setSelectedRole('client')}
                  disabled={isLoading}
                >
                  <Ionicons
                    name="person"
                    size={24}
                    color={selectedRole === 'client' ? '#FFFFFF' : '#007AFF'}
                  />
                  <Text style={[
                    styles.roleText,
                    selectedRole === 'client' && styles.roleTextSelected
                  ]}>
                    Client
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    selectedRole === 'freelancer' && styles.roleButtonSelected
                  ]}
                  onPress={() => setSelectedRole('freelancer')}
                  disabled={isLoading}
                >
                  <Ionicons
                    name="briefcase"
                    size={24}
                    color={selectedRole === 'freelancer' ? '#FFFFFF' : '#007AFF'}
                  />
                  <Text style={[
                    styles.roleText,
                    selectedRole === 'freelancer' && styles.roleTextSelected
                  ]}>
                    Freelancer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={showOtpInput ? handleVerifyOTP : handleSendOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={showOtpInput ? "checkmark-circle" : "send"}
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.primaryButtonText}>
                    {showOtpInput ? 'Verify & Continue' : 'Send OTP'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {showOtpInput && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setShowOtpInput(false);
                setOtp('');
                setSelectedRole(null);
                setTimer(0);
              }}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={20} color="#007AFF" />
              <Text style={styles.backButtonText}>Back to Phone Number</Text>
            </TouchableOpacity>
          )}

          {/* Network Test Button */}
          <TouchableOpacity
            style={[styles.button, styles.networkTestButton]}
            onPress={handleTestNetwork}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>🔧 Test Network Connection</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#34C759" />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>OTP sent successfully to your phone</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  otpInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    letterSpacing: 8,
  },
  otpHint: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  resendButton: {
    alignSelf: 'center',
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  resendTextDisabled: {
    color: '#999999',
  },
  roleContainer: {
    marginBottom: 30,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  roleButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  roleTextSelected: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  networkTestButton: {
    backgroundColor: '#FF9500',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 20,
    alignSelf: 'center',
  },
  button: {
    // Base button styles
  },
  buttonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default AuthScreen;
