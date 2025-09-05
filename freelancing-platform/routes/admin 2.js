const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const Job = require('../models/Job');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Get pending freelancer verifications
router.get('/verifications/pending', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const verifications = await FreelancerProfile.find({
      verificationStatus: 'pending'
    })
      .populate('userId', 'phone createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FreelancerProfile.countDocuments({
      verificationStatus: 'pending'
    });

    res.json({
      success: true,
      data: {
        verifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending verifications'
    });
  }
});

// Approve freelancer verification
router.post('/verifications/:profileId/approve', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { profileId } = req.params;
    const { freelancerId } = req.body;

    const profile = await FreelancerProfile.findById(profileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    if (profile.verificationStatus !== 'pending' && profile.verificationStatus !== 'resubmitted' && profile.verificationStatus !== 'under_review') {
      return res.status(400).json({
        success: false,
        message: 'Profile is not pending, resubmitted, or under review for verification'
      });
    }

    // Check if freelancer ID is already taken
    if (freelancerId) {
      const existingProfile = await FreelancerProfile.findOne({ freelancerId });
      if (existingProfile) {
        return res.status(400).json({
          success: false,
          message: 'Freelancer ID already exists'
        });
      }
      profile.freelancerId = freelancerId;
    }

    profile.verificationStatus = 'approved';
    await profile.save();

    // Update user verification status
    await User.findByIdAndUpdate(profile.userId, {
      isVerified: true
    });

    res.json({
      success: true,
      message: 'Freelancer verification approved',
      data: { profile }
    });
  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve verification'
    });
  }
});

// Reject freelancer verification
router.post('/verifications/:profileId/reject', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { profileId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const profile = await FreelancerProfile.findById(profileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    if (profile.verificationStatus !== 'pending' && profile.verificationStatus !== 'resubmitted' && profile.verificationStatus !== 'under_review') {
      return res.status(400).json({
        success: false,
        message: 'Profile is not pending, resubmitted, or under review'
      });
    }

    profile.verificationStatus = 'rejected';
    profile.rejectionReason = rejectionReason;
    await profile.save();

    res.json({
      success: true,
      message: 'Freelancer verification rejected',
      data: { profile }
    });
  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject verification'
    });
  }
});

// Get resubmitted freelancer verifications
router.get('/verifications/resubmitted', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const verifications = await FreelancerProfile.find({
      verificationStatus: 'resubmitted'
    })
      .populate('userId', 'phone createdAt')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FreelancerProfile.countDocuments({
      verificationStatus: 'resubmitted'
    });

    res.json({
      success: true,
      data: {
        verifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get resubmitted verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get resubmitted verifications'
    });
  }
});

// Get all verifications with filters
router.get('/verifications', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) {
      query.verificationStatus = status;
    }

    const verifications = await FreelancerProfile.find(query)
      .populate('userId', 'phone createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FreelancerProfile.countDocuments(query);

    res.json({
      success: true,
      data: {
        verifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verifications'
    });
  }
});

// Get all transactions
router.get('/transactions', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate('jobId', 'title')
      .populate('clientId', 'phone')
      .populate('freelancerId', 'phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

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

// Process withdrawal requests
router.post('/transactions/:transactionId/process-withdrawal', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { action, failureReason } = req.body; // action: 'approve' or 'reject'

    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.type !== 'withdrawal') {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal transaction not found'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Transaction has already been processed'
      });
    }

    if (action === 'approve') {
      transaction.status = 'completed';
      transaction.completedAt = new Date();
    } else if (action === 'reject') {
      transaction.status = 'failed';
      transaction.failureReason = failureReason;

      // Refund the amount back to freelancer's wallet
      const Wallet = require('../models/Wallet');
      const wallet = await Wallet.findOne({ userId: transaction.freelancerId });
      if (wallet) {
        wallet.balance += transaction.amount;
        await wallet.save();
      }
    }

    await transaction.save();

    res.json({
      success: true,
      message: `Withdrawal ${action}ed successfully`,
      data: { transaction }
    });
  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal'
    });
  }
});

// Seed production database
router.post('/seed', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { exec } = require('child_process');
    
    exec('npm run seed:prod', (error, stdout, stderr) => {
      if (error) {
        console.error('Seeding error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to seed database',
          error: error.message
        });
      }
      
      console.log('Seeding output:', stdout);
      res.json({
        success: true,
        message: 'Database seeded successfully',
        output: stdout
      });
    });
  } catch (error) {
    console.error('Seed route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed database'
    });
  }
});

// Get platform statistics
router.get('/stats', auth, roleAuth('admin'), async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalFreelancers = await User.countDocuments({ role: 'freelancer' });
    const verifiedFreelancers = await FreelancerProfile.countDocuments({ verificationStatus: 'approved' });
    const pendingVerifications = await FreelancerProfile.countDocuments({ verificationStatus: 'under_review' });

    // Job statistics
    const totalJobs = await Job.countDocuments();
    const openJobs = await Job.countDocuments({ status: 'open', isActive: true });
    const completedJobs = await Job.countDocuments({ status: 'completed' });
    const totalJobAmount = await Job.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Transaction statistics
    const totalTransactions = await Transaction.countDocuments();
    const completedTransactions = await Transaction.countDocuments({ status: 'completed' });
    const pendingWithdrawals = await Transaction.countDocuments({ 
      type: 'withdrawal', 
      status: 'pending' 
    });
    const totalTransactionAmount = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Recent activity
    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('clientId', 'phone');

    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('clientId', 'phone')
      .populate('freelancerId', 'phone');

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          clients: totalClients,
          freelancers: totalFreelancers,
          verifiedFreelancers,
          pendingVerifications
        },
        jobs: {
          total: totalJobs,
          open: openJobs,
          completed: completedJobs,
          totalAmount: totalJobAmount[0]?.total || 0
        },
        transactions: {
          total: totalTransactions,
          completed: completedTransactions,
          pendingWithdrawals,
          totalAmount: totalTransactionAmount[0]?.total || 0
        },
        recentActivity: {
          jobs: recentJobs,
          transactions: recentTransactions
        }
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get platform statistics'
    });
  }
});

// Get all users
router.get('/users', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

// Get all jobs
router.get('/jobs', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;

    const jobs = await Job.find(query)
      .populate('clientId', 'phone')
      .populate('freelancerId', 'phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get client profiles for all jobs
    const ClientProfile = require('../models/ClientProfile');
    const clientUserIds = [...new Set(jobs.map(job => job.clientId._id))];
    const clientProfiles = await ClientProfile.find({ userId: { $in: clientUserIds } });
    
    // Create a map of userId to profile
    const profileMap = {};
    clientProfiles.forEach(profile => {
      profileMap[profile.userId.toString()] = profile;
    });

    // Transform jobs to include client information
    const transformedJobs = jobs.map(job => {
      const jobObj = job.toObject();
      const clientProfile = profileMap[jobObj.clientId._id.toString()];
      return {
        ...jobObj,
        client: {
          _id: jobObj.clientId._id,
          phone: jobObj.clientId.phone,
          fullName: clientProfile?.fullName || 'Unknown Client'
        }
      };
    });

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: {
        jobs: transformedJobs,
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

// Delete a job (Admin only)
router.delete('/jobs/:jobId', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if job can be deleted (not completed or in progress)
    if (job.status === 'completed' || job.status === 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed or in-progress jobs'
      });
    }

    // Delete the job
    await Job.findByIdAndDelete(jobId);

    // Update client's total jobs posted count
    const ClientProfile = require('../models/ClientProfile');
    const clientProfile = await ClientProfile.findOne({ userId: job.clientId });
    if (clientProfile && clientProfile.totalJobsPosted > 0) {
      clientProfile.totalJobsPosted -= 1;
      await clientProfile.save();
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

// Commission management routes
const commissionService = require('../utils/commissionService');

// Get commission statistics
router.get('/commission/stats', auth, roleAuth('admin'), async (req, res) => {
  try {
    const stats = await commissionService.getCommissionStats();
    
    if (!stats.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get commission statistics',
        error: stats.error
      });
    }

    res.json({
      success: true,
      data: stats.data
    });
  } catch (error) {
    console.error('Get commission stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission statistics'
    });
  }
});

// Update commission rate
router.put('/commission/rate', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { rate } = req.body;
    
    if (!rate || isNaN(rate)) {
      return res.status(400).json({
        success: false,
        message: 'Valid commission rate is required'
      });
    }

    const result = commissionService.updateCommissionRate(parseFloat(rate));
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Update commission rate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update commission rate'
    });
  }
});

// Update minimum commission (disabled - no minimum limit)
router.put('/commission/min', auth, roleAuth('admin'), async (req, res) => {
  try {
    res.status(400).json({
      success: false,
      message: 'Minimum commission limit is disabled - jobs can be of any amount'
    });
  } catch (error) {
    console.error('Update minimum commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update minimum commission'
    });
  }
});

// Update maximum commission (disabled - no maximum limit)
router.put('/commission/max', auth, roleAuth('admin'), async (req, res) => {
  try {
    res.status(400).json({
      success: false,
      message: 'Maximum commission limit is disabled - jobs can be of any amount'
    });
  } catch (error) {
    console.error('Update maximum commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update maximum commission'
    });
  }
});

// Get commission transactions
router.get('/commission/transactions', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ type: 'commission' })
      .populate('jobId', 'title')
      .populate('clientId', 'phone')
      .populate('freelancerId', 'phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments({ type: 'commission' });

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
    console.error('Get commission transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission transactions'
    });
  }
});

module.exports = router;
