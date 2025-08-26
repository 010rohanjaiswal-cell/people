const express = require('express');
const router = express.Router();
const FreelancerProfile = require('../models/FreelancerProfile');
const Job = require('../models/Job');
const Offer = require('../models/Offer');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { validationRules, handleValidationErrors } = require('../utils/validation');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const { uploadProfilePhoto, uploadDocuments, handleUploadError } = require('../middleware/upload');

// Get freelancer profile
router.get('/profile', auth, roleAuth('freelancer'), async (req, res) => {
  try {
    const profile = await FreelancerProfile.findOne({ userId: req.user._id })
      .populate('userId', 'phone role');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      data: { profile }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// Create/Update freelancer profile
router.post('/profile',
  auth,
  roleAuth('freelancer'),
  uploadDocuments,
  handleUploadError,
  validationRules.freelancerProfile,
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        fullName,
        dateOfBirth,
        gender,
        address
      } = req.body;

      // Handle file uploads
      const documents = {};
      if (req.files) {
        if (req.files.aadhaarFront) documents.aadhaarFront = req.files.aadhaarFront[0].filename;
        if (req.files.aadhaarBack) documents.aadhaarBack = req.files.aadhaarBack[0].filename;
        if (req.files.drivingLicenseFront) documents.drivingLicenseFront = req.files.drivingLicenseFront[0].filename;
        if (req.files.drivingLicenseBack) documents.drivingLicenseBack = req.files.drivingLicenseBack[0].filename;
        if (req.files.panFront) documents.panFront = req.files.panFront[0].filename;
      }

      let profile = await FreelancerProfile.findOne({ userId: req.user._id });

      if (profile) {
        // Update existing profile
        Object.assign(profile, {
          fullName,
          dateOfBirth,
          gender,
          address,
          documents: { ...profile.documents, ...documents },
          isProfileComplete: true,
          verificationStatus: 'under_review'
        });
      } else {
        // Create new profile
        profile = new FreelancerProfile({
          userId: req.user._id,
          fullName,
          dateOfBirth,
          gender,
          address,
          documents,
          isProfileComplete: true,
          verificationStatus: 'under_review'
        });
      }

      await profile.save();

      res.json({
        success: true,
        message: 'Profile saved successfully',
        data: { profile }
      });
    } catch (error) {
      console.error('Save profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save profile'
      });
    }
  }
);

// Upload profile photo
router.post('/profile/photo',
  auth,
  roleAuth('freelancer'),
  uploadProfilePhoto,
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const profile = await FreelancerProfile.findOne({ userId: req.user._id });
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }

      profile.profilePhoto = req.file.filename;
      await profile.save();

      res.json({
        success: true,
        message: 'Profile photo uploaded successfully',
        data: { profilePhoto: req.file.filename }
      });
    } catch (error) {
      console.error('Upload photo error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload photo'
      });
    }
  }
);

// Get available jobs
router.get('/jobs/available', auth, roleAuth('freelancer'), async (req, res) => {
  try {
    const { page = 1, limit = 10, gender, location } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      status: 'open',
      isActive: true
    };

    // Filter by gender preference
    if (gender && gender !== 'any') {
      query.$or = [
        { genderPreference: 'any' },
        { genderPreference: gender }
      ];
    }

    const jobs = await Job.find(query)
      .populate('clientId', 'phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get available jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available jobs'
    });
  }
});

// Get assigned jobs
router.get('/jobs/assigned', auth, roleAuth('freelancer'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      freelancerId: req.user._id
    };

    if (status) {
      query.status = status;
    }

    const jobs = await Job.find(query)
      .populate('clientId', 'phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get assigned jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assigned jobs'
    });
  }
});

// Apply for job
router.post('/jobs/:jobId/apply',
  auth,
  roleAuth('freelancer'),
  validationRules.offer,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const { offeredAmount, message, offerType = 'direct_apply' } = req.body;

      // Check if job exists and is open
      const job = await Job.findById(jobId);
      if (!job || job.status !== 'open') {
        return res.status(400).json({
          success: false,
          message: 'Job not available'
        });
      }

      // Check if already applied
      const existingOffer = await Offer.findOne({
        jobId,
        freelancerId: req.user._id,
        status: { $in: ['pending', 'accepted'] }
      });

      if (existingOffer) {
        return res.status(400).json({
          success: false,
          message: 'You have already applied for this job'
        });
      }

      // Create offer
      const offer = new Offer({
        jobId,
        freelancerId: req.user._id,
        clientId: job.clientId,
        originalAmount: job.amount,
        offeredAmount: offeredAmount || job.amount,
        message,
        offerType
      });

      await offer.save();

      // If direct apply, auto-assign job
      if (offerType === 'direct_apply') {
        job.freelancerId = req.user._id;
        job.status = 'assigned';
        job.assignedAt = new Date();
        await job.save();
      }

      res.json({
        success: true,
        message: 'Job application submitted successfully',
        data: { offer }
      });
    } catch (error) {
      console.error('Apply for job error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply for job'
      });
    }
  }
);

// Mark work as done
router.post('/jobs/:jobId/work-done',
  auth,
  roleAuth('freelancer'),
  async (req, res) => {
    try {
      const { jobId } = req.params;

      const job = await Job.findOne({
        _id: jobId,
        freelancerId: req.user._id,
        status: 'assigned'
      });

      if (!job) {
        return res.status(400).json({
          success: false,
          message: 'Job not found or not assigned to you'
        });
      }

      job.status = 'work_done';
      job.workCompletedAt = new Date();
      await job.save();

      res.json({
        success: true,
        message: 'Work marked as completed',
        data: { job }
      });
    } catch (error) {
      console.error('Mark work done error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark work as done'
      });
    }
  }
);

// Get wallet balance
router.get('/wallet', auth, roleAuth('freelancer'), async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });
    
    if (!wallet) {
      wallet = new Wallet({ userId: req.user._id });
      await wallet.save();
    }

    res.json({
      success: true,
      data: { wallet }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet'
    });
  }
});

// Get transaction history
router.get('/transactions', auth, roleAuth('freelancer'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({
      freelancerId: req.user._id
    })
      .populate('jobId', 'title')
      .populate('clientId', 'phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments({
      freelancerId: req.user._id
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions'
    });
  }
});

// Request withdrawal
router.post('/withdraw',
  auth,
  roleAuth('freelancer'),
  validationRules.withdrawal,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { amount, bankDetails } = req.body;

      // Check wallet balance
      let wallet = await Wallet.findOne({ userId: req.user._id });
      if (!wallet || wallet.balance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance'
        });
      }

      // Create withdrawal transaction
      const transaction = new Transaction({
        freelancerId: req.user._id,
        amount,
        type: 'withdrawal',
        status: 'pending',
        description: 'Withdrawal request',
        paymentMethod: 'bank_transfer',
        bankDetails
      });

      await transaction.save();

      // Deduct from wallet
      wallet.balance -= amount;
      await wallet.save();

      res.json({
        success: true,
        message: 'Withdrawal request submitted successfully',
        data: { transaction }
      });
    } catch (error) {
      console.error('Withdrawal error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process withdrawal'
      });
    }
  }
);

module.exports = router;
