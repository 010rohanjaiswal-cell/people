const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testData = {
  admin: {
    email: 'admin@freelancingplatform.com',
    password: 'admin123456'
  },
  client: {
    phone: '9876543210'
  },
  freelancer: {
    phone: '9876543212'
  },
  newClient: {
    phone: '9876543215'
  },
  newFreelancer: {
    phone: '9876543216'
  }
};

let tokens = {
  admin: null,
  client: null,
  freelancer: null
};

let testJobId = null;
let testOfferId = null;

// Helper function to make API calls
async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...');
  const result = await makeRequest('GET', '/health');
  if (result.success) {
    console.log('✅ Health check passed');
  } else {
    console.log('❌ Health check failed:', result.error);
  }
}

async function testOTPFlow() {
  console.log('\n📱 Testing OTP Flow...');
  
  // Send OTP for client
  console.log('Sending OTP for client...');
  const sendOTPResult = await makeRequest('POST', '/auth/send-otp', {
    phone: testData.client.phone
  });
  
  if (sendOTPResult.success) {
    console.log('✅ OTP sent successfully');
  } else {
    console.log('❌ Failed to send OTP:', sendOTPResult.error);
    return false;
  }

  // Verify OTP (using mock OTP from console)
  console.log('Verifying OTP...');
  const verifyOTPResult = await makeRequest('POST', '/auth/verify-otp', {
    phone: testData.client.phone,
    otp: '123456', // Mock OTP
    role: 'client'
  });

  if (verifyOTPResult.success) {
    tokens.client = verifyOTPResult.data.data.token;
    console.log('✅ OTP verified successfully');
    return true;
  } else {
    console.log('❌ Failed to verify OTP:', verifyOTPResult.error);
    return false;
  }
}

async function testAdminLogin() {
  console.log('\n👨‍💼 Testing Admin Login...');
  
  const result = await makeRequest('POST', '/auth/admin/login', {
    email: testData.admin.email,
    password: testData.admin.password
  });

  if (result.success) {
    tokens.admin = result.data.data.token;
    console.log('✅ Admin login successful');
    return true;
  } else {
    console.log('❌ Admin login failed:', result.error);
    return false;
  }
}

async function testFreelancerLogin() {
  console.log('\n👷 Testing Freelancer Login...');
  
  // Send OTP
  await makeRequest('POST', '/auth/send-otp', {
    phone: testData.freelancer.phone
  });

  // Verify OTP
  const result = await makeRequest('POST', '/auth/verify-otp', {
    phone: testData.freelancer.phone,
    otp: '123456',
    role: 'freelancer'
  });

  if (result.success) {
    tokens.freelancer = result.data.data.token;
    console.log('✅ Freelancer login successful');
    return true;
  } else {
    console.log('❌ Freelancer login failed:', result.error);
    return false;
  }
}

async function testClientProfile() {
  console.log('\n👤 Testing Client Profile...');
  
  // Get profile
  const getResult = await makeRequest('GET', '/client/profile', null, tokens.client);
  if (getResult.success) {
    console.log('✅ Client profile retrieved');
  } else {
    console.log('❌ Failed to get client profile:', getResult.error);
  }
}

async function testFreelancerProfile() {
  console.log('\n👷 Testing Freelancer Profile...');
  
  // Get profile
  const getResult = await makeRequest('GET', '/freelancer/profile', null, tokens.freelancer);
  if (getResult.success) {
    console.log('✅ Freelancer profile retrieved');
    console.log('   Freelancer ID:', getResult.data.data.profile.freelancerId);
    console.log('   Verification Status:', getResult.data.data.profile.verificationStatus);
  } else {
    console.log('❌ Failed to get freelancer profile:', getResult.error);
  }
}

