import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  constructor() {
    // Production URL - this will solve all tunnel mode issues
    const productionUrl = 'https://freelancer-backend-jv21.onrender.com';
    const localBaseUrl = 'http://192.168.1.49:3001';
    
    this.baseUrls = [
      productionUrl, // Primary: Production URL (works in tunnel mode)
      localBaseUrl, // Fallback: Local IP (works in local mode)
      'http://10.0.2.2:3001', // Android emulator
      'http://localhost:3001' // Localhost
    ];
    
    this.timeout = 15000; // 15 seconds
    
    // Debug: Log the URLs being used
    console.log('🔧 ApiService initialized with URLs:', this.baseUrls);
    
    // Test network connectivity
    this.testNetworkConnectivity();
  }

  async testNetworkConnectivity() {
    console.log('🔧 Testing network connectivity...');
    const testUrls = [
      'http://192.168.1.49:3001',
      'http://localhost:3001',
      'http://10.0.2.2:3001',
      'http://127.0.0.1:3001',
      'http://192.168.1.49:10000',
      'http://localhost:10000'
    ];

    for (const url of testUrls) {
      try {
        console.log(`🌐 Testing: ${url}`);
        const response = await fetch(`${url}/api/health`, { 
          method: 'GET',
          timeout: 5000 
        });
        if (response.ok) {
          console.log(`✅ ${url} - Working!`);
          return url;
        }
      } catch (error) {
        console.log(`❌ ${url} - Failed: ${error.message}`);
      }
    }
    console.log('❌ No working connections found');
  }

  async makeRequest(endpoint, options = {}) {
    const { method = 'GET', body, headers = {}, requireAuth = false, timeout } = options;
    
    // Add auth token if required
    if (requireAuth) {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Add default headers
    headers['Content-Type'] = 'application/json';

    // Try all available URLs
    for (const baseUrl of this.baseUrls) {
      try {
        console.log(`🌐 Trying API call to: ${baseUrl}${endpoint}`);
        
        const result = await this._makeSingleRequest(baseUrl + endpoint, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          timeout: timeout || this.timeout
        });

        if (result.success) {
          return result;
        }
      } catch (error) {
        console.log(`❌ Failed with ${baseUrl}:`, error.message);
        continue;
      }
    }

    throw new Error('All network endpoints failed');
  }

  async _makeSingleRequest(url, options) {
    const { timeout = this.timeout, ...fetchOptions } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`📡 Response status: ${response.status}`);
      console.log(`📡 Response ok: ${response.ok}`);

      const data = await response.json();
      console.log(`📡 Response data:`, data);

      if (response.ok && data.success !== false) {
        console.log(`📡 Returning success response with data:`, data);
        return { success: true, data };
      } else {
        console.log(`📡 Returning error response:`, data);
        return { 
          success: false, 
          message: data.message || `HTTP ${response.status}`,
          data 
        };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      } else if (error.message.includes('Network request failed')) {
        throw new Error('Network connection failed');
      } else {
        throw error;
      }
    }
  }

  // Specific API methods
  async sendOTP(phoneNumber) {
    return this.makeRequest('/api/auth/send-otp', {
      method: 'POST',
      body: { phone: phoneNumber }
    });
  }

  async verifyOTP(phoneNumber, otp, role) {
    return this.makeRequest('/api/auth/verify-otp', {
      method: 'POST',
      body: {
        phone: phoneNumber,
        otp: otp,
        role: role
      }
    });
  }

  async getVerificationStatus(phoneNumber) {
    return this.makeRequest('/api/freelancer/verification-status', {
      method: 'POST',
      body: { phone: phoneNumber },
      requireAuth: true
    });
  }

  async getFreelancerJobs() {
    return this.makeRequest('/api/freelancer/jobs/available', {
      requireAuth: true
    });
  }

  async getAssignedJobs() {
    return this.makeRequest('/api/freelancer/jobs/assigned', {
      requireAuth: true
    });
  }

  async getClientJobs() {
    return this.makeRequest('/api/client/jobs', {
      requireAuth: true
    });
  }

  async applyForJob(jobId, offerData) {
    return this.makeRequest(`/api/freelancer/jobs/${jobId}/apply`, {
      method: 'POST',
      body: offerData,
      requireAuth: true
    });
  }

  async getJobOffers(jobId) {
    return this.makeRequest(`/api/client/jobs/${jobId}/offers`, {
      requireAuth: true,
      timeout: 30000 // 30 seconds timeout for loading offers
    });
  }

  async respondToOffer(offerId, action, message) {
    return this.makeRequest(`/api/client/offers/${offerId}/respond`, {
      method: 'POST',
      body: { action, responseMessage: message },
      requireAuth: true,
      timeout: 30000 // 30 seconds timeout for offer response
    });
  }

  async updateJobStatus(jobId, status) {
    return this.makeRequest(`/api/freelancer/jobs/${jobId}/status`, {
      method: 'PUT',
      body: { status },
      requireAuth: true,
      timeout: 30000 // 30 seconds timeout for status update
    });
  }

  // Firebase authentication with backend
  async authenticateWithFirebase(idToken, phoneNumber, role) {
    return this.makeRequest('/api/auth/firebase', {
      method: 'POST',
      body: { 
        idToken,
        phone: phoneNumber,
        role
      },
      timeout: 30000 // 30 seconds timeout for authentication
    });
  }

  async deleteJob(jobId) {
    return this.makeRequest(`/api/client/jobs/${jobId}`, {
      method: 'DELETE',
      requireAuth: true
    });
  }

  async postJob(jobData) {
    return this.makeRequest('/api/client/jobs', {
      method: 'POST',
      body: jobData,
      requireAuth: true
    });
  }

  async saveClientProfile(profileData) {
    return this.makeRequest('/api/client/profile', {
      method: 'POST',
      body: profileData,
      requireAuth: true
    });
  }

  async saveFreelancerProfile(profileData) {
    return this.makeRequest('/api/freelancer/save-profile', {
      method: 'POST',
      body: profileData,
      requireAuth: true
    });
  }

  async getClientProfile() {
    return this.makeRequest('/api/client/profile', {
      requireAuth: true
    });
  }

  async getFreelancerProfile() {
    return this.makeRequest('/api/freelancer/profile', {
      requireAuth: true
    });
  }
}

export default new ApiService();
