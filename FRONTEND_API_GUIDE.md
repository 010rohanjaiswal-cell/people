# Frontend API Integration Guide

## 🌐 API Base URLs

### Development
```
http://localhost:5000/api
```

### Production
```
https://your-backend.onrender.com/api
```

## 🔐 Authentication Flow

### 1. OTP-based Login (Mobile App)

```javascript
// Step 1: Send OTP
const sendOTP = async (phone) => {
  const response = await api.post('/auth/send-otp', { phone });
  return response.data;
};

// Step 2: Verify OTP and Login
const verifyOTP = async (phone, otp, role) => {
  const response = await api.post('/auth/verify-otp', {
    phone,
    otp,
    role // 'client' or 'freelancer'
  });
  
  // Store token
  await AsyncStorage.setItem('authToken', response.data.token);
  await AsyncStorage.setItem('userRole', response.data.user.role);
  
  return response.data;
};
```

### 2. Admin Login (Admin Panel)

```javascript
const adminLogin = async (email, password) => {
  const response = await api.post('/auth/admin/login', {
    email,
    password
  });
  
  // Store token
  localStorage.setItem('authToken', response.data.token);
  
  return response.data;
};
```

## 📱 Mobile App Integration

### API Service Setup

```javascript
// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor - add auth token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - redirect to login
      await AsyncStorage.removeItem('authToken');
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Client Features

```javascript
// src/services/clientService.js
import api from './api';

export const clientService = {
  // Profile Management
  updateProfile: (profileData) => 
    api.post('/client/profile', profileData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  getProfile: () => api.get('/client/profile'),
  
  // Job Management
  postJob: (jobData) => api.post('/client/jobs', jobData),
  getMyJobs: (status) => api.get(`/client/jobs?status=${status}`),
  getJobOffers: (jobId) => api.get(`/client/jobs/${jobId}/offers`),
  
  // Offer Management
  respondToOffer: (offerId, action, message) =>
    api.post(`/client/offers/${offerId}/respond`, {
      action, // 'accept' or 'reject'
      responseMessage: message
    }),
  
  // Payment
  payForJob: (jobId) => api.post(`/client/jobs/${jobId}/pay`),
  
  // Messaging
  getMessages: (jobId) => api.get(`/messages/job/${jobId}`),
  sendMessage: (jobId, message) =>
    api.post(`/messages/job/${jobId}`, { message }),
  markMessagesAsRead: (jobId) =>
    api.put(`/messages/job/${jobId}/read`)
};
```

### Freelancer Features

```javascript
// src/services/freelancerService.js
import api from './api';

export const freelancerService = {
  // Profile Management
  updateProfile: (profileData) =>
    api.post('/freelancer/profile', profileData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  getProfile: () => api.get('/freelancer/profile'),
  
  // Job Discovery
  getAvailableJobs: (filters = {}) =>
    api.get('/freelancer/jobs/available', { params: filters }),
  
  // Job Applications
  applyForJob: (jobId, offerData) =>
    api.post(`/freelancer/jobs/${jobId}/apply`, offerData),
  
  getMyApplications: () => api.get('/freelancer/applications'),
  
  // Work Management
  markWorkAsDone: (jobId) =>
    api.post(`/freelancer/jobs/${jobId}/work-done`),
  
  // Wallet & Payments
  getWallet: () => api.get('/freelancer/wallet'),
  requestWithdrawal: (withdrawalData) =>
    api.post('/freelancer/withdraw', withdrawalData),
  getTransactions: () => api.get('/freelancer/transactions'),
  
  // Messaging
  getMessages: (jobId) => api.get(`/messages/job/${jobId}`),
  sendMessage: (jobId, message) =>
    api.post(`/messages/job/${jobId}`, { message }),
  markMessagesAsRead: (jobId) =>
    api.put(`/messages/job/${jobId}/read`)
};
```

## 🖥️ Admin Panel Integration

### API Service Setup

```typescript
// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Admin Features

```typescript
// src/services/adminService.ts
import api from './api';

export const adminService = {
  // Authentication
  login: (email: string, password: string) =>
    api.post('/auth/admin/login', { email, password }),
  
  // Verifications
  getPendingVerifications: () => api.get('/admin/verifications/pending'),
  approveFreelancer: (profileId: string, freelancerId: string) =>
    api.post(`/admin/verifications/${profileId}/approve`, { freelancerId }),
  rejectFreelancer: (profileId: string, rejectionReason: string) =>
    api.post(`/admin/verifications/${profileId}/reject`, { rejectionReason }),
  
  // Statistics
  getStats: () => api.get('/admin/stats'),
  getDashboardData: () => api.get('/admin/dashboard'),
  
  // User Management
  getUsers: (role?: string) => api.get('/admin/users', { params: { role } }),
  getUserDetails: (userId: string) => api.get(`/admin/users/${userId}`),
  
  // Job Management
  getJobs: (status?: string) => api.get('/admin/jobs', { params: { status } }),
  getJobDetails: (jobId: string) => api.get(`/admin/jobs/${jobId}`),
  
  // Transaction Management
  getTransactions: () => api.get('/admin/transactions'),
  processWithdrawal: (transactionId: string, action: string) =>
    api.post(`/admin/transactions/${transactionId}/process-withdrawal`, { action }),
  
  // Platform Management
  getPlatformStats: () => api.get('/admin/platform-stats'),
  getRevenueData: () => api.get('/admin/revenue')
};
```

## 📊 Data Models

### User Object
```typescript
interface User {
  _id: string;
  phone: string;
  role: 'client' | 'freelancer' | 'admin';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Job Object
```typescript
interface Job {
  _id: string;
  title: string;
  description: string;
  amount: number;
  numberOfPeople: number;
  genderPreference: 'male' | 'female' | 'any';
  status: 'open' | 'assigned' | 'work_done' | 'waiting_for_payment' | 'completed';
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  client: string; // Client ID
  assignedFreelancer?: string; // Freelancer ID
  createdAt: string;
  updatedAt: string;
}
```

### Offer Object
```typescript
interface Offer {
  _id: string;
  job: string; // Job ID
  freelancer: string; // Freelancer ID
  offeredAmount: number;
  message: string;
  offerType: 'direct_apply' | 'custom_offer';
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}
```

## 🔄 Real-time Features

### WebSocket Integration (Future Enhancement)
```javascript
// For real-time messaging and notifications
import io from 'socket.io-client';

const socket = io(API_BASE_URL, {
  auth: {
    token: authToken
  }
});

// Listen for new messages
socket.on('new_message', (data) => {
  // Update UI with new message
});

// Listen for job status updates
socket.on('job_status_update', (data) => {
  // Update job status in UI
});
```

## 📱 Mobile App Screens Structure

### Authentication Screens
```
src/screens/auth/
├── LoginScreen.js          # Phone number input
├── OTPScreen.js           # OTP verification
└── RoleSelectionScreen.js # Client/Freelancer choice
```

### Client Screens
```
src/screens/client/
├── DashboardScreen.js      # Overview of jobs
├── PostJobScreen.js        # Create new job
├── MyJobsScreen.js         # List of posted jobs
├── JobDetailsScreen.js     # Job details and offers
├── OffersScreen.js         # View job offers
├── ChatScreen.js           # Messaging with freelancer
└── ProfileScreen.js        # Profile management
```

### Freelancer Screens
```
src/screens/freelancer/
├── DashboardScreen.js      # Available jobs
├── JobDetailsScreen.js     # Job details and apply
├── MyApplicationsScreen.js # Applied jobs
├── ActiveJobsScreen.js     # Assigned jobs
├── WalletScreen.js         # Balance and transactions
├── ChatScreen.js           # Messaging with client
└── ProfileScreen.js        # Profile management
```

## 🖥️ Admin Panel Pages Structure

### Pages
```
src/pages/
├── login.tsx              # Admin login
├── dashboard.tsx          # Main dashboard
├── verifications/
│   ├── index.tsx          # Pending verifications
│   └── [id].tsx           # Verification details
├── users/
│   ├── index.tsx          # User list
│   └── [id].tsx           # User details
├── jobs/
│   ├── index.tsx          # Job list
│   └── [id].tsx           # Job details
├── transactions/
│   ├── index.tsx          # Transaction list
│   └── [id].tsx           # Transaction details
└── analytics/
    ├── index.tsx          # Platform analytics
    └── revenue.tsx        # Revenue reports
```

## 🧪 Testing API Integration

### Test Endpoints
```bash
# Health check
curl http://localhost:5000/api/health

# Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'

# Verify OTP
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "123456", "role": "client"}'
```

### Postman Collection
Import the provided `Freelancing-Platform-API.postman_collection.json` for comprehensive API testing.

## 🚨 Error Handling

### Common Error Responses
```javascript
// 400 Bad Request
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "phone",
      "message": "Phone number is required"
    }
  ]
}

