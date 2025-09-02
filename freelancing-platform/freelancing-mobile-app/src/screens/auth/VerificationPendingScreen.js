import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import authService from '../../services/firebaseAuthService';

const VerificationPendingScreen = ({ navigation, route }) => {
  const { userRole } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [statusMessage, setStatusMessage] = useState('');
  const [canResubmit, setCanResubmit] = useState(false);
  const [freelancerId, setFreelancerId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    if (isCheckingStatus) {
      console.log('Already checking status, skipping...');
      return;
    }
    
    setIsLoading(true);
    setIsCheckingStatus(true);
    try {
      // Get current user's phone number
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Get auth token
      const token = await currentUser.getIdToken();
      if (!token) {
        Alert.alert('Error', 'Authentication failed');
        return;
      }

      // Call backend API to check verification status
      console.log('Making API call to:', `${process.env.EXPO_PUBLIC_API_URL}/api/freelancer/verification-status`);
      console.log('With phone:', currentUser.phone);
      console.log('With token:', token ? 'Token exists' : 'No token');
      console.log('Token value:', token);
                        console.log('Network timeout set to 15 seconds');
      
                        const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/freelancer/verification-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone: currentUser.phone }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Verification status response:', data);
        console.log('✅ Status:', data.status);
        console.log('✅ Exists:', data.exists);
        console.log('✅ Verified:', data.verified);
        console.log('✅ Rejection reason:', data.rejectionReason);
        
        setVerificationStatus(data.status || 'pending');
        
        if (data.status === 'approved') {
          setStatusMessage('Your profile has been approved! You can now start freelancing.');
          setFreelancerId(data.freelancerId || Math.floor(10000 + Math.random() * 900000));
        } else if (data.status === 'rejected') {
          setStatusMessage('Your profile was rejected. Please review and resubmit.');
          setRejectionReason(data.rejectionReason || 'Please check your documents and resubmit.');
          setCanResubmit(true);
        } else {
          setStatusMessage('Your profile is pending verification. Please wait for approval.');
        }
      } else {
        const errorData = await response.text();
        console.log('❌ Response error status:', response.status);
        console.log('❌ Response error data:', errorData);
        console.log('❌ Failed to check verification status');
        setStatusMessage(`Unable to check verification status (${response.status}). Please try again.`);
      }
    } catch (error) {
      console.error('❌ Error checking verification status:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name,
        name: error.name
      });
      
      let errorMessage = 'Failed to check verification status';
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else {
        errorMessage = `Failed to check verification status: ${error.message}`;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
      setIsCheckingStatus(false);
    }
  };

  const handleResubmit = () => {
    navigation.navigate('ProfileCreation', { userRole, isResubmit: true });
  };

  const handleGoToDashboard = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard', params: { userRole } }],
    });
  };

  const renderStatusIcon = () => {
    switch (verificationStatus) {
      case 'pending':
        return <Ionicons name="time-outline" size={80} color="#FF9500" />;
      case 'approved':
        return <Ionicons name="checkmark-circle" size={80} color="#34C759" />;
      case 'rejected':
        return <Ionicons name="close-circle" size={80} color="#FF3B30" />;
      default:
        return <Ionicons name="help-circle" size={80} color="#007AFF" />;
    }
  };

  const renderStatusContent = () => {
    switch (verificationStatus) {
      case 'pending':
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.statusTitle}>Verification Pending</Text>
            <Text style={styles.statusMessage}>{statusMessage}</Text>
            
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Ionicons name="document-text" size={24} color="#007AFF" />
                <Text style={styles.infoText}>Documents submitted</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time" size={24} color="#FF9500" />
                <Text style={styles.infoText}>Under admin review</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="notifications" size={24} color="#007AFF" />
                <Text style={styles.infoText}>You'll be notified</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={checkVerificationStatus}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#007AFF" />
              ) : (
                <>
                  <Ionicons name="refresh" size={20} color="#007AFF" />
                  <Text style={styles.refreshText}>Check Status</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );

      case 'approved':
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.statusTitle}>Verification Approved!</Text>
            <Text style={styles.statusMessage}>{statusMessage}</Text>
            
            {freelancerId && (
              <View style={styles.idContainer}>
                <Text style={styles.idLabel}>Your Freelancer ID:</Text>
                <Text style={styles.idValue}>{freelancerId}</Text>
              </View>
            )}

            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                <Text style={styles.infoText}>Profile verified</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="briefcase" size={24} color="#007AFF" />
                <Text style={styles.infoText}>Ready to work</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="search" size={24} color="#007AFF" />
                <Text style={styles.infoText}>Find jobs now</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGoToDashboard}
            >
              <Ionicons name="rocket" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Start Freelancing</Text>
            </TouchableOpacity>
          </View>
        );

      case 'rejected':
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.statusTitle}>Verification Rejected</Text>
            <Text style={styles.statusMessage}>{statusMessage}</Text>
            
            {rejectionReason && (
              <View style={styles.rejectionContainer}>
                <Text style={styles.rejectionLabel}>Reason:</Text>
                <Text style={styles.rejectionReason}>{rejectionReason}</Text>
              </View>
            )}

            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
                <Text style={styles.infoText}>Documents rejected</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="refresh" size={24} color="#007AFF" />
                <Text style={styles.infoText}>Resubmit required</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="help-circle" size={24} color="#007AFF" />
                <Text style={styles.infoText}>Check requirements</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleResubmit}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Resubmit Profile</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          {renderStatusIcon()}
          <Text style={styles.title}>Profile Verification</Text>
          <Text style={styles.subtitle}>
            {verificationStatus === 'pending' && 'We\'re reviewing your documents'}
            {verificationStatus === 'approved' && 'Congratulations! You\'re verified'}
            {verificationStatus === 'rejected' && 'Please review and resubmit'}
          </Text>
        </View>

        {renderStatusContent()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Need help? Contact support at support@freelancingplatform.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
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
  statusContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  statusMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  idContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  idLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  idValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  rejectionContainer: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  rejectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 8,
  },
  rejectionReason: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  infoContainer: {
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  refreshText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
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
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default VerificationPendingScreen;
