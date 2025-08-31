import React, { useState } from 'react';
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
  KeyboardAvoidingView,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PostJobScreen = ({ navigation }) => {
  const [isPosting, setIsPosting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    category: '',
    amount: '',
    numberOfPeople: '',
    address: '',
    genderPreference: 'any'
  });

  const jobCategories = [
    { value: 'delivery', label: 'Delivery', icon: 'car' },
    { value: 'cooking', label: 'Cooking', icon: 'restaurant' },
    { value: 'plumbing', label: 'Plumbing', icon: 'water' },
    { value: 'electrical', label: 'Electrical', icon: 'flash' },
    { value: 'cleaning', label: 'Cleaning', icon: 'brush' },
    { value: 'care_taker', label: 'Care Taker', icon: 'heart' },
    { value: 'mechanic', label: 'Mechanic', icon: 'construct' },
    { value: 'tailoring', label: 'Tailoring', icon: 'cut' },
    { value: 'saloon_spa', label: 'Saloon & Spa', icon: 'sparkles' },
    { value: 'painting', label: 'Painting', icon: 'color-palette' },
    { value: 'laundry', label: 'Laundry', icon: 'shirt' },
    { value: 'driver', label: 'Driver', icon: 'car-sport' }
  ];

  const updateJobField = (field, value) => {
    setJobData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePostJob = async () => {
    // Validation
    if (!jobData.title.trim()) {
      Alert.alert('Error', 'Please enter a job title');
      return;
    }
    if (!jobData.description.trim()) {
      Alert.alert('Error', 'Please enter a job description');
      return;
    }
    if (!jobData.category) {
      Alert.alert('Error', 'Please select a job category');
      return;
    }
    if (!jobData.amount.trim()) {
      Alert.alert('Error', 'Please enter the amount');
      return;
    }
    if (!jobData.numberOfPeople.trim()) {
      Alert.alert('Error', 'Please enter the number of people needed');
      return;
    }
    if (!jobData.address.trim()) {
      Alert.alert('Error', 'Please enter the job address');
      return;
    }

    // Validate amount
    const amount = parseFloat(jobData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Validate number of people
    const numberOfPeople = parseInt(jobData.numberOfPeople);
    if (isNaN(numberOfPeople) || numberOfPeople < 1 || numberOfPeople > 100) {
      Alert.alert('Error', 'Number of people must be between 1 and 100');
      return;
    }

    setIsPosting(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/client/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: jobData.title.trim(),
          description: jobData.description.trim(),
          category: jobData.category,
          amount: amount,
          numberOfPeople: numberOfPeople,
          address: jobData.address.trim(),
          genderPreference: jobData.genderPreference
        })
      });

      const result = await response.json();

      if (result.success) {
        // Show custom success modal instead of Alert
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to post job');
      }
    } catch (error) {
      console.error('Error posting job:', error);
      Alert.alert('Error', error.message || 'Failed to post job. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Post a Job</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.postButton, isPosting && styles.postButtonDisabled]}
            onPress={handlePostJob}
            disabled={isPosting}
          >
            {isPosting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Job Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Job Title <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, { color: '#1A1A1A' }]}
                placeholder="Enter job title"
                placeholderTextColor="#999999"
                value={jobData.title}
                onChangeText={(text) => updateJobField('title', text)}
                maxLength={100}
                editable={!isPosting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: '#1A1A1A' }]}
                placeholder="Describe the job requirements and responsibilities"
                placeholderTextColor="#999999"
                value={jobData.description}
                onChangeText={(text) => updateJobField('description', text)}
                multiline
                numberOfLines={6}
                maxLength={1000}
                editable={!isPosting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Job Category <Text style={styles.required}>*</Text></Text>
              <View style={styles.categoryGrid}>
                {jobCategories.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.categoryOption,
                      jobData.category === category.value && styles.categoryOptionSelected
                    ]}
                    onPress={() => updateJobField('category', category.value)}
                    disabled={isPosting}
                  >
                    <Ionicons
                      name={category.icon}
                      size={24}
                      color={jobData.category === category.value ? '#FFFFFF' : '#666666'}
                    />
                    <Text style={[
                      styles.categoryOptionText,
                      jobData.category === category.value && styles.categoryOptionTextSelected
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Amount (₹) <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, { color: '#1A1A1A' }]}
                  placeholder="Enter amount"
                  placeholderTextColor="#999999"
                  value={jobData.amount}
                  onChangeText={(text) => updateJobField('amount', text)}
                  keyboardType="numeric"
                  editable={!isPosting}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>People Needed <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, { color: '#1A1A1A' }]}
                  placeholder="1-100"
                  placeholderTextColor="#999999"
                  value={jobData.numberOfPeople}
                  onChangeText={(text) => updateJobField('numberOfPeople', text)}
                  keyboardType="numeric"
                  maxLength={3}
                  editable={!isPosting}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Job Address <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: '#1A1A1A' }]}
                placeholder="Enter job location/address"
                placeholderTextColor="#999999"
                value={jobData.address}
                onChangeText={(text) => updateJobField('address', text)}
                multiline
                numberOfLines={3}
                editable={!isPosting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender Preference</Text>
              <View style={styles.genderOptions}>
                {[
                  { value: 'any', label: 'Any Gender', icon: 'people' },
                  { value: 'male', label: 'Male Only', icon: 'male' },
                  { value: 'female', label: 'Female Only', icon: 'female' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.genderOption,
                      jobData.genderPreference === option.value && styles.genderOptionSelected
                    ]}
                    onPress={() => updateJobField('genderPreference', option.value)}
                    disabled={isPosting}
                  >
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={jobData.genderPreference === option.value ? '#FFFFFF' : '#666666'}
                    />
                    <Text style={[
                      styles.genderOptionText,
                      jobData.genderPreference === option.value && styles.genderOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
                  </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={60} color="#34C759" />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>Job posted successfully!</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0) + 10,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  postButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  postButtonDisabled: {
    backgroundColor: '#A0C8FF',
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
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
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    backgroundColor: '#F8F9FA',
    gap: 8,
  },
  genderOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  genderOptionTextSelected: {
    color: '#FFFFFF',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    backgroundColor: '#F8F9FA',
    gap: 8,
  },
  categoryOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  categoryOptionTextSelected: {
    color: '#FFFFFF',
  },
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    minWidth: 280,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default PostJobScreen;