// 401 Unauthorized
{
  "success": false,
  "message": "Authentication required"
}

// 403 Forbidden
{
  "success": false,
  "message": "Access denied"
}

// 404 Not Found
{
  "success": false,
  "message": "Resource not found"
}

// 500 Internal Server Error
{
  "success": false,
  "message": "Something went wrong!"
}
```

### Error Handling in Frontend
```javascript
// React Native
const handleApiCall = async () => {
  try {
    const response = await api.get('/some-endpoint');
    // Handle success
  } catch (error) {
    if (error.response?.status === 401) {
      // Handle authentication error
      navigation.navigate('Login');
    } else if (error.response?.status === 400) {
      // Handle validation errors
      const errors = error.response.data.errors;
      // Display errors to user
    } else {
      // Handle other errors
      Alert.alert('Error', 'Something went wrong');
    }
  }
};
```

## 🔒 Security Best Practices

### Token Management
- Store tokens securely (AsyncStorage for mobile, localStorage for web)
- Implement token refresh mechanism
- Clear tokens on logout
- Handle token expiration gracefully

### Input Validation
- Validate all user inputs on frontend
- Sanitize data before sending to API
- Handle file uploads securely

### Error Handling
- Don't expose sensitive information in error messages
- Log errors appropriately
- Provide user-friendly error messages

## 📈 Performance Optimization

### API Calls
- Implement request caching
- Use pagination for large datasets
- Optimize image uploads
- Implement offline support

### UI/UX
- Show loading states
- Implement infinite scrolling
- Use optimistic updates
- Provide offline indicators