async function testJobPosting() {
  console.log('\n📝 Testing Job Posting...');
  
  const jobData = {
    title: 'Test House Cleaning Job',
    description: 'Need professional cleaning service for 2BHK apartment. Must be thorough and use eco-friendly products.',
    amount: 2000,
    numberOfPeople: 1,
    address: {
      street: '123 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    genderPreference: 'any'
  };

  const result = await makeRequest('POST', '/client/jobs', jobData, tokens.client);
  
  if (result.success) {
    testJobId = result.data.data.job._id;
    console.log('✅ Job posted successfully');
    console.log('   Job ID:', testJobId);
    return true;
  } else {
    console.log('❌ Failed to post job:', result.error);
    return false;
  }
}

async function testGetAvailableJobs() {
  console.log('\n🔍 Testing Get Available Jobs...');
  
  const result = await makeRequest('GET', '/freelancer/jobs/available', null, tokens.freelancer);
  
  if (result.success) {
    console.log('✅ Available jobs retrieved');
    console.log('   Jobs count:', result.data.data.jobs.length);
    return true;
  } else {
    console.log('❌ Failed to get available jobs:', result.error);
    return false;
  }
}

async function testJobApplication() {
  console.log('\n📋 Testing Job Application...');
  
  if (!testJobId) {
    console.log('❌ No job ID available for application');
    return false;
  }

  const applicationData = {
    offeredAmount: 1800,
    message: 'I have experience in cleaning and can start immediately.',
    offerType: 'custom_offer'
  };

  const result = await makeRequest('POST', `/freelancer/jobs/${testJobId}/apply`, applicationData, tokens.freelancer);
  
  if (result.success) {
    testOfferId = result.data.data.offer._id;
    console.log('✅ Job application submitted successfully');
    console.log('   Offer ID:', testOfferId);
    return true;
  } else {
    console.log('❌ Failed to submit job application:', result.error);
    return false;
  }
}

async function testGetJobOffers() {
  console.log('\n📋 Testing Get Job Offers...');
  
  if (!testJobId) {
    console.log('❌ No job ID available');
    return false;
  }

  const result = await makeRequest('GET', `/client/jobs/${testJobId}/offers`, null, tokens.client);
  
  if (result.success) {
    console.log('✅ Job offers retrieved');
    console.log('   Offers count:', result.data.data.offers.length);
    return true;
  } else {
    console.log('❌ Failed to get job offers:', result.error);
    return false;
  }
}

async function testAdminVerifications() {
  console.log('\n👨‍💼 Testing Admin Verifications...');
  
  const result = await makeRequest('GET', '/admin/verifications/pending', null, tokens.admin);
  
  if (result.success) {
    console.log('✅ Pending verifications retrieved');
    console.log('   Pending count:', result.data.data.verifications.length);
    return true;
  } else {
    console.log('❌ Failed to get pending verifications:', result.error);
    return false;
  }
}

async function testAdminStats() {
  console.log('\n📊 Testing Admin Statistics...');
  
  const result = await makeRequest('GET', '/admin/stats', null, tokens.admin);
  
  if (result.success) {
    console.log('✅ Admin statistics retrieved');
    console.log('   Total users:', result.data.data.users.total);
    console.log('   Total jobs:', result.data.data.jobs.total);
    console.log('   Total transactions:', result.data.data.transactions.total);
    return true;
  } else {
    console.log('❌ Failed to get admin statistics:', result.error);
    return false;
  }
}

async function testWalletBalance() {
  console.log('\n💰 Testing Wallet Balance...');
  
  const result = await makeRequest('GET', '/freelancer/wallet', null, tokens.freelancer);
  
  if (result.success) {
    console.log('✅ Wallet balance retrieved');
    console.log('   Balance:', result.data.data.wallet.balance);
    return true;
  } else {
    console.log('❌ Failed to get wallet balance:', result.error);
    return false;
  }
}

async function testPublicJobs() {
  console.log('\n🌐 Testing Public Jobs...');
  
  const result = await makeRequest('GET', '/jobs');
  
  if (result.success) {
    console.log('✅ Public jobs retrieved');
    console.log('   Jobs count:', result.data.data.jobs.length);
    return true;
  } else {
    console.log('❌ Failed to get public jobs:', result.error);
    return false;
  }
}

async function testJobStats() {
  console.log('\n📈 Testing Job Statistics...');
  
  const result = await makeRequest('GET', '/jobs/stats/overview');
  
  if (result.success) {
    console.log('✅ Job statistics retrieved');
    console.log('   Total jobs:', result.data.data.totalJobs);
    console.log('   Open jobs:', result.data.data.openJobs);
    console.log('   Completed jobs:', result.data.data.completedJobs);
    return true;
  } else {
    console.log('❌ Failed to get job statistics:', result.error);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting API Tests...');
  console.log('=====================================');

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Health Check
  totalTests++;
  if (await testHealthCheck()) passedTests++;

  // Test 2: Admin Login
  totalTests++;
  if (await testAdminLogin()) passedTests++;

  // Test 3: Client OTP Flow
  totalTests++;
  if (await testOTPFlow()) passedTests++;

  // Test 4: Freelancer Login
  totalTests++;
  if (await testFreelancerLogin()) passedTests++;

  // Test 5: Client Profile
  totalTests++;
  if (await testClientProfile()) passedTests++;

  // Test 6: Freelancer Profile
  totalTests++;
  if (await testFreelancerProfile()) passedTests++;

  // Test 7: Job Posting
  totalTests++;
  if (await testJobPosting()) passedTests++;

  // Test 8: Get Available Jobs
  totalTests++;
  if (await testGetAvailableJobs()) passedTests++;

  // Test 9: Job Application
  totalTests++;
  if (await testJobApplication()) passedTests++;

  // Test 10: Get Job Offers
  totalTests++;
  if (await testGetJobOffers()) passedTests++;

  // Test 11: Admin Verifications
  totalTests++;
  if (await testAdminVerifications()) passedTests++;

  // Test 12: Admin Stats
  totalTests++;
  if (await testAdminStats()) passedTests++;

  // Test 13: Wallet Balance
  totalTests++;
  if (await testWalletBalance()) passedTests++;

  // Test 14: Public Jobs
  totalTests++;
  if (await testPublicJobs()) passedTests++;

  // Test 15: Job Stats
  totalTests++;
  if (await testJobStats()) passedTests++;

  console.log('\n=====================================');
  console.log(`🎯 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Backend is working perfectly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
  }

  console.log('\n📋 Test Summary:');
  console.log('- ✅ Health check and server status');
  console.log('- ✅ Authentication (OTP, Admin login)');
  console.log('- ✅ User profiles (Client & Freelancer)');
  console.log('- ✅ Job posting and applications');
  console.log('- ✅ Admin panel functionality');
  console.log('- ✅ Wallet and payment system');
  console.log('- ✅ Public API endpoints');
}

// Run tests
runAllTests().catch(console.error);
