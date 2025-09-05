const express = require('express');
const router = express.Router();
const ClientProfile = require('../models/ClientProfile');
const Job = require('../models/Job');
const Offer = require('../models/Offer');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const FreelancerProfile = require('../models/FreelancerProfile');
const { validationRules, handleValidationErrors } = require('../utils/validation');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const CloudinaryService = require('../utils/cloudinaryService');

// Get client profile
router.get('/profile', auth, roleAuth('client'), async (req, res) => {
  try {
    const profile = await ClientProfile.findOne({ userId: req.user._id })
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

// Create/Update client profile
router.post('/profile',
  auth,
  roleAuth('client'),
  uploadSingle,
  handleUploadError,
  validationRules.clientProfile,
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        fullName,
        dateOfBirth,
        gender,
        address
      } = req.body;

      let profile = await ClientProfile.findOne({ userId: req.user._id });

      if (profile) {
        // Update existing profile
        Object.assign(profile, {
          fullName,
          dateOfBirth,
          gender,
          address,
          isProfileComplete: true
        });
      } else {
        // Create new profile
        profile = new ClientProfile({
          userId: req.user._id,
          fullName,
          dateOfBirth,
          gender,
          address,
          isProfileComplete: true
        });
      }

      // Handle profile photo upload
      if (req.file) {
        // Upload profile photo to Cloudinary
        const profilePhotoResult = await CloudinaryService.uploadImage(
          req.file, 
          'freelancing-platform/client-profile-photos'
        );
        profile.profilePhoto = profilePhotoResult.url;
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

// Save client profile (mobile app integration)
router.post('/save-profile',
  auth,
  roleAuth('client'),
  async (req, res) => {
    try {
      const {
        fullName,
        email,
        company,
        address,
        city,
        state,
        pincode,
        bio
      } = req.body;

      // Validate required fields
      if (!fullName) {
        return res.status(400).json({
          success: false,
          message: 'Full name is required'
        });
      }

      let profile = await ClientProfile.findOne({ userId: req.user._id });

      if (profile) {
        // Update existing profile
        Object.assign(profile, {
          fullName,
          address: {
            street: address || '',
            country: 'India'
          },
          isProfileComplete: true
        });
      } else {
        // Create new profile
        profile = new ClientProfile({
          userId: req.user._id,
          fullName,
          address: {
            street: address || '',
            country: 'India'
          },
          isProfileComplete: true,
          // Set default values for required fields
          dateOfBirth: new Date('1990-01-01'), // Default date
          gender: 'other' // Default gender
        });
      }

      await profile.save();

      res.json({
        success: true,
        message: 'Profile saved successfully',
        data: { 
          profile: {
            fullName: profile.fullName,
            address: profile.address,
            isProfileComplete: profile.isProfileComplete
          }
        }
      });
    } catch (error) {
      console.error('Save client profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save profile'
      });
    }
  }
);

// Post a new job
router.post('/jobs',
  auth,
  roleAuth('client'),
  validationRules.job,
  handleValidationErrors,
  async (req, res) => {
    try {
      // Check if profile is complete
      const profile = await ClientProfile.findOne({ userId: req.user._id });
      if (!profile || !profile.isProfileComplete) {
        return res.status(400).json({
          success: false,
          message: 'Please complete your profile before posting jobs'
        });
      }

      const {
        title,
        description,
        category,
        amount,
        numberOfPeople,
        address,
        genderPreference = 'any'
      } = req.body;

      // Handle address - if it's a string, store it as street
      const addressData = typeof address === 'string' ? { street: address } : address;

      const job = new Job({
        clientId: req.user._id,
        title,
        description,
        category,
        amount,
        numberOfPeople,
        address: addressData,
        genderPreference
      });

      await job.save();

      // Update client stats
      profile.totalJobsPosted += 1;
      await profile.save();

      res.json({
        success: true,
        message: 'Job posted successfully',
        data: { job }
      });
    } catch (error) {
      console.error('Post job error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to post job'
      });
    }
  }
);

// Get client's posted jobs
router.get('/jobs', auth, roleAuth('client'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      clientId: req.user._id
    };

    if (status) {
      query.status = status;
    }

    const jobs = await Job.find(query)
      .populate('freelancerId', 'phone')
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
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get jobs'
    });
  }
});

// Delete a job
router.delete('/jobs/:jobId', auth, roleAuth('client'), async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Find the job and verify ownership
    const job = await Job.findOne({ _id: jobId, clientId: req.user._id });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or you do not have permission to delete it'
      });
    }

    // Check if job can be deleted (only open jobs can be deleted)
    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Only open jobs can be deleted'
      });
    }

    // Delete the job
    await Job.findByIdAndDelete(jobId);

    // Update client stats
    const profile = await ClientProfile.findOne({ userId: req.user._id });
    if (profile) {
      profile.totalJobsPosted = Math.max(0, profile.totalJobsPosted - 1);
      await profile.save();
    }

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job'
    });
  }
});

