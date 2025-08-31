import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://freelancer-backend-jv21.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - clear storage and redirect to login
      try {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userRole');
        await AsyncStorage.removeItem('userData');
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
      // Note: Navigation should be handled in the component
    }
    return Promise.reject(error);
  }
);

export default api;
