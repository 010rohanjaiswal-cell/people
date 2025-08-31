import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import authService from '../../services/firebaseAuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileCreationScreen = ({ navigation, route }) => {
  const { userRole, userData } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  
  // Basic information
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  
  // Documents (for freelancers)
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [aadhaarFront, setAadhaarFront] = useState(null);
  const [aadhaarBack, setAadhaarBack] = useState(null);
  const [panCard, setPanCard] = useState(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleDateConfirm = () => {
    if (selectedDay && selectedMonth && selectedYear) {
      const monthIndex = months.indexOf(selectedMonth);
      const formattedDay = selectedDay.toString().padStart(2, '0');
      const formattedMonth = (monthIndex + 1).toString().padStart(2, '0');
      const formattedDate = `${formattedDay}/${formattedMonth}/${selectedYear}`;
      setDateOfBirth(formattedDate);
      setShowDatePicker(false);
    } else {
      Alert.alert('Error', 'Please select day, month, and year');
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const [uploadingImages, setUploadingImages] = useState({
    profile: false,
    aadhaarFront: false,
    aadhaarBack: false,
    panCard: false,
  });

  const takePhoto = async (type) => {
    try {
      // Set uploading state for this specific image
      setUploadingImages(prev => ({ ...prev, [type]: true }));

      // Use 4:3 aspect ratio for profile photo, 4:3 for other photos
      const aspectRatio = type === 'profile' ? [4, 3] : [4, 3];
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Simulate upload delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        switch (type) {
          case 'profile':
            setProfilePhoto(imageUri);
            break;
          case 'aadhaarFront':
            setAadhaarFront(imageUri);
            break;
          case 'aadhaarBack':
            setAadhaarBack(imageUri);
            break;
          case 'panCard':
            setPanCard(imageUri);
            break;
        }
        
        // Success message is now shown via the green success container below each field
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      // Clear uploading state
      setUploadingImages(prev => ({ ...prev, [type]: false }));
    }
  };

  const pickImage = async (type) => {
    try {
      // Set uploading state for this specific image
      setUploadingImages(prev => ({ ...prev, [type]: true }));

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Simulate upload delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        switch (type) {
          case 'profile':
            setProfilePhoto(imageUri);
            break;
          case 'aadhaarFront':
            setAadhaarFront(imageUri);
            break;
          case 'aadhaarBack':
            setAadhaarBack(imageUri);
            break;
          case 'panCard':
            setPanCard(imageUri);
            break;
        }
        
        // Success message is now shown via the green success container below each field
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      // Clear uploading state
      setUploadingImages(prev => ({ ...prev, [type]: false }));
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!dateOfBirth.trim()) {
      Alert.alert('Error', 'Please select your date of birth');
      return false;
    }
    if (!gender.trim()) {
      Alert.alert('Error', 'Please select your gender');
      return false;
    }
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return false;
    }
    if (!profilePhoto) {
      Alert.alert('Error', 'Please upload a profile photo');
      return false;
    }
    
    // Additional validation for freelancers
    if (userRole === 'freelancer') {
      if (!aadhaarFront) {
        Alert.alert('Error', 'Please upload Aadhaar Card (Front)');
        return false;
      }
      if (!aadhaarBack) {
        Alert.alert('Error', 'Please upload Aadhaar Card (Back)');
        return false;
      }
      if (!panCard) {
        Alert.alert('Error', 'Please upload PAN Card (Front)');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      // Get authentication token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please login again.');
        return;
      }

      if (userRole === 'freelancer') {
        // Create form data for freelancer profile with images
        const formData = new FormData();
        
        // Add basic profile data
        formData.append('fullName', fullName);
        
        // Convert date from DD/MM/YYYY to ISO8601 format for backend validation
        const dateParts = dateOfBirth.split('/');
        const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; // YYYY-MM-DD format
        formData.append('dateOfBirth', isoDate);
        
        formData.append('gender', gender);
        
        // Send address as an object to match backend validation
        formData.append('address[street]', address);
        formData.append('address[city]', 'Test City');
        formData.append('address[pincode]', '123456');

        // Add profile photo
        if (profilePhoto) {
          const profilePhotoFile = {
            uri: profilePhoto,
            type: 'image/jpeg',
            name: 'profile-photo.jpg'
          };
          formData.append('profilePhoto', profilePhotoFile);
        }

        // Add Aadhaar Front
        if (aadhaarFront) {
          const aadhaarFrontFile = {
            uri: aadhaarFront,
            type: 'image/jpeg',
            name: 'aadhaar-front.jpg'
          };
          formData.append('aadhaarFront', aadhaarFrontFile);
        }

        // Add Aadhaar Back
        if (aadhaarBack) {
          const aadhaarBackFile = {
            uri: aadhaarBack,
            type: 'image/jpeg',
            name: 'aadhaar-back.jpg'
          };
          formData.append('aadhaarBack', aadhaarBackFile);
        }

        // Add PAN Card
        if (panCard) {
          const panCardFile = {
            uri: panCard,
            type: 'image/jpeg',
            name: 'pan-card.jpg'
          };
          formData.append('panFront', panCardFile);
        }

        console.log('Submitting freelancer profile with images...');
        console.log('Form data being sent:', {
          fullName,
          dateOfBirth: isoDate,
          gender,
          address: { street: address, city: 'Test City', pincode: '123456' }
        });

        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/freelancer/profile`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          Alert.alert(
            'Success',
            'Profile submitted for verification. Please wait for admin approval.',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'VerificationPending', params: { userRole } }],
                  });
                }
              }
            ]
          );
        } else {
          // Show specific validation errors if available
          let errorMessage = data.message || 'Failed to submit profile';
          if (data.errors && data.errors.length > 0) {
            errorMessage = data.errors.map(error => `${error.field}: ${error.message}`).join('\n');
          }
          Alert.alert('Validation Error', errorMessage);
        }
      } else {
        // For clients, just simulate success for now
        Alert.alert('Success', 'Profile completed successfully!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Dashboard', params: { userRole } }],
              });
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error submitting profile:', error);
      Alert.alert('Error', 'Failed to submit profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              {userRole === 'freelancer' 
                ? 'Please provide your details for verification' 
                : 'Please complete your profile to get started'
              }
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <Text style={styles.sectionSubtitle}>
              Please provide your personal details
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth *</Text>
              <TouchableOpacity
                style={[styles.input, styles.dateInput]}
                onPress={showDatePickerModal}
                disabled={isLoading}
              >
                <Text style={[styles.inputText, !dateOfBirth && styles.placeholderText]}>
                  {dateOfBirth || 'Select Date of Birth'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender <Text style={styles.required}>*</Text></Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'male' && styles.genderButtonSelected
                  ]}
                  onPress={() => setGender('male')}
                  disabled={isLoading}
                >
                  <Text style={[
                    styles.genderButtonText,
                    gender === 'male' && styles.genderButtonTextSelected
                  ]}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'female' && styles.genderButtonSelected
                  ]}
                  onPress={() => setGender('female')}
                  disabled={isLoading}
                >
                  <Text style={[
                    styles.genderButtonText,
                    gender === 'female' && styles.genderButtonTextSelected
                  ]}>
                    Female
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'other' && styles.genderButtonSelected
                  ]}
                  onPress={() => setGender('other')}
                  disabled={isLoading}
                >
                  <Text style={[
                    styles.genderButtonText,
                    gender === 'other' && styles.genderButtonTextSelected
                  ]}>
                    Other
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your address"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                editable={!isLoading}
              />
            </View>
          </View>

          {userRole === 'freelancer' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Documents for Verification</Text>
              <Text style={styles.sectionSubtitle}>
                Please upload the required documents for verification
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Profile Photo <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => takePhoto('profile')}
                  disabled={isLoading || uploadingImages.profile}
                >
                  {uploadingImages.profile ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Ionicons name="camera" size={24} color="#007AFF" />
                  )}
                  <Text style={styles.uploadButtonText}>
                    {uploadingImages.profile ? 'Taking Photo...' : (profilePhoto ? 'Photo Taken' : 'Take Profile Photo')}
                  </Text>
                </TouchableOpacity>
                {profilePhoto && (
                  <View style={styles.uploadSuccessContainer}>
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                    <Text style={styles.uploadSuccessText}>Profile photo taken successfully</Text>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Aadhaar Card (Front) <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickImage('aadhaarFront')}
                  disabled={isLoading || uploadingImages.aadhaarFront}
                >
                  {uploadingImages.aadhaarFront ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Ionicons name="document-outline" size={24} color="#007AFF" />
                  )}
                  <Text style={styles.uploadButtonText}>
                    {uploadingImages.aadhaarFront ? 'Uploading...' : (aadhaarFront ? 'Document Selected' : 'Upload Aadhaar Front')}
                  </Text>
                </TouchableOpacity>
                {aadhaarFront && (
                  <View style={styles.uploadSuccessContainer}>
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                    <Text style={styles.uploadSuccessText}>Aadhaar front uploaded successfully</Text>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Aadhaar Card (Back) <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickImage('aadhaarBack')}
                  disabled={isLoading || uploadingImages.aadhaarBack}
                >
                  {uploadingImages.aadhaarBack ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Ionicons name="document-outline" size={24} color="#007AFF" />
                  )}
                  <Text style={styles.uploadButtonText}>
                    {uploadingImages.aadhaarBack ? 'Uploading...' : (aadhaarBack ? 'Document Selected' : 'Upload Aadhaar Back')}
                  </Text>
                </TouchableOpacity>
                {aadhaarBack && (
                  <View style={styles.uploadSuccessContainer}>
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                    <Text style={styles.uploadSuccessText}>Aadhaar back uploaded successfully</Text>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>PAN Card <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickImage('panCard')}
                  disabled={isLoading || uploadingImages.panCard}
                >
                  {uploadingImages.panCard ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Ionicons name="document-outline" size={24} color="#007AFF" />
                  )}
                  <Text style={styles.uploadButtonText}>
                    {uploadingImages.panCard ? 'Uploading...' : (panCard ? 'Document Selected' : 'Upload PAN Card')}
                  </Text>
                </TouchableOpacity>
                {panCard && (
                  <View style={styles.uploadSuccessContainer}>
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                    <Text style={styles.uploadSuccessText}>PAN card uploaded successfully</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {userRole === 'freelancer' ? 'Submit for Verification' : 'Complete Profile'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date of Birth</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContainer}>
              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        selectedDay === day && styles.pickerItemSelected
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedDay === day && styles.pickerItemTextSelected
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {months.map((month) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.pickerItem,
                        selectedMonth === month && styles.pickerItemSelected
                      ]}
                      onPress={() => setSelectedMonth(month)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedMonth === month && styles.pickerItemTextSelected
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && styles.pickerItemSelected
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedYear === year && styles.pickerItemTextSelected
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleDateConfirm}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 15,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  inputText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  placeholderText: {
    color: '#999999',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  genderButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  genderButtonTextSelected: {
    color: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
    paddingBottom: 12,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    paddingVertical: 12,
    alignItems: 'center',
  },
  genderButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  genderTextSelected: {
    color: '#FFFFFF',
  },
  documentContainer: {
    marginBottom: 20,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  uploadButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  uploadText: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 8,
    fontWeight: '500',
  },
  uploadedContainer: {
    alignItems: 'center',
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  uploadedText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
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
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '80%',
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  pickerColumn: {
    width: '33%',
    alignItems: 'center',
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  pickerScroll: {
    maxHeight: 150,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    marginVertical: 5,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  pickerItemTextSelected: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  uploadSuccessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  uploadSuccessText: {
    fontSize: 14,
    color: '#34C759',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default ProfileCreationScreen;
