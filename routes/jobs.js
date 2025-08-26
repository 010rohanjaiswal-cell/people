const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const auth = require('../middleware/auth');

// Get all active jobs (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, gender, location } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      isActive: true
    };

    if (status) {
      query.status = status;
    } else {
      // Default to open jobs only
      query.status = 'open';
    }

    // Filter by gender preference
    if (gender && gender !== 'any') {
      query.$or = [
        { genderPreference: 'any' },
        { genderPreference: gender }
      ];
    }

    const jobs = await Job.find(query)
      .populate('clientId', 'phone')
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

// Get specific job details
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId)
      .populate('clientId', 'phone')
      .populate('freelancerId', 'phone');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: { job }
    });
  } catch (error) {
    console.error('Get job details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job details'
    });
  }
});

// Get job statistics (public)
router.get('/stats/overview', async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments({ isActive: true });
    const openJobs = await Job.countDocuments({ status: 'open', isActive: true });
    const completedJobs = await Job.countDocuments({ status: 'completed' });
    const totalAmount = await Job.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalJobs,
        openJobs,
        completedJobs,
        totalAmount: totalAmount[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job statistics'
    });
  }
});

module.exports = router;
