import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Modal,
  FlatList,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/firebaseAuthService';
import apiService from '../services/apiService';
import MakeOfferModal from '../components/MakeOfferModal';

const DashboardScreen = ({ navigation, route }) => {
  const { userRole } = route.params;
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [clientName, setClientName] = useState(null);
  const [freelancerName, setFreelancerName] = useState(null);
  const [freelancerId, setFreelancerId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [clientJobs, setClientJobs] = useState([]);
  const [freelancerJobs, setFreelancerJobs] = useState([]);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [activeFreelancerTab, setActiveFreelancerTab] = useState('available'); // 'available' or 'assigned'
  
  // Make Offer Modal states
  const [showMakeOfferModal, setShowMakeOfferModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Offer submission states
  const [showOfferSuccessModal, setShowOfferSuccessModal] = useState(false);
  const [offerSuccessMessage, setOfferSuccessMessage] = useState('Offer submitted successfully!');
  const [offerCooldowns, setOfferCooldowns] = useState({}); // Track cooldown for each job
  
  // Filter states for freelancer jobs
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'highToLow', 'lowToHigh'
  const [showFilters, setShowFilters] = useState(false);

  const jobCategories = [
    { value: 'all', label: 'All Categories' },
    { value: 'delivery', label: 'Delivery' },
    { value: 'cooking', label: 'Cooking' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'care_taker', label: 'Care Taker' },
    { value: 'mechanic', label: 'Mechanic' },
    { value: 'tailoring', label: 'Tailoring' },
    { value: 'saloon_spa', label: 'Saloon & Spa' },
    { value: 'painting', label: 'Painting' },
    { value: 'laundry', label: 'Laundry' },
    { value: 'driver', label: 'Driver' }
  ];

  useEffect(() => {
    loadUserData();
    loadNotifications();
    loadOfferCooldowns();
    if (userRole === 'client') {
      loadClientJobs();
    } else if (userRole === 'freelancer') {
      loadFreelancerJobs();
      loadAssignedJobs();
    }
  }, [userRole]);

  // Add focus listener to refresh profile image and jobs when returning to dashboard
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
      if (userRole === 'client') {
        loadClientJobs();
      } else if (userRole === 'freelancer') {
        loadFreelancerJobs();
        loadAssignedJobs();
      }
    });

    return unsubscribe;
  }, [navigation, userRole]);

  const loadOfferCooldowns = async () => {
    try {
      const cooldowns = {};
      const keys = await AsyncStorage.getAllKeys();
      const offerCooldownKeys = keys.filter(key => key.startsWith('offerCooldown_'));
      
      for (const key of offerCooldownKeys) {
        const jobId = key.replace('offerCooldown_', '');
        const cooldownEndTime = await AsyncStorage.getItem(key);
        if (cooldownEndTime) {
          cooldowns[jobId] = parseInt(cooldownEndTime);
        }
      }
      
      setOfferCooldowns(cooldowns);
    } catch (error) {
      console.error('Error loading offer cooldowns:', error);
    }
  };

  // Timer to update cooldowns every second
  useEffect(() => {
    const interval = setInterval(() => {
      setOfferCooldowns(prev => {
        const now = Date.now();
        const updated = {};
        let hasChanges = false;
        
        Object.keys(prev).forEach(jobId => {
          if (prev[jobId] > now) {
            updated[jobId] = prev[jobId];
          } else {
            // Cooldown expired, remove from AsyncStorage
            AsyncStorage.removeItem(`offerCooldown_${jobId}`);
            hasChanges = true;
          }
        });
        
        return hasChanges ? updated : prev;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getCooldownMinutes = (jobId) => {
    const cooldownEndTime = offerCooldowns[jobId];
    if (!cooldownEndTime) return null;
    
    const now = Date.now();
    const remainingMs = cooldownEndTime - now;
    
    if (remainingMs <= 0) return null;
    
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    return remainingMinutes;
  };

  const loadUserData = async () => {
    try {
      const user = await authService.getCurrentUser();
      setUserData(user);
      
      // Load profile image based on user role
      if (userRole === 'client') {
        const phoneNumber = user?.phone;
        if (phoneNumber) {
          const clientProfileImageKey = `clientProfileImage_${phoneNumber}`;
          const savedProfileImage = await AsyncStorage.getItem(clientProfileImageKey);
          if (savedProfileImage) {
            setProfileImage(savedProfileImage);
          }
        }
      } else if (userRole === 'freelancer') {
        const savedProfileImage = await AsyncStorage.getItem('freelancerProfileImage');
        if (savedProfileImage) {
          setProfileImage(savedProfileImage);
        }
      }

      // Load client name if user is a client
      if (userRole === 'client') {
        const phoneNumber = user?.phone;
        if (phoneNumber) {
          const clientProfileKey = `clientProfile_${phoneNumber}`;
          const savedProfile = await AsyncStorage.getItem(clientProfileKey);
          if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            if (profile.fullName && profile.fullName.trim()) {
              setClientName(profile.fullName.trim());
            }
          }
        }
      } else if (userRole === 'freelancer') {
        // Load freelancer data from API
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (token) {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/freelancer/profile`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            const result = await response.json();
            if (result.success && result.data.profile) {
              const profile = result.data.profile;
              
              // Set freelancer name
              if (profile.fullName && profile.fullName.trim()) {
                setFreelancerName(profile.fullName.trim());
              }
              
              // Set freelancer ID
              if (profile.freelancerId) {
                setFreelancerId(profile.freelancerId);
              }
              
              // Set profile image if available
              if (profile.profilePhoto) {
                setProfileImage(profile.profilePhoto);
              }
            }
          }
        } catch (error) {
          console.log('Error loading freelancer profile:', error);
          // Fallback to local storage
          const savedProfile = await AsyncStorage.getItem('freelancerProfile');
          if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            if (profile.fullName && profile.fullName.trim()) {
              setFreelancerName(profile.fullName.trim());
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClientJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const result = await apiService.getClientJobs();
      
      if (result.success && result.data) {
        const jobs = result.data.jobs || result.data.data?.jobs || [];
        console.log('🔍 Client jobs loaded:', jobs);
        setClientJobs(jobs);
      } else {
        console.error('Failed to load client jobs:', result.message);
        setClientJobs([]);
      }
    } catch (error) {
      console.error('Error loading client jobs:', error);
      setClientJobs([]);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const loadFreelancerJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const result = await apiService.getFreelancerJobs();
      
      console.log('🔍 Full API response:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        const jobs = result.data.jobs || result.data.data?.jobs || [];
        console.log('🔍 Freelancer jobs loaded:', jobs);
        setFreelancerJobs(jobs);
      } else {
        console.error('Failed to load freelancer jobs:', result.message);
        setFreelancerJobs([]);
      }
    } catch (error) {
      console.error('Error loading freelancer jobs:', error);
      setFreelancerJobs([]);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const loadAssignedJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const result = await apiService.getAssignedJobs();
      
      if (result.success && result.data) {
        const jobs = result.data.jobs || result.data.data?.jobs || [];
        console.log('🔍 Assigned jobs loaded:', jobs);
        setAssignedJobs(jobs);
      } else {
        console.error('Failed to load assigned jobs:', result.message);
        setAssignedJobs([]);
      }
    } catch (error) {
      console.error('Error loading assigned jobs:', error);
      setAssignedJobs([]);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Filter and sort jobs
  const getFilteredAndSortedJobs = (jobs) => {
    let filteredJobs = [...jobs];

    // Apply category filter
    if (categoryFilter !== 'all') {
      filteredJobs = filteredJobs.filter(job => job.category === categoryFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filteredJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filteredJobs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'highToLow':
        filteredJobs.sort((a, b) => {
          const aAmount = a.amount || 0;
          const bAmount = b.amount || 0;
          return bAmount - aAmount;
        });
        break;
      case 'lowToHigh':
        filteredJobs.sort((a, b) => {
          const aAmount = a.amount || 0;
          const bAmount = b.amount || 0;
          return aAmount - bAmount;
        });
        break;
      default:
        break;
    }

    return filteredJobs;
  };

  const loadNotifications = () => {
    // Mock notifications - replace with real API call
    const mockNotifications = [
      {
        id: '1',
        title: 'Profile Approved',
        message: 'Your profile has been approved successfully!',
        time: '2 hours ago',
        type: 'success',
        read: false
      },
      {
        id: '2',
        title: 'New Job Available',
        message: 'A new job matching your skills is available',
        time: '1 day ago',
        type: 'info',
        read: true
      },
      {
        id: '3',
        title: 'Payment Received',
        message: 'You received ₹5000 for completed work',
        time: '2 days ago',
        type: 'success',
        read: true
      }
    ];
    setNotifications(mockNotifications);
  };

  const handleLogout = async () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    setIsLoggingOut(true);
    try {
      const result = await authService.signOut();
      if (result.success) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
      } else {
        Alert.alert('Error', 'Failed to logout. Please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getStats = () => {
    if (userRole === 'client') {
      return [
        { label: 'Active Jobs', value: '0', icon: 'briefcase-outline', color: '#007AFF' },
        { label: 'Completed', value: '0', icon: 'checkmark-circle-outline', color: '#34C759' },
        { label: 'Total Spent', value: '₹0', icon: 'card-outline', color: '#FF9500' },
        { label: 'Hired', value: '0', icon: 'people-outline', color: '#AF52DE' },
      ];
    } else {
      return [
        { label: 'Available Jobs', value: '0', icon: 'briefcase-outline', color: '#007AFF' },
        { label: 'Assigned Jobs', value: '0', icon: 'checkmark-circle-outline', color: '#34C759' },
      ];
    }
  };

  const getDrawerMenuItems = () => {
    if (userRole === 'client') {
      return [
        { icon: 'add-circle-outline', title: 'Post a Job', action: () => navigation.navigate('PostJob') },
        { icon: 'search-outline', title: 'Find Freelancers', action: () => Alert.alert('Coming Soon', 'Find freelancers feature will be available soon!') },
        { icon: 'chatbubbles-outline', title: 'Messages', action: () => Alert.alert('Coming Soon', 'Messages feature will be available soon!') },
        { icon: 'briefcase-outline', title: 'My Jobs', action: () => Alert.alert('Coming Soon', 'My jobs feature will be available soon!') },
        { icon: 'card-outline', title: 'Payments', action: () => Alert.alert('Coming Soon', 'Payments feature will be available soon!') },
        { icon: 'person-outline', title: 'Profile', action: () => navigation.navigate('ClientProfile') },
        { icon: 'settings-outline', title: 'Settings', action: () => Alert.alert('Coming Soon', 'Settings feature will be available soon!') },
        { icon: 'help-circle-outline', title: 'Help & Support', action: () => Alert.alert('Coming Soon', 'Help & Support feature will be available soon!') },
        { icon: 'log-out-outline', title: 'Logout', action: handleLogout, isLogout: true },
      ];
    } else {
      return [
        { icon: 'search-outline', title: 'Find Jobs', action: () => Alert.alert('Coming Soon', 'Find jobs feature will be available soon!') },
        { icon: 'chatbubbles-outline', title: 'Messages', action: () => Alert.alert('Coming Soon', 'Messages feature will be available soon!') },
        { icon: 'briefcase-outline', title: 'My Work', action: () => navigation.navigate('MyWork', { userRole }) },
        { icon: 'wallet-outline', title: 'Earnings', action: () => Alert.alert('Coming Soon', 'Earnings feature will be available soon!') },
        { icon: 'person-outline', title: 'Profile', action: () => navigation.navigate('FreelancerProfile') },
        { icon: 'settings-outline', title: 'Settings', action: () => Alert.alert('Coming Soon', 'Settings feature will be available soon!') },
        { icon: 'help-circle-outline', title: 'Help & Support', action: () => Alert.alert('Coming Soon', 'Help & Support feature will be available soon!') },
        { icon: 'log-out-outline', title: 'Logout', action: handleLogout, isLogout: true },
      ];
    }
  };

  const renderJobItem = ({ item }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{item.title}</Text>
        <Text style={styles.jobBudget}>₹{item.budget}</Text>
      </View>
      <Text style={styles.jobDescription}>{item.description}</Text>
      <View style={styles.jobFooter}>
        <View style={styles.jobTags}>
          {item.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.applyButton}>
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderClientJobItem = ({ item }) => {
    // Format address from object to string
    const formatAddress = (address) => {
      if (!address) return 'Location not specified';
      if (typeof address === 'string') return address;
      
      // If it's an object, check for street first (from PostJobScreen)
      if (address.street) return address.street;
      
      // Fallback to full address object
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.pincode) parts.push(address.pincode);
      
      return parts.length > 0 ? parts.join(', ') : 'Location not specified';
    };

    // Format status for display
    const formatStatus = (status) => {
      switch (status) {
        case 'open': return 'Active';
        case 'assigned': return 'Assigned';
        case 'work_done': return 'Work Done';
        case 'waiting_for_payment': return 'Payment Pending';
        case 'completed': return 'Completed';
        case 'cancelled': return 'Cancelled';
        default: return status;
      }
    };

    const formatCategory = (category) => {
      switch (category) {
        case 'delivery': return 'Delivery';
        case 'cooking': return 'Cooking';
        case 'plumbing': return 'Plumbing';
        case 'electrical': return 'Electrical';
        case 'cleaning': return 'Cleaning';
        case 'care_taker': return 'Care Taker';
        case 'mechanic': return 'Mechanic';
        case 'tailoring': return 'Tailoring';
        case 'saloon_spa': return 'Saloon & Spa';
        case 'painting': return 'Painting';
        case 'laundry': return 'Laundry';
        case 'driver': return 'Driver';
        default: return category;
      }
    };

    return (
      <View style={styles.clientJobCard}>
                          <View style={styles.clientJobHeader}>
                    <View style={styles.clientJobTitleSection}>
                      <Text style={styles.clientJobTitle}>{item.title}</Text>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{formatCategory(item.category)}</Text>
                      </View>
                    </View>
                    <View style={styles.clientJobStatus}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.deleteJobButton}
                        onPress={() => handleDeleteJob(item)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>
        <Text style={styles.clientJobDescription}>{item.description}</Text>
        <View style={styles.clientJobDetails}>
          <View style={styles.clientJobDetail}>
            <Ionicons name="cash-outline" size={16} color="#666" />
            <Text style={styles.clientJobDetailText}>₹{item.amount}</Text>
          </View>
          <View style={styles.clientJobDetail}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.clientJobDetailText}>{item.numberOfPeople} people</Text>
          </View>
          <View style={styles.clientJobDetail}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.clientJobDetailText}>{formatAddress(item.address)}</Text>
          </View>
        </View>
        <View style={styles.clientJobFooter}>
          <Text style={styles.clientJobDate}>
            Posted {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <TouchableOpacity 
            style={styles.viewApplicationsButton}
            onPress={() => handleViewApplications(item)}
          >
            <Text style={styles.viewApplicationsText}>View Offers</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleViewApplications = (job) => {
    navigation.navigate('OffersScreen', { job });
  };

  const handleMakeOffer = (job) => {
    setSelectedJob(job);
    setShowMakeOfferModal(true);
  };

  const handleSubmitOffer = async (offerData) => {
    try {
      const result = await apiService.applyForJob(selectedJob._id, offerData);
      
      if (result.success) {
        // Set cooldown for this job (5 minutes = 300 seconds)
        const cooldownEndTime = Date.now() + (5 * 60 * 1000);
        setOfferCooldowns(prev => ({
          ...prev,
          [selectedJob._id]: cooldownEndTime
        }));
        
        // Store cooldown in AsyncStorage for persistence
        await AsyncStorage.setItem(`offerCooldown_${selectedJob._id}`, cooldownEndTime.toString());
        
        // Show success modal with appropriate message
        const successMessage = result.data?.message === 'Offer updated successfully' 
          ? 'Offer updated successfully!' 
          : 'Offer submitted successfully!';
        
        setOfferSuccessMessage(successMessage);
        setShowOfferSuccessModal(true);
        setShowMakeOfferModal(false);
        
        // Refresh the jobs list
        loadFreelancerJobs();
      } else {
        // Check if it's a cooldown error
        if (result.data?.remainingTime) {
          const remainingMinutes = Math.ceil(result.data.remainingTime / 60);
          throw new Error(`Please wait ${remainingMinutes} minutes before making another offer.`);
        }
        throw new Error(result.message || 'Failed to submit offer');
      }
    } catch (error) {
      console.error('Submit offer error:', error);
      throw error;
    }
  };

  const handleApplyForJob = (job) => {
    Alert.alert(
      'Apply for Job',
      `Application for "${job.title}" will be available soon!`,
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const handleUpdateJobStatus = (job) => {
    Alert.alert(
      'Update Job Status',
      `Status update for "${job.title}" will be available soon!`,
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const handleWorkDone = async (job) => {
    try {
      const result = await apiService.updateJobStatus(job._id, 'work_done');
      
      if (result.success) {
        Alert.alert(
          'Success',
          'Work marked as done! Waiting for client payment.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh the jobs list
                loadAssignedJobs();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to update job status');
      }
    } catch (error) {
      console.error('Work done error:', error);
      Alert.alert('Error', 'Failed to update job status');
    }
  };

  const renderFreelancerJobItem = ({ item }) => {
    const formatAddress = (address) => {
      if (!address) return 'Location not specified';
      if (typeof address === 'string') return address;
      
      // If it's an object, check for street first (from PostJobScreen)
      if (address.street) return address.street;
      
      // Fallback to full address object
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.pincode) parts.push(address.pincode);
      
      return parts.length > 0 ? parts.join(', ') : 'Location not specified';
    };

    const formatGenderPreference = (preference) => {
      switch (preference) {
        case 'male': return 'Male only';
        case 'female': return 'Female only';
        case 'any': return 'Any gender';
        default: return preference;
      }
    };

    const formatCategory = (category) => {
      switch (category) {
        case 'delivery': return 'Delivery';
        case 'cooking': return 'Cooking';
        case 'plumbing': return 'Plumbing';
        case 'electrical': return 'Electrical';
        case 'cleaning': return 'Cleaning';
        case 'care_taker': return 'Care Taker';
        case 'mechanic': return 'Mechanic';
        case 'tailoring': return 'Tailoring';
        case 'saloon_spa': return 'Saloon & Spa';
        case 'painting': return 'Painting';
        case 'laundry': return 'Laundry';
        case 'driver': return 'Driver';
        default: return category;
      }
    };

    return (
      <View style={styles.freelancerJobCard}>
        <View style={styles.freelancerJobHeader}>
          <View style={styles.freelancerJobTitleSection}>
            <Text style={styles.freelancerJobTitle}>{item.title}</Text>
          </View>
          <View style={styles.freelancerJobStatus}>
            <View style={[styles.statusBadge, { backgroundColor: '#E3F2FD' }]}>
              <Text style={[styles.statusText, { color: '#1976D2' }]}>{formatCategory(item.category)}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.freelancerJobDescription}>{item.description}</Text>
        <View style={styles.freelancerJobDetails}>
          <View style={styles.freelancerJobDetail}>
            <Ionicons name="cash-outline" size={16} color="#666" />
            <Text style={styles.freelancerJobDetailText}>₹{item.amount}</Text>
          </View>
          <View style={styles.freelancerJobDetail}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.freelancerJobDetailText}>{item.numberOfPeople} people</Text>
          </View>
          <View style={styles.freelancerJobDetail}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.freelancerJobDetailText}>{formatAddress(item.address)}</Text>
          </View>
          <View style={styles.freelancerJobDetail}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.freelancerJobDetailText}>{formatGenderPreference(item.genderPreference)}</Text>
          </View>
        </View>
        <View style={styles.freelancerJobFooter}>
          <Text style={styles.freelancerJobDate}>
            Posted {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <View style={styles.freelancerJobButtons}>
            <TouchableOpacity 
              style={[
                styles.makeOfferButton,
                getCooldownMinutes(item._id) && styles.makeOfferButtonDisabled
              ]}
              onPress={() => handleMakeOffer(item)}
              disabled={!!getCooldownMinutes(item._id)}
            >
              <Text style={[
                styles.makeOfferButtonText,
                getCooldownMinutes(item._id) && styles.makeOfferButtonTextDisabled
              ]}>
                {getCooldownMinutes(item._id) ? `${getCooldownMinutes(item._id)}m` : 'Make Offer'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => handleApplyForJob(item)}
            >
              <Text style={styles.applyButtonText}>Apply Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const handleDeleteJob = (job) => {
    setJobToDelete(job);
    setShowDeleteModal(true);
  };

  const renderAssignedJobItem = ({ item }) => {
    const formatAddress = (address) => {
      if (!address) return 'Location not specified';
      if (typeof address === 'string') return address;
      
      // If it's an object, check for street first (from PostJobScreen)
      if (address.street) return address.street;
      
      // Fallback to full address object
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.pincode) parts.push(address.pincode);
      
      return parts.length > 0 ? parts.join(', ') : 'Location not specified';
    };

    const formatStatus = (status) => {
      switch (status) {
        case 'assigned': return 'In Progress';
        case 'work_done': return 'Work Done';
        case 'waiting_for_payment': return 'Payment Pending';
        case 'completed': return 'Completed';
        default: return status;
      }
    };

    const formatCategory = (category) => {
      switch (category) {
        case 'delivery': return 'Delivery';
        case 'cooking': return 'Cooking';
        case 'plumbing': return 'Plumbing';
        case 'electrical': return 'Electrical';
        case 'cleaning': return 'Cleaning';
        case 'care_taker': return 'Care Taker';
        case 'mechanic': return 'Mechanic';
        case 'tailoring': return 'Tailoring';
        case 'saloon_spa': return 'Saloon & Spa';
        case 'painting': return 'Painting';
        case 'laundry': return 'Laundry';
        case 'driver': return 'Driver';
        default: return category;
      }
    };

    return (
      <View style={styles.assignedJobCard}>
        <View style={styles.assignedJobHeader}>
          <View style={styles.assignedJobTitleSection}>
            <Text style={styles.assignedJobTitle}>{item.title}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{formatCategory(item.category)}</Text>
            </View>
          </View>
          <View style={styles.assignedJobStatus}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.assignedJobDescription}>{item.description}</Text>
        <View style={styles.assignedJobDetails}>
          <View style={styles.assignedJobDetail}>
            <Ionicons name="cash-outline" size={16} color="#666" />
            <Text style={styles.assignedJobDetailText}>₹{item.amount}</Text>
          </View>
          <View style={styles.assignedJobDetail}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.assignedJobDetailText}>{item.numberOfPeople} people</Text>
          </View>
          <View style={styles.assignedJobDetail}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.assignedJobDetailText}>{formatAddress(item.address)}</Text>
          </View>
        </View>
        <View style={styles.assignedJobFooter}>
          <Text style={styles.assignedJobDate}>
            Assigned {new Date(item.assignedAt || item.createdAt).toLocaleDateString()}
          </Text>
          {item.status === 'assigned' ? (
            <TouchableOpacity 
              style={styles.workDoneButton}
              onPress={() => handleWorkDone(item)}
            >
              <Text style={styles.workDoneButtonText}>Work Done</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.updateStatusButton}
              onPress={() => handleUpdateJobStatus(item)}
            >
              <Text style={styles.updateStatusButtonText}>Update Status</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/client/jobs/${jobToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setShowDeleteModal(false);
        setShowDeleteSuccessModal(true);
        // Remove the job from the list
        setClientJobs(prevJobs => prevJobs.filter(job => job._id !== jobToDelete._id));
        setJobToDelete(null);
        
        setTimeout(() => {
          setShowDeleteSuccessModal(false);
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      Alert.alert('Error', error.message || 'Failed to delete job. Please try again.');
    }
  };

  const cancelDeleteJob = () => {
    setShowDeleteModal(false);
    setJobToDelete(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return '#34C759';
      case 'assigned':
        return '#007AFF';
      case 'work_done':
        return '#FF9500';
      case 'waiting_for_payment':
        return '#AF52DE';
      case 'completed':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#FF9500';
    }
  };

  const renderNotifications = () => (
    <Modal
      visible={notificationsVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setNotificationsVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.notificationsModal}>
          <View style={styles.notificationsHeader}>
            <Text style={styles.notificationsTitle}>Notifications</Text>
            <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.notificationItem, !item.read && styles.unreadNotification]}>
                <View style={[styles.notificationIcon, { backgroundColor: `${item.type === 'success' ? '#34C759' : '#007AFF'}15` }]}>
                  <Ionicons 
                    name={item.type === 'success' ? 'checkmark-circle' : 'information-circle'} 
                    size={20} 
                    color={item.type === 'success' ? '#34C759' : '#007AFF'} 
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationMessage}>{item.message}</Text>
                  <Text style={styles.notificationTime}>{item.time}</Text>
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );

  const renderDeleteModal = () => (
    <Modal
      visible={showDeleteModal}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.deleteModal}>
          <View style={styles.deleteIcon}>
            <Ionicons name="warning" size={50} color="#FF9500" />
          </View>
          <Text style={styles.deleteTitle}>Delete Job</Text>
          <Text style={styles.deleteMessage}>
            Are you sure you want to delete "{jobToDelete?.title}"? This action cannot be undone.
          </Text>
          <View style={styles.deleteActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={cancelDeleteJob}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteConfirmButton}
              onPress={confirmDeleteJob}
            >
              <Text style={styles.deleteConfirmButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderDeleteSuccessModal = () => (
    <Modal
      visible={showDeleteSuccessModal}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.successModal}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={60} color="#34C759" />
          </View>
          <Text style={styles.successTitle}>Success!</Text>
          <Text style={styles.successMessage}>Job deleted successfully!</Text>
        </View>
      </View>
    </Modal>
  );

  const renderOfferSuccessModal = () => (
    <Modal
      visible={showOfferSuccessModal}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.successModal}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={60} color="#34C759" />
          </View>
          <Text style={styles.successTitle}>Success!</Text>
          <Text style={styles.successMessage}>{offerSuccessMessage}</Text>
          <TouchableOpacity 
            style={styles.successButton}
            onPress={() => setShowOfferSuccessModal(false)}
          >
            <Text style={styles.successButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.menuButton}>
            <Ionicons name="menu" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {userRole === 'freelancer' ? 'Freelancer' : 'Client'} Dashboard
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => setNotificationsVisible(true)} 
              style={styles.notificationButton}
            >
              <Ionicons name="notifications-outline" size={24} color="#1A1A1A" />
              {notifications.filter(n => !n.read).length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notifications.filter(n => !n.read).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      {userRole === 'client' && (
        <FlatList
          data={clientJobs}
          keyExtractor={(item) => item._id}
          renderItem={renderClientJobItem}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View>
              {/* Post Job Button */}
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.postJobButton}
                  onPress={() => navigation.navigate('PostJob')}
                >
                  <View style={styles.postJobButtonContent}>
                    <View style={styles.postJobIcon}>
                      <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.postJobText}>
                      <Text style={styles.postJobTitle}>Post a New Job</Text>
                      <Text style={styles.postJobSubtitle}>Find the perfect freelancer for your project</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Section Header */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>My Posted Jobs</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('PostJob')}>
                    <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={48} color="#CCC" />
              <Text style={styles.emptyStateText}>No jobs posted yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap the + button to post your first job</Text>
            </View>
          }
        />
      )}

      {userRole === 'freelancer' && (
        <FlatList
          data={activeFreelancerTab === 'available' 
            ? getFilteredAndSortedJobs(freelancerJobs) 
            : assignedJobs
          }
          keyExtractor={(item) => item._id}
          renderItem={activeFreelancerTab === 'available' ? renderFreelancerJobItem : renderAssignedJobItem}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Total Earned</Text>
                  <View style={styles.headerActions}>
                    {activeFreelancerTab === 'available' && (
                      <TouchableOpacity 
                        onPress={() => setShowFilters(!showFilters)}
                        style={styles.filterButton}
                      >
                        <Ionicons name="filter" size={20} color="#007AFF" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => {
                      if (activeFreelancerTab === 'available') {
                        loadFreelancerJobs();
                      } else {
                        loadAssignedJobs();
                      }
                    }}>
                      <Ionicons name="refresh-outline" size={24} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Filters for Available Jobs */}
                {activeFreelancerTab === 'available' && showFilters && (
                  <View style={styles.filtersContainer}>
                    {/* Category Filter */}
                    <View style={styles.filterSection}>
                      <Text style={styles.filterLabel}>Category</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                        {jobCategories.map((category) => (
                          <TouchableOpacity
                            key={category.value}
                            style={[
                              styles.categoryChip,
                              categoryFilter === category.value && styles.categoryChipSelected
                            ]}
                            onPress={() => setCategoryFilter(category.value)}
                          >
                            <Text style={[
                              styles.categoryChipText,
                              categoryFilter === category.value && styles.categoryChipTextSelected
                            ]}>
                              {category.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Sort Filter */}
                    <View style={styles.filterSection}>
                      <Text style={styles.filterLabel}>Sort By</Text>
                      <View style={styles.sortOptions}>
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            sortBy === 'newest' && styles.sortOptionSelected
                          ]}
                          onPress={() => setSortBy('newest')}
                        >
                          <Text style={[
                            styles.sortOptionText,
                            sortBy === 'newest' && styles.sortOptionTextSelected
                          ]}>Newest</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            sortBy === 'oldest' && styles.sortOptionSelected
                          ]}
                          onPress={() => setSortBy('oldest')}
                        >
                          <Text style={[
                            styles.sortOptionText,
                            sortBy === 'oldest' && styles.sortOptionTextSelected
                          ]}>Oldest</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            sortBy === 'highToLow' && styles.sortOptionSelected
                          ]}
                          onPress={() => setSortBy('highToLow')}
                        >
                          <Text style={[
                            styles.sortOptionText,
                            sortBy === 'highToLow' && styles.sortOptionTextSelected
                          ]}>High to Low</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            sortBy === 'lowToHigh' && styles.sortOptionSelected
                          ]}
                          onPress={() => setSortBy('lowToHigh')}
                        >
                          <Text style={[
                            styles.sortOptionText,
                            sortBy === 'lowToHigh' && styles.sortOptionTextSelected
                          ]}>Low to High</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
                
                {/* Tab Navigation */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeFreelancerTab === 'available' && styles.activeTabButton
                    ]}
                    onPress={() => setActiveFreelancerTab('available')}
                  >
                    <Text style={[
                      styles.tabButtonText,
                      activeFreelancerTab === 'available' && styles.activeTabButtonText
                    ]}>
                      Available Jobs
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeFreelancerTab === 'assigned' && styles.activeTabButton
                    ]}
                    onPress={() => setActiveFreelancerTab('assigned')}
                  >
                    <Text style={[
                      styles.tabButtonText,
                      activeFreelancerTab === 'assigned' && styles.activeTabButtonText
                    ]}>
                      Assigned Jobs
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons 
                name={activeFreelancerTab === 'available' ? 'briefcase-outline' : 'checkmark-circle-outline'} 
                size={48} 
                color="#CCC" 
              />
              <Text style={styles.emptyStateText}>
                {activeFreelancerTab === 'available' ? 'No jobs available' : 'No assigned jobs'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {activeFreelancerTab === 'available' 
                  ? 'Check back later for new opportunities' 
                  : 'Apply for jobs to get started'
                }
              </Text>
            </View>
          }
        />
      )}



      {/* Drawer Menu */}
      <Modal
        visible={drawerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDrawerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerUserInfo}>
                <View style={styles.drawerAvatar}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.drawerAvatarImage} />
                  ) : (
                    <Ionicons 
                      name={userRole === 'client' ? 'person' : 'briefcase'} 
                      size={24} 
                      color="#FFFFFF" 
                    />
                  )}
                </View>
                <View style={styles.drawerUserDetails}>
                  <Text style={styles.drawerUserName}>
                    {userRole === 'client' && clientName ? clientName : 
                     userRole === 'freelancer' && freelancerName ? freelancerName : 
                     (userData?.phone || '+91 XXXXXXXXXX')}
                  </Text>
                  <Text style={styles.drawerUserRole}>
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    {userRole === 'freelancer' && freelancerId && ` • ID: ${freelancerId}`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setDrawerVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={getDrawerMenuItems()}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.drawerItem, item.isLogout && styles.logoutDrawerItem]}
                  onPress={() => {
                    setDrawerVisible(false);
                    if (item.isLogout && isLoggingOut) return;
                    item.action();
                  }}
                  disabled={item.isLogout && isLoggingOut}
                >
                  {item.isLogout && isLoggingOut ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                  ) : (
                    <Ionicons name={item.icon} size={20} color={item.isLogout ? "#FF3B30" : "#666"} />
                  )}
                  <Text style={[styles.drawerItemText, item.isLogout && styles.logoutDrawerItemText]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      {renderNotifications()}

                {/* Logout Confirmation Modal */}
                <Modal
                  visible={logoutModalVisible}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setLogoutModalVisible(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.logoutModal}>
                      <View style={styles.logoutIconContainer}>
                        <Ionicons name="log-out-outline" size={48} color="#FF3B30" />
                      </View>
                      <Text style={styles.logoutTitle}>Confirm Logout</Text>
                      <Text style={styles.logoutMessage}>Are you sure you want to logout?</Text>
                      <View style={styles.logoutButtons}>
                        <TouchableOpacity
                          style={styles.logoutCancelButton}
                          onPress={() => setLogoutModalVisible(false)}
                        >
                          <Text style={styles.logoutCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.logoutConfirmButton}
                          onPress={confirmLogout}
                          disabled={isLoggingOut}
                        >
                          {isLoggingOut ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.logoutConfirmText}>Logout</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>

                {/* Delete Confirmation Modal */}
                {renderDeleteModal()}

                {/* Delete Success Modal */}
                {renderDeleteSuccessModal()}

                {/* Offer Success Modal */}
                {renderOfferSuccessModal()}

                {/* Make Offer Modal */}
                <MakeOfferModal
                  visible={showMakeOfferModal}
                  onClose={() => setShowMakeOfferModal(false)}
                  job={selectedJob}
                  onSubmit={handleSubmitOffer}
                />
              </View>
            );
          };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0) + 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
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
  menuButton: {
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF3B3015',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonDisabled: {
    opacity: 0.7,
  },
  welcomeSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  userDetails: {
    marginLeft: 15,
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  jobsContainer: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  jobBudget: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
  },
  jobDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  tag: {
    backgroundColor: '#E0F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  makeOfferButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  makeOfferButtonDisabled: {
    backgroundColor: '#E1E5E9',
    opacity: 0.6,
  },
  makeOfferButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  makeOfferButtonTextDisabled: {
    color: '#999999',
  },
  freelancerJobButtons: {
    flexDirection: 'row',
    gap: 20,
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
    paddingTop: 60,
  },
  drawerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  drawerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  drawerUserDetails: {
    marginLeft: 12,
    flex: 1,
  },
  drawerUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  drawerUserRole: {
    fontSize: 14,
    color: '#666666',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  drawerItemText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 16,
  },
  logoutDrawerItem: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E1E5E9',
    paddingTop: 20,
  },
  logoutDrawerItemText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  notificationsModal: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '85%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
    paddingTop: 60,
  },
  notificationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  unreadNotification: {
    backgroundColor: '#F8F9FA',
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999999',
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
  totalEarnedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  totalEarnedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalEarnedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  totalEarnedText: {
    flex: 1,
  },
  totalEarnedLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  totalEarnedValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  // Post Job Button Styles
  postJobButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  postJobButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postJobIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  postJobText: {
    flex: 1,
  },
  postJobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  postJobSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Client Job Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  clientJobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  clientJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clientJobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  clientJobStatus: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  clientJobDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  clientJobDetails: {
    marginBottom: 12,
  },
  clientJobDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  clientJobDetailText: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 6,
  },
  clientJobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  clientJobDate: {
    fontSize: 12,
    color: '#999999',
  },
  viewApplicationsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewApplicationsText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
  },
  // Delete Job Button Styles
  clientJobActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteJobButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  // Delete Modal Styles
  deleteModal: {
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
    minWidth: 320,
  },
  deleteIcon: {
    marginBottom: 20,
  },
  deleteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  deleteMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  deleteConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // Success Modal Styles (reused for delete success)
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
    marginBottom: 20,
  },
  successButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Freelancer Job Card Styles
  freelancerJobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  freelancerJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  freelancerJobTitleSection: {
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  freelancerJobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  freelancerJobStatus: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  freelancerJobDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  freelancerJobDetails: {
    marginBottom: 12,
  },
  freelancerJobDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  freelancerJobDetailText: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 6,
  },
  freelancerJobFooter: {
    flexDirection: 'column',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  freelancerJobDate: {
    fontSize: 12,
    color: '#999999',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  applyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Tab Navigation Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  // Assigned Job Card Styles
  assignedJobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  assignedJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assignedJobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  assignedJobStatus: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  assignedJobDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  assignedJobDetails: {
    marginBottom: 12,
  },
  assignedJobDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  assignedJobDetailText: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 6,
  },
  assignedJobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  assignedJobDate: {
    fontSize: 12,
    color: '#999999',
  },
  updateStatusButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  updateStatusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  workDoneButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  workDoneButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Logout Modal Styles
  logoutModal: {
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
  logoutIconContainer: {
    marginBottom: 16,
  },
  logoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  logoutMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  logoutButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  logoutCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  logoutCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  logoutConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
  },
  logoutConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Filter Styles
  filtersContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E5E9',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  sortOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sortOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },
  sortOptionTextSelected: {
    color: '#FFFFFF',
  },
});

export default DashboardScreen;