// Get offers for a specific job
router.get('/jobs/:jobId/offers', auth, roleAuth('client'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Verify job belongs to client
    const job = await Job.findOne({
      _id: jobId,
      clientId: req.user._id
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const query = { jobId };
    if (status) {
      query.status = status;
    }

    const offers = await Offer.find(query)
      .populate('freelancerId', 'phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Manually populate freelancer profile data
    const offersWithProfiles = await Promise.all(
      offers.map(async (offer) => {
        const freelancerProfile = await FreelancerProfile.findOne({ 
          userId: offer.freelancerId._id 
        }).select('fullName freelancerId');
        
        return {
          ...offer.toObject(),
          freelancerId: {
            ...offer.freelancerId.toObject(),
            freelancerProfile
          }
        };
      })
    );

    const total = await Offer.countDocuments(query);

    res.json({
      success: true,
      data: {
        offers: offersWithProfiles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get offers'
    });
  }
});

// Accept/Reject offer
router.post('/offers/:offerId/respond',
  auth,
  roleAuth('client'),
  async (req, res) => {
    try {
      const { offerId } = req.params;
      const { action, responseMessage } = req.body; // action: 'accept' or 'reject'

      const offer = await Offer.findById(offerId)
        .populate('jobId')
        .populate('freelancerId');

      if (!offer || offer.jobId.clientId.toString() !== req.user._id.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Offer not found'
        });
      }

      if (offer.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Offer has already been responded to'
        });
      }

      if (action === 'accept') {
        // Accept offer
        offer.status = 'accepted';
        offer.respondedAt = new Date();
        offer.responseMessage = responseMessage;

        // Update job
        const job = offer.jobId;
        job.freelancerId = offer.freelancerId._id;
        job.status = 'assigned';
        job.assignedAt = new Date();
        await job.save();

        // Reject all other offers for this job
        await Offer.updateMany(
          {
            jobId: offer.jobId._id,
            _id: { $ne: offerId },
            status: 'pending'
          },
          {
            status: 'rejected',
            respondedAt: new Date(),
            responseMessage: 'Another offer was accepted'
          }
        );
      } else if (action === 'reject') {
        // Reject offer
        offer.status = 'rejected';
        offer.respondedAt = new Date();
        offer.responseMessage = responseMessage;
      }

      await offer.save();

      res.json({
        success: true,
        message: `Offer ${action}ed successfully`,
        data: { offer }
      });
    } catch (error) {
      console.error('Respond to offer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to respond to offer'
      });
    }
  }
);

// Pay for completed job (Legacy wallet payment)
router.post('/jobs/:jobId/pay',
  auth,
  roleAuth('client'),
  async (req, res) => {
    try {
      const { jobId } = req.params;

      const job = await Job.findOne({
        _id: jobId,
        clientId: req.user._id,
        status: 'work_done'
      }).populate('freelancerId');

      if (!job) {
        return res.status(400).json({
          success: false,
          message: 'Job not found or not ready for payment'
        });
      }

      // Get or create client wallet
      let clientWallet = await Wallet.findOne({ userId: req.user._id });
      if (!clientWallet) {
        clientWallet = new Wallet({ userId: req.user._id });
        await clientWallet.save();
      }

      // Get or create freelancer wallet
      let freelancerWallet = await Wallet.findOne({ userId: job.freelancerId._id });
      if (!freelancerWallet) {
        freelancerWallet = new Wallet({ userId: job.freelancerId._id });
        await freelancerWallet.save();
      }

      // Create payment transaction
      const transaction = new Transaction({
        jobId: job._id,
        clientId: req.user._id,
        freelancerId: job.freelancerId._id,
        amount: job.amount,
        type: 'payment',
        status: 'completed',
        description: `Payment for job: ${job.title}`,
        paymentMethod: 'wallet',
        completedAt: new Date()
      });

      await transaction.save();

      // Update job status
      job.status = 'completed';
      job.paymentCompletedAt = new Date();
      await job.save();

      // Process commission and update wallets
      const commissionService = require('../utils/commissionService');
      const commissionResult = await commissionService.processCommission({
        jobId: job._id,
        clientId: req.user._id,
        freelancerId: job.freelancerId._id,
        amount: job.amount,
        transactionId: transaction.referenceId,
        paymentMethod: 'wallet'
      });

      if (!commissionResult.success) {
        console.error('Commission processing failed:', commissionResult.error);
      }

      // Update freelancer stats with commission-adjusted amount
      const freelancerProfile = await FreelancerProfile.findOne({ userId: job.freelancerId._id });
      if (freelancerProfile) {
        freelancerProfile.totalJobs += 1;
        freelancerProfile.completedJobs += 1;
        freelancerProfile.totalEarnings += commissionResult.data.commissionDetails.freelancerAmount;
        await freelancerProfile.save();
      }

      // Update client stats
      const clientProfile = await ClientProfile.findOne({ userId: req.user._id });
      if (clientProfile) {
        clientProfile.totalSpent += job.amount;
        await clientProfile.save();
      }

      res.json({
        success: true,
        message: 'Payment completed successfully',
        data: { transaction, job }
      });
    } catch (error) {
      console.error('Payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process payment'
      });
    }
  }
);

// Search freelancers by ID
router.get('/search/freelancers', auth, roleAuth('client'), async (req, res) => {
  try {
    const { freelancerId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (freelancerId) {
      query.freelancerId = freelancerId;
    }

    const freelancers = await FreelancerProfile.find(query)
      .populate('userId', 'phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FreelancerProfile.countDocuments(query);

    res.json({
      success: true,
      data: {
        freelancers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Search freelancers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search freelancers'
    });
  }
});

// Get client's transaction history
router.get('/transactions', auth, roleAuth('client'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({
      clientId: req.user._id
    })
      .populate('jobId', 'title')
      .populate('freelancerId', 'phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments({
      clientId: req.user._id
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

module.exports = router;
