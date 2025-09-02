import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import apiService from '../../services/apiService';

// Create a stable component that prevents re-renders
const AuthScreen = React.memo(({ navigation }) => {
  // State management with stable references
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Simple refs to prevent rapid updates
  const isProcessingRef = useRef(false);
  const lastPhoneUpdateRef = useRef(0);
  const phoneInputRef = useRef(null);

  // Simple timer effect
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev > 1 ? prev - 1 : 0);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Intelligent throttling that adapts to typing speed
  const debouncedSetPhoneNumber = useCallback((text) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastPhoneUpdateRef.current;
    
    // Adaptive throttling: faster for normal typing, slower for rapid changes
    let throttleTime = 150; // Default: comfortable typing
    
    if (timeSinceLastUpdate < 100) {
      // Very rapid typing - increase throttle to prevent shaking
      throttleTime = 200;
    } else if (timeSinceLastUpdate < 300) {
      // Normal typing - comfortable throttle
      throttleTime = 150;
    } else {
      // Slow typing - minimal throttle
      throttleTime = 100;
    }
    
    if (timeSinceLastUpdate < throttleTime) return;
    
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    if (cleaned !== phoneNumber) {
      lastPhoneUpdateRef.current = now;
      setPhoneNumber(cleaned);
    }
  }, [phoneNumber]);

  // Memoized computed values to prevent recalculation on every render
  const isPhoneValid = useMemo(() => {
    return phoneNumber.trim().length >= 10;
  }, [phoneNumber]);

  const canSendOTP = useMemo(() => {
    return isPhoneValid && !isLoading && !isProcessingRef.current;
  }, [isPhoneValid, isLoading]);

  const canVerifyOTP = useMemo(() => {
    return otp.trim().length === 6 && selectedRole && !isLoading && !isProcessingRef.current;
  }, [otp, selectedRole, isLoading]);

  // Stable style references to prevent inline style objects
  const primaryButtonStyle = useMemo(() => [
    styles.primaryButton,
    isLoading && styles.buttonDisabled
  ], [isLoading]);

  const clientRoleButtonStyle = useMemo(() => [
    styles.roleButton,
    selectedRole === 'client' && styles.roleButtonSelected
  ], [selectedRole]);

  const freelancerRoleButtonStyle = useMemo(() => [
    styles.roleButton,
    selectedRole === 'freelancer' && styles.roleButtonSelected
  ], [selectedRole]);

  const resendButtonStyle = useMemo(() => [
    styles.resendButton,
    timer > 0 && styles.resendButtonDisabled
  ], [timer]);

  const resendTextStyle = useMemo(() => [
    styles.resendText,
    timer > 0 && styles.resendTextDisabled
  ], [timer]);

  // Ultra-stable send OTP function
  const handleSendOTP = useCallback(async () => {
    if (!canSendOTP || isProcessingRef.current) return;
    
    // Set processing flag to prevent multiple calls
    isProcessingRef.current = true;
    setIsLoading(true);
    
    try {
      const fullPhoneNumber = `+91${phoneNumber}`;
      console.log('📱 Firebase: Sending OTP to:', fullPhoneNumber);
      
      const result = await firebaseAuthService.sendOTP(fullPhoneNumber);
      if (result.success) {
        // Batch all state updates together in next tick
        requestAnimationFrame(() => {
          setShowOtpInput(true);
          setTimer(60);
          setShowSuccessModal(true);
        });
        
        // Auto-hide success modal
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 2000);
      } else {
        Alert.alert('Error', result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
      // Delay clearing processing flag to prevent rapid calls
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 300); // Reduced from 1000ms to 300ms
    }
  }, [canSendOTP, phoneNumber]);

  // Ultra-stable verify OTP function
  const handleVerifyOTP = useCallback(async () => {
    if (!canVerifyOTP || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setIsLoading(true);
    
    try {
      const fullPhoneNumber = `+91${phoneNumber}`;
      console.log('📱 Firebase: Verifying OTP for:', fullPhoneNumber, 'OTP:', otp.trim());
      
      const result = await firebaseAuthService.verifyOTP(otp.trim(), fullPhoneNumber, selectedRole);
      if (result.success && result.data && result.data.data) {
        const token = result.data.data.token;
        const user = result.data.data.user;
        
        if (token && user) {
          await AsyncStorage.setItem('authToken', token);
          await AsyncStorage.setItem('userRole', selectedRole);
          await AsyncStorage.setItem('userData', JSON.stringify(user));
          await AsyncStorage.setItem('userId', user.id);
          await AsyncStorage.setItem('authMethod', 'firebase');
          
          const userStatus = await checkUserVerificationStatus(user.phone);
          navigateBasedOnUserStatus(userStatus, selectedRole, user);
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
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 300); // Reduced from 1000ms to 300ms
    }
  }, [canVerifyOTP, phoneNumber, otp, selectedRole]);

  // Stable navigation function
  const navigateBasedOnUserStatus = useCallback((userStatus, role, user) => {
    if (userStatus.exists && userStatus.verified) {
      console.log('Navigating to Dashboard (verified user)');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard', params: { userRole: role } }],
      });
    } else if (userStatus.exists && !userStatus.verified && userStatus.status === 'pending') {
      console.log('Navigating to Verification Pending');
      navigation.reset({
        index: 0,
        routes: [{ name: 'VerificationPending', params: { userRole: role } }],
      });
    } else if (userStatus.exists && !userStatus.verified && userStatus.status === 'rejected') {
      console.log('Navigating to Profile Creation (rejected user)');
      navigation.reset({
        index: 0,
        routes: [{ name: 'ProfileCreation', params: { userRole: role, userData: user, isResubmission: true } }],
      });
    } else {
      console.log('Navigating to Profile Creation (new user)');
      navigation.reset({
        index: 0,
        routes: [{ name: 'ProfileCreation', params: { userRole: role, userData: user } }],
      });
    }
  }, [navigation]);

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
      return { exists: false, verified: false };
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0 || isProcessingRef.current) return;
    isProcessingRef.current = true;
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
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 300); // Reduced from 1000ms to 300ms
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

  // Stable event handlers to prevent inline functions
  const handleClientRoleSelect = useCallback(() => {
    setSelectedRole('client');
  }, []);

  const handleFreelancerRoleSelect = useCallback(() => {
    setSelectedRole('freelancer');
  }, []);

  const handleBackToPhone = useCallback(() => {
    setShowOtpInput(false);
    setOtp('');
    setSelectedRole(null);
    setTimer(0);
  }, []);

  const handleCloseSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
  }, []);

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
                    ref={phoneInputRef}
                    style={styles.phoneInput}
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChangeText={debouncedSetPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!isLoading}
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                  />
                </View>
                {phoneNumber.length > 0 && (
                  <Text style={styles.inputHint}>
                    {phoneNumber.length}/10 digits
                  </Text>
                )}
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
                style={resendButtonStyle}
                onPress={handleResendOTP}
                disabled={timer > 0 || isLoading}
              >
                <Text style={resendTextStyle}>
                  {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {showOtpInput && (
            <View style={styles.roleSelectionContainer}>
              <Text style={styles.label}>Select Your Role</Text>
              <View style={styles.roleButtonsContainer}>
                <TouchableOpacity
                  style={clientRoleButtonStyle}
                  onPress={handleClientRoleSelect}
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
                  style={freelancerRoleButtonStyle}
                  onPress={handleFreelancerRoleSelect}
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
              style={primaryButtonStyle}
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
              onPress={handleBackToPhone}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={20} color="#007AFF" />
              <Text style={styles.backButtonText}>Back to Phone Number</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.networkTestButton]}
            onPress={handleTestNetwork}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>🔧 Test Network Connection</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseSuccessModal}
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
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return true; // Never re-render unless props actually change
});

// Add display name for debugging
AuthScreen.displayName = 'AuthScreen';

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
    letterSpacing: 2,
  },
  otpHint: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  resendButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: '#999999',
  },
  roleSelectionContainer: {
    marginBottom: 30,
  },
  roleButtonsContainer: {
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
    borderWidth: 2,
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
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 20,
    gap: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#F1F3F4',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  networkTestButton: {
    marginTop: 20,
  },
  buttonText: {
    color: '#666666',
    fontSize: 14,
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
    maxWidth: 300,
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
  inputHint: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'right',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default AuthScreen;