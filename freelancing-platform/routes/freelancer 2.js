const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const { uploadDocuments, handleUploadError } = require('../middleware/upload');
const { validationRules, handleValidationErrors } = require('../utils/validation');
const FreelancerProfile = require('../models/FreelancerProfile');
const Job = require('../models/Job');
const Offer = require('../models/Offer');
const CloudinaryService = require('../utils/cloudinaryService');

// Get freelancer profile data
router.get('/profile', auth, roleAuth('freelancer'), async (req, res) => {
  try {
    const profile = await FreelancerProfile.findOne({ userId: req.user._id })
      .populate('userId', 'phone email');

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

// Save freelancer profile (without file uploads)
router.post('/save-profile', auth, roleAuth('freelancer'), async (req, res) => {
  try {
    const {
      fullName,
      email,
      dateOfBirth,
      address
    } = req.body;

    // Validate required fields
    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Full name and email are required'
      });
    }

    // Parse date if provided
    let parsedDate = null;
    if (dateOfBirth) {
      // Handle DD/MM/YYYY format
      if (dateOfBirth.includes('/')) {
        const [day, month, year] = dateOfBirth.split('/');
        parsedDate = new Date(year, month - 1, day);
      } else {
        parsedDate = new Date(dateOfBirth);
      }
    }

    // Check if profile already exists
    let profile = await FreelancerProfile.findOne({ userId: req.user._id });

    if (profile) {
      // Update existing profile
      profile.fullName = fullName;
      if (parsedDate) profile.dateOfBirth = parsedDate;
      if (address) profile.address = address;
    } else {
      // Create new profile
      profile = new FreelancerProfile({
        userId: req.user._id,
        fullName,
        dateOfBirth: parsedDate,
        address: address || {}
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
});

// Create/Update freelancer profile with verification (requires file uploads)
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

      // Parse date from YYYY-MM-DD format
      const parsedDate = new Date(dateOfBirth);

      // Upload images to Cloudinary
      const uploadedImages = {};

      if (req.files) {
        // Upload profile photo
        if (req.files.profilePhoto && req.files.profilePhoto[0]) {
          const profilePhotoResult = await CloudinaryService.uploadImage(
            req.files.profilePhoto[0], 
            'freelancing-platform/profile-photos'
          );
          uploadedImages.profilePhoto = profilePhotoResult.url;
        }

        // Upload Aadhaar Front
        if (req.files.aadhaarFront && req.files.aadhaarFront[0]) {
          const aadhaarFrontResult = await CloudinaryService.uploadImage(
            req.files.aadhaarFront[0], 
            'freelancing-platform/documents/aadhaar'
          );
          uploadedImages.aadhaarFront = aadhaarFrontResult.url;
        }

        // Upload Aadhaar Back
        if (req.files.aadhaarBack && req.files.aadhaarBack[0]) {
          const aadhaarBackResult = await CloudinaryService.uploadImage(
            req.files.aadhaarBack[0], 
            'freelancing-platform/documents/aadhaar'
          );
          uploadedImages.aadhaarBack = aadhaarBackResult.url;
        }

        // Upload PAN Front
        if (req.files.panFront && req.files.panFront[0]) {
          const panFrontResult = await CloudinaryService.uploadImage(
            req.files.panFront[0], 
            'freelancing-platform/documents/pan'
          );
          uploadedImages.panFront = panFrontResult.url;
        }
      }

      // Check if profile already exists
      let profile = await FreelancerProfile.findOne({ userId: req.user._id });

      if (profile) {
        // Update existing profile
        profile.fullName = fullName;
        profile.dateOfBirth = parsedDate;
        profile.gender = gender;
        profile.address = address;
        
        // Update images if provided
        if (uploadedImages.profilePhoto) profile.profilePhoto = uploadedImages.profilePhoto;
        if (uploadedImages.aadhaarFront) profile.documents.aadhaarFront = uploadedImages.aadhaarFront;
        if (uploadedImages.aadhaarBack) profile.documents.aadhaarBack = uploadedImages.aadhaarBack;
        if (uploadedImages.panFront) profile.documents.panFront = uploadedImages.panFront;
        
        profile.isProfileComplete = true;
        profile.verificationStatus = 'pending';
      } else {
        // Create new profile
        profile = new FreelancerProfile({
          userId: req.user._id,
          fullName,
          dateOfBirth: parsedDate,
          gender,
          address,
          profilePhoto: uploadedImages.profilePhoto || null,
          documents: {
            aadhaarFront: uploadedImages.aadhaarFront || null,
            aadhaarBack: uploadedImages.aadhaarBack || null,
            panFront: uploadedImages.panFront || null
          },
          isProfileComplete: true,
          verificationStatus: 'pending'
        });
      }

      await profile.save();

      res.json({
        success: true,
        message: 'Profile submitted for verification. Please wait for admin approval.',
        data: { 
          profile,
          verificationStatus: 'pending',
          message: 'Your profile has been submitted for verification. You will receive a Freelancer ID once approved by admin.'
        }
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
  uploadDocuments, // Changed from uploadProfilePhoto to uploadDocuments
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

      // Upload profile photo to Cloudinary
      const profilePhotoResult = await CloudinaryService.uploadImage(
        req.file, 
        'freelancing-platform/profile-photos'
      );
      profile.profilePhoto = profilePhotoResult.url;
      await profile.save();

      res.json({
        success: true,
        message: 'Profile photo uploaded successfully',
        data: { profilePhoto: profilePhotoResult.url }
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

      // Check freelancer verification status
      const profile = await FreelancerProfile.findOne({ userId: req.user._id });
      if (!profile || profile.verificationStatus !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Your profile must be approved before you can apply for jobs',
          verificationStatus: profile?.verificationStatus || 'not_found'
        });
      }

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
        // Check if the existing offer is older than 5 minutes (300000 ms)
        const offerAge = Date.now() - existingOffer.createdAt.getTime();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        if (offerAge < fiveMinutes) {
          return res.status(400).json({
            success: false,
            message: 'You have already applied for this job. Please wait before making another offer.',
            remainingTime: Math.ceil((fiveMinutes - offerAge) / 1000) // remaining seconds
          });
        } else {
          // Offer is older than 5 minutes, update it
          existingOffer.offeredAmount = offeredAmount || job.amount;
          existingOffer.message = message;
          existingOffer.updatedAt = new Date();
          await existingOffer.save();
          
          res.json({
            success: true,
            message: 'Offer updated successfully',
            data: { offer: existingOffer }
          });
          return;
        }
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

// Check verification status
router.post('/verification-status', auth, async (req, res) => {
  try {
    const { phone } = req.body;
    
    console.log('🔍 Verification status check - Phone received:', phone);
    console.log('🔍 Verification status check - User ID from token:', req.user._id);
    
    // Find the user by phone number
    const User = require('../models/User');
    const user = await User.findOne({ phone });
    
    console.log('🔍 User found by phone:', user ? 'Yes' : 'No');
    if (user) {
      console.log('🔍 User details:', { id: user._id, phone: user.phone, role: user.role });
    }
    
    if (!user) {
      console.log('🔍 No user found with phone:', phone);
      return res.json({
        exists: false,
        verified: false,
        status: 'new_user'
      });
    }

    // Check if freelancer profile exists
    const profile = await FreelancerProfile.findOne({ userId: user._id });
    
    console.log('🔍 Profile found for user:', profile ? 'Yes' : 'No');
    if (profile) {
      console.log('🔍 Profile details:', { 
        id: profile._id, 
        verificationStatus: profile.verificationStatus,
        isProfileComplete: profile.isProfileComplete 
      });
    }
    
    if (!profile) {
      console.log('🔍 No profile found for user:', user._id);
      return res.json({
        exists: false,
        verified: false,
        status: 'no_profile'
      });
    }

    // Check verification status
    const isVerified = profile.verificationStatus === 'approved';
    
    return res.json({
      exists: true,
      verified: isVerified,
      status: profile.verificationStatus,
      profileComplete: profile.isProfileComplete,
      freelancerId: profile.freelancerId || null,
      rejectionReason: profile.rejectionReason || null
    });

  } catch (error) {
    console.error('Verification status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check verification status'
    });
  }
});

// Get available jobs for freelancers
router.get('/jobs', auth, roleAuth('freelancer'), async (req, res) => {
  try {
    // Get all open jobs that are available for freelancers
    const jobs = await Job.find({ 
      status: 'open',
      isActive: true 
    })
    .populate('clientId', 'phone')
    .sort({ createdAt: -1 }) // Most recent first
    .limit(50); // Limit to 50 jobs

    console.log('🔍 Available jobs found:', jobs.length);

    res.json({
      success: true,
      data: { jobs }
    });
  } catch (error) {
    console.error('Get available jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available jobs'
    });
  }
});

// Get assigned jobs for freelancers
router.get('/assigned-jobs', auth, roleAuth('freelancer'), async (req, res) => {
  try {
    // Get jobs assigned to this freelancer
    const jobs = await Job.find({ 
      assignedFreelancerId: req.user._id,
      status: { $in: ['assigned', 'work_done', 'waiting_for_payment', 'completed'] }
    })
    .populate('clientId', 'phone')
    .sort({ updatedAt: -1 }) // Most recent first
    .limit(50); // Limit to 50 jobs

    console.log('🔍 Assigned jobs found:', jobs.length);

    res.json({
      success: true,
      data: { jobs }
    });
  } catch (error) {
    console.error('Get assigned jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assigned jobs'
    });
  }
});

// Update job status (for freelancers)
router.put('/jobs/:jobId/status', auth, roleAuth('freelancer'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['work_done', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values: work_done, completed'
      });
    }

    // Find the job and verify it's assigned to this freelancer
    const job = await Job.findOne({
      _id: jobId,
      freelancerId: req.user._id,
      status: { $in: ['assigned', 'work_done'] }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or not assigned to you'
      });
    }

    // Update job status
    job.status = status;
    if (status === 'work_done') {
      job.workDoneAt = new Date();
    } else if (status === 'completed') {
      job.completedAt = new Date();
    }

    await job.save();

    res.json({
      success: true,
      message: `Job status updated to ${status}`,
      data: { job }
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job status'
    });
  }
});

module.exports = router;
