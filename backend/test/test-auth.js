const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_PHONE = '+16505550000'; // Firebase test number

// Test data
let authToken = null;
let userId = null;

// Helper function to make authenticated requests
const makeAuthRequest = (method, endpoint, data = null) => {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  if (data) {
    config.data = data;
  }

  return axios(config);
};

// Test functions
const testHealthCheck = async () => {
  try {
    console.log('🧪 Testing health check...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data.status);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
};

const testSendVerificationCode = async () => {
  try {
    console.log('🧪 Testing send verification code...');
    const response = await makeAuthRequest('POST', '/api/auth/send-verification-code', {
      phoneNumber: TEST_PHONE
    });
    
    console.log('✅ Verification code sent successfully');
    console.log('📱 Phone number:', response.data.phoneNumber);
    console.log('🔐 Verification code:', response.data.verificationCode);
    console.log('⏰ Expires in:', response.data.expiresIn);
    
    return response.data.verificationCode;
  } catch (error) {
    console.error('❌ Send verification code failed:', error.response?.data || error.message);
    return null;
  }
};

const testVerifyPhone = async (verificationCode) => {
  try {
    console.log('🧪 Testing phone verification...');
    const response = await makeAuthRequest('POST', '/api/auth/verify-phone', {
      phoneNumber: TEST_PHONE,
      verificationCode: verificationCode
    });
    
    console.log('✅ Phone verification successful');
    console.log('👤 User ID:', response.data.user.uid);
    console.log('📱 Phone:', response.data.user.phoneNumber);
    console.log('🔑 Token received');
    
    // Store token and user ID for subsequent tests
    authToken = response.data.token;
    userId = response.data.user.uid;
    
    return true;
  } catch (error) {
    console.error('❌ Phone verification failed:', error.response?.data || error.message);
    return false;
  }
};

const testGetProfile = async () => {
  try {
    console.log('🧪 Testing get profile...');
    const response = await makeAuthRequest('GET', '/api/auth/profile');
    
    console.log('✅ Profile retrieved successfully');
    console.log('👤 Profile data:', response.data.user);
    
    return true;
  } catch (error) {
    console.error('❌ Get profile failed:', error.response?.data || error.message);
    return false;
  }
};

const testUpdateProfile = async () => {
  try {
    console.log('🧪 Testing profile update...');
    const updateData = {
      displayName: 'Test User Updated',
      email: 'test@example.com'
    };
    
    const response = await makeAuthRequest('PUT', '/api/auth/profile', updateData);
    
    console.log('✅ Profile updated successfully');
    console.log('📝 Updated fields:', response.data.updatedFields);
    
    return true;
  } catch (error) {
    console.error('❌ Profile update failed:', error.response?.data || error.message);
    return false;
  }
};

const testRefreshToken = async () => {
  try {
    console.log('🧪 Testing token refresh...');
    const response = await makeAuthRequest('POST', '/api/auth/refresh-token');
    
    console.log('✅ Token refreshed successfully');
    console.log('🔄 New token received');
    
    // Update stored token
    authToken = response.data.token;
    
    return true;
  } catch (error) {
    console.error('❌ Token refresh failed:', error.response?.data || error.message);
    return false;
  }
};

const testLogout = async () => {
  try {
    console.log('🧪 Testing logout...');
    const response = await makeAuthRequest('POST', '/api/auth/logout');
    
    console.log('✅ Logout successful');
    
    // Clear stored token
    authToken = null;
    
    return true;
  } catch (error) {
    console.error('❌ Logout failed:', error.response?.data || error.message);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Firebase Authentication Backend Tests\n');
  
  try {
    // Test 1: Health check
    const healthOk = await testHealthCheck();
    if (!healthOk) {
      console.log('\n❌ Health check failed. Make sure the server is running.');
      return;
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Send verification code
    const verificationCode = await testSendVerificationCode();
    if (!verificationCode) {
      console.log('\n❌ Failed to send verification code. Stopping tests.');
      return;
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Verify phone number
    const verificationOk = await testVerifyPhone(verificationCode);
    if (!verificationOk) {
      console.log('\n❌ Phone verification failed. Stopping tests.');
      return;
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 4: Get profile
    await testGetProfile();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 5: Update profile
    await testUpdateProfile();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 6: Refresh token
    await testRefreshToken();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 7: Logout
    await testLogout();
    
    console.log('\n' + '='.repeat(50) + '\n');
    console.log('🎉 All tests completed successfully!');
    console.log('✅ Your Firebase authentication backend is working correctly.');
    
  } catch (error) {
    console.error('\n💥 Test suite failed with error:', error.message);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testHealthCheck,
  testSendVerificationCode,
  testVerifyPhone,
  testGetProfile,
  testUpdateProfile,
  testRefreshToken,
  testLogout
};
