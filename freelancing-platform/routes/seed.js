const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');
const Job = require('../models/Job');
const Offer = require('../models/Offer');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

// Seed production database
router.post('/', async (req, res) => {
  try {
    console.log('Starting production database seeding...');
    
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
      role: 'admin',
      isVerified: true,
      isActive: true,
      email: 'admin@freelancingplatform.com',
      password: 'admin123456'
    });
    await adminUser.save();
    console.log('Created admin user');

    // Create client users
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

    // Create freelancer users
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

    // Create client profiles
    const clientProfile1 = new ClientProfile({
      userId: client1._id,
      fullName: 'John Doe',
      dateOfBirth: new Date('1990-01-15'),
      gender: 'male',
      address: '123 Main Street, Mumbai, Maharashtra, 400001',
      isProfileComplete: true,
      totalJobsPosted: 2,
      totalSpent: 2500
    });
    await clientProfile1.save();

    const clientProfile2 = new ClientProfile({
      userId: client2._id,
      fullName: 'Jane Smith',
      dateOfBirth: new Date('1988-05-20'),
      gender: 'female',
      address: '456 Oak Avenue, Delhi, Delhi, 110001',
      isProfileComplete: true,
      totalJobsPosted: 1,
      totalSpent: 2000
    });
    await clientProfile2.save();

    // Create freelancer profiles
    const freelancerProfile1 = new FreelancerProfile({
      userId: freelancer1._id,
      freelancerId: '12345',
      fullName: 'Mike Johnson',
      dateOfBirth: new Date('1992-03-10'),
      gender: 'male',
      address: '789 Pine Road, Bangalore, Karnataka, 560001',
      verificationStatus: 'approved',
      isProfileComplete: true,
      rating: 4.5,
      totalJobs: 5,
      completedJobs: 4,
      totalEarnings: 3500
    });
    await freelancerProfile1.save();

    const freelancerProfile2 = new FreelancerProfile({
      userId: freelancer2._id,
      freelancerId: '67890',
      fullName: 'Sarah Wilson',
      dateOfBirth: new Date('1995-07-25'),
      gender: 'female',
      address: '321 Elm Street, Chennai, Tamil Nadu, 600001',
      verificationStatus: 'approved',
      isProfileComplete: true,
      rating: 4.2,
      totalJobs: 3,
      completedJobs: 2,
      totalEarnings: 2200
    });
    await freelancerProfile2.save();

    const freelancerProfile3 = new FreelancerProfile({
      userId: freelancer3._id,
      fullName: 'Alex Brown',
      dateOfBirth: new Date('1993-11-08'),
      gender: 'other',
      address: '654 Maple Drive, Hyderabad, Telangana, 500001',
      verificationStatus: 'under_review',
      isProfileComplete: true
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

    // Create jobs
    const job1 = new Job({
      clientId: client1._id,
      freelancerId: freelancer1._id,
      title: 'House Cleaning Service',
      description: 'Need professional cleaning for 2BHK apartment. Must be thorough and use eco-friendly products.',
      category: 'cleaning',
      amount: 1500,
      numberOfPeople: 1,
      address: '123 Main Street, Mumbai, Maharashtra, 400001',
      genderPreference: 'female',
      status: 'completed',
      assignedAt: new Date('2024-01-15'),
      workCompletedAt: new Date('2024-01-16'),
      paymentCompletedAt: new Date('2024-01-16')
    });
    await job1.save();

    const job2 = new Job({
      clientId: client1._id,
      freelancerId: freelancer1._id,
      title: 'Garden Maintenance',
      description: 'Need help with garden maintenance including pruning, weeding, and planting new flowers.',
      category: 'care_taker',
      amount: 1000,
      numberOfPeople: 1,
      address: '123 Main Street, Mumbai, Maharashtra, 400001',
      genderPreference: 'any',
      status: 'assigned',
      assignedAt: new Date('2024-01-20')
    });
    await job2.save();

    const job3 = new Job({
      clientId: client2._id,
      title: 'Pet Sitting Service',
      description: 'Need someone to take care of my dog for 3 days while I\'m out of town. Dog is friendly and well-trained.',
      category: 'care_taker',
      amount: 2000,
      numberOfPeople: 1,
      address: '456 Oak Avenue, Delhi, Delhi, 110001',
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

    console.log('Production database seeded successfully!');
    
    res.json({
      success: true,
      message: 'Production database seeded successfully!',
      data: {
        adminUser: '9999999999 (admin@freelancingplatform.com / admin123456)',
        client1: '9876543210 (John Doe)',
        client2: '9876543211 (Jane Smith)',
        freelancer1: '9876543212 (Mike Johnson) - ID: 12345',
        freelancer2: '9876543213 (Sarah Wilson) - ID: 67890',
        freelancer3: '9876543214 (Alex Brown) - Under Review',
        jobs: '3 (1 completed, 1 assigned, 1 open)',
        offers: '2 (1 accepted, 1 pending)',
        transactions: '2 (1 payment, 1 withdrawal)'
      }
    });

  } catch (error) {
    console.error('Production seeding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed production database',
      error: error.message
    });
  }
});

module.exports = router;
