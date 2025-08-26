const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');
const Job = require('../models/Job');
const Offer = require('../models/Offer');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/freelancing-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB for seeding'))
.catch(err => console.error('MongoDB connection error:', err));

// Seed data
const seedData = async () => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await FreelancerProfile.deleteMany({});
    await ClientProfile.deleteMany({});
    await Job.deleteMany({});
    await Offer.deleteMany({});
    await Wallet.deleteMany({});
    await Transaction.deleteMany({});

    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      phone: '9999999999',
      email: process.env.ADMIN_EMAIL || 'admin@freelancingplatform.com',
      password: process.env.ADMIN_PASSWORD || 'admin123456',
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    await adminUser.save();
    console.log('Created admin user');

    // Create test clients
    const client1 = new User({
      phone: '9876543210',
      role: 'client',
      isVerified: true,
      isActive: true
    });
    await client1.save();

    const client2 = new User({
      phone: '9876543211',
      role: 'client',
      isVerified: true,
      isActive: true
    });
    await client2.save();

    // Create client profiles
    const clientProfile1 = new ClientProfile({
      userId: client1._id,
      fullName: 'John Doe',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'male',
      address: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      },
      isProfileComplete: true,
      totalJobsPosted: 2,
      totalSpent: 2500,
      rating: 4.5
    });
    await clientProfile1.save();

    const clientProfile2 = new ClientProfile({
      userId: client2._id,
      fullName: 'Jane Smith',
      dateOfBirth: new Date('1988-12-20'),
      gender: 'female',
      address: {
        street: '456 Oak Avenue',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001'
      },
      isProfileComplete: true,
      totalJobsPosted: 1,
      totalSpent: 1500,
      rating: 4.8
    });
    await clientProfile2.save();

    // Create test freelancers
    const freelancer1 = new User({
      phone: '9876543212',
      role: 'freelancer',
      isVerified: true,
      isActive: true
    });
    await freelancer1.save();

    const freelancer2 = new User({
      phone: '9876543213',
      role: 'freelancer',
      isVerified: true,
      isActive: true
    });
    await freelancer2.save();

    const freelancer3 = new User({
      phone: '9876543214',
      role: 'freelancer',
      isVerified: false,
      isActive: true
    });
    await freelancer3.save();

    // Create freelancer profiles
    const freelancerProfile1 = new FreelancerProfile({
      userId: freelancer1._id,
      freelancerId: '12345',
      fullName: 'Mike Johnson',
      dateOfBirth: new Date('1992-08-10'),
      gender: 'male',
      address: {
        street: '789 Pine Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001'
      },
      verificationStatus: 'approved',
      isProfileComplete: true,
      rating: 4.7,
      totalJobs: 5,
      completedJobs: 5,
      totalEarnings: 3500
    });
    await freelancerProfile1.save();

    const freelancerProfile2 = new FreelancerProfile({
      userId: freelancer2._id,
      freelancerId: '67890',
      fullName: 'Sarah Wilson',
      dateOfBirth: new Date('1995-03-25'),
      gender: 'female',
      address: {
        street: '321 Elm Street',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001'
      },
      verificationStatus: 'approved',
      isProfileComplete: true,
      rating: 4.9,
      totalJobs: 3,
      completedJobs: 3,
      totalEarnings: 2200
    });
    await freelancerProfile2.save();

    const freelancerProfile3 = new FreelancerProfile({
      userId: freelancer3._id,
      fullName: 'Alex Brown',
      dateOfBirth: new Date('1993-11-05'),
      gender: 'male',
      address: {
        street: '654 Maple Drive',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001'
      },
      verificationStatus: 'under_review',
      isProfileComplete: true,
      rating: 0,
      totalJobs: 0,
      completedJobs: 0,
      totalEarnings: 0
    });
    await freelancerProfile3.save();

    // Create wallets
    const wallet1 = new Wallet({
      userId: freelancer1._id,
      balance: 1200
    });
    await wallet1.save();

    const wallet2 = new Wallet({
      userId: freelancer2._id,
      balance: 800
    });
    await wallet2.save();

    // Create test jobs
    const job1 = new Job({
      clientId: client1._id,
      title: 'House Cleaning Service',
      description: 'Need professional house cleaning service for 2BHK apartment. Must be thorough and use eco-friendly products.',
      amount: 1500,
      numberOfPeople: 1,
      address: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      },
      genderPreference: 'female',
      status: 'completed',
      assignedAt: new Date('2024-01-15'),
      workCompletedAt: new Date('2024-01-16'),
      paymentCompletedAt: new Date('2024-01-16')
    });
    await job1.save();

    const job2 = new Job({
      clientId: client1._id,
      title: 'Garden Maintenance',
      description: 'Regular garden maintenance including watering, pruning, and weeding. Garden size is 500 sq ft.',
      amount: 1000,
      numberOfPeople: 1,
      address: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      },
      genderPreference: 'any',
      status: 'assigned',
      freelancerId: freelancer1._id,
      assignedAt: new Date('2024-01-20')
    });
    await job2.save();

    const job3 = new Job({
      clientId: client2._id,
      title: 'Pet Sitting Service',
      description: 'Need someone to take care of my dog for 3 days while I\'m out of town. Dog is friendly and well-trained.',
      amount: 2000,
      numberOfPeople: 1,
      address: {
        street: '456 Oak Avenue',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001'
      },
      genderPreference: 'any',
      status: 'open'
    });
    await job3.save();

    // Create offers
    const offer1 = new Offer({
      jobId: job2._id,
      freelancerId: freelancer1._id,
      clientId: client1._id,
      originalAmount: 1000,
      offeredAmount: 1000,
      message: 'I have experience in garden maintenance and can start immediately.',
      status: 'accepted',
      offerType: 'direct_apply',
      respondedAt: new Date('2024-01-20'),
      responseMessage: 'Accepted'
    });
    await offer1.save();

    const offer2 = new Offer({
      jobId: job3._id,
      freelancerId: freelancer2._id,
      clientId: client2._id,
      originalAmount: 2000,
      offeredAmount: 1800,
      message: 'I love dogs and have experience with pet sitting. I can offer a discount.',
      status: 'pending',
      offerType: 'custom_offer'
    });
    await offer2.save();

    // Create transactions
    const transaction1 = new Transaction({
      jobId: job1._id,
      clientId: client1._id,
      freelancerId: freelancer1._id,
      amount: 1500,
      type: 'payment',
      status: 'completed',
      description: 'Payment for job: House Cleaning Service',
      paymentMethod: 'wallet',
      completedAt: new Date('2024-01-16')
    });
    await transaction1.save();

    const transaction2 = new Transaction({
      freelancerId: freelancer1._id,
      amount: 500,
      type: 'withdrawal',
      status: 'completed',
      description: 'Withdrawal request',
      paymentMethod: 'bank_transfer',
      bankDetails: {
        accountNumber: '1234567890',
        ifscCode: 'SBIN0001234',
        accountHolderName: 'Mike Johnson'
      },
      completedAt: new Date('2024-01-18')
    });
    await transaction2.save();

    console.log('Database seeded successfully!');
    console.log('\nTest Data Summary:');
    console.log('- Admin User: 9999999999 (admin@freelancingplatform.com / admin123456)');
    console.log('- Client 1: 9876543210 (John Doe)');
    console.log('- Client 2: 9876543211 (Jane Smith)');
    console.log('- Freelancer 1: 9876543212 (Mike Johnson) - ID: 12345');
    console.log('- Freelancer 2: 9876543213 (Sarah Wilson) - ID: 67890');
    console.log('- Freelancer 3: 9876543214 (Alex Brown) - Under Review');
    console.log('- Jobs: 3 (1 completed, 1 assigned, 1 open)');
    console.log('- Offers: 2 (1 accepted, 1 pending)');
    console.log('- Transactions: 2 (1 payment, 1 withdrawal)');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run seeding
seedData();
