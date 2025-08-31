import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const ClientProfileScreen = ({ navigation, route }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    phone: '',
    address: '',
  });
  const [profileImage, setProfileImage] = useState(null);

  // Debug profile image state changes
  useEffect(() => {
    console.log('🔍 Profile image state changed:', profileImage);
  }, [profileImage]);

  useEffect(() => {
    loadProfileData();
  }, []);

  // Add focus listener to refresh profile image when returning to profile screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfileData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      // Get current user data to get phone number
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        throw new Error('User data not found');
      }
      const user = JSON.parse(userData);
      const phoneNumber = user.phone;
      
      // Create phone-specific storage keys
      const clientProfileKey = `clientProfile_${phoneNumber}`;
      const clientProfileImageKey = `clientProfileImage_${phoneNumber}`;
      console.log('🔍 Using phone-specific storage keys:', { clientProfileKey, clientProfileImageKey });

      // Get auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Try to load from backend API first
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/client/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();

        if (result.success && result.data.profile) {
          const profile = result.data.profile;
          setProfileData({
            fullName: profile.fullName || '',
            phone: profile.userId?.phone || '',
            address: profile.address?.street || '',
          });
          // Don't return here, continue to load profile image
        }
      } catch (apiError) {
        console.log('API not available, loading from local storage');
      }

      // Fallback to AsyncStorage with phone-specific key
      const savedProfile = await AsyncStorage.getItem(clientProfileKey);
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      } else {
        // Load basic user data
        setProfileData(prev => ({
          ...prev,
          phone: phoneNumber || '',
          fullName: user.fullName || ''
        }));
      }

      // Load saved profile image with phone-specific key
      const savedProfileImage = await AsyncStorage.getItem(clientProfileImageKey);
      console.log('🔍 Loading profile image - savedProfileImage:', savedProfileImage);
      if (savedProfileImage) {
        setProfileImage(savedProfileImage);
        console.log('✅ Profile image set from clientProfileImage');
      }

      // Also try to load from userData
      const userDataForImage = await AsyncStorage.getItem('userData');
      if (userDataForImage) {
        const userForImage = JSON.parse(userDataForImage);
        console.log('🔍 Loading profile image - userData.profileImage:', userForImage.profileImage);
        if (userForImage.profileImage && !savedProfileImage) {
          setProfileImage(userForImage.profileImage);
          console.log('✅ Profile image set from userData');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileData.fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setIsSaving(true);
    try {
      // Get auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Save to backend API
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/client/save-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profileData.fullName,
          address: profileData.address,
        })
      });

      const result = await response.json();

      if (result.success) {
        // Get current user data to get phone number
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          const phoneNumber = user.phone;
          
          // Create phone-specific storage keys
          const clientProfileKey = `clientProfile_${phoneNumber}`;
          const clientProfileImageKey = `clientProfileImage_${phoneNumber}`;
          
          // Save to AsyncStorage as backup with phone-specific keys
          await AsyncStorage.setItem(clientProfileKey, JSON.stringify(profileData));
          if (profileImage) {
            console.log('💾 Saving profile image to AsyncStorage:', profileImage);
            await AsyncStorage.setItem(clientProfileImageKey, profileImage);
            // Also save to userData for drawer display
            user.profileImage = profileImage;
            await AsyncStorage.setItem('userData', JSON.stringify(user));
            console.log('💾 Profile image also saved to userData');
          }
        }
        Alert.alert('Success', 'Profile saved successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]);
      } else {
        throw new Error(result.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfileField = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take a photo.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile photo
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('📸 Photo captured, URI:', imageUri);
        setProfileImage(imageUri);
        Alert.alert('Success', 'Photo captured successfully!');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={48} color="#FFFFFF" />
            )}
          </View>
          <TouchableOpacity style={styles.changePhotoButton} onPress={handleTakePhoto}>
            <Text style={styles.changePhotoText}>Take Photo</Text>
          </TouchableOpacity>
        </View>


        {/* Profile Form */}
        <View style={styles.formContainer}>
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, { color: '#1A1A1A' }]}
                placeholder="Enter your full name"
                placeholderTextColor="#999999"
                value={profileData.fullName}
                onChangeText={(value) => updateProfileField('fullName', value)}
                editable={!isSaving}
              />
            </View>



            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                placeholder="Phone number"
                value={profileData.phone}
                editable={false}
              />
              <Text style={styles.disabledText}>Phone number cannot be changed</Text>
            </View>
          </View>



          {/* Address Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: '#1A1A1A' }]}
                placeholder="Enter your address"
                placeholderTextColor="#999999"
                value={profileData.address}
                onChangeText={(value) => updateProfileField('address', value)}
                multiline
                numberOfLines={3}
                editable={!isSaving}
              />
            </View>


          </View>



          {/* Save Button */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.primaryButton, isSaving && styles.buttonDisabled]}
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Save Profile</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0) + 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changePhotoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  changePhotoText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E1E5E9',
    ...Platform.select({
      ios: {
        color: '#1A1A1A',
      },
      android: {
        color: '#1A1A1A',
      },
    }),
  },
  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: '#666666',
  },
  disabledText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  bottomSection: {
    marginTop: 20,
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
});

export default ClientProfileScreen;
