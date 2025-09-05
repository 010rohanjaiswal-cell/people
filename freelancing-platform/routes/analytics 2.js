const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const analyticsService = require('../utils/analyticsService');
const { query, validationResult } = require('express-validator');

// Get message analytics
router.get('/messages', auth, [
  query('timeRange').optional().isIn(['1d', '7d', '30d', '90d']).withMessage('Invalid time range')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { timeRange = '7d' } = req.query;
    const result = await analyticsService.getMessageAnalytics(timeRange);

    res.json(result);
  } catch (error) {
    console.error('Get message analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get message analytics'
    });
  }
});

// Get file upload analytics
router.get('/files', auth, [
  query('timeRange').optional().isIn(['1d', '7d', '30d', '90d']).withMessage('Invalid time range')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { timeRange = '7d' } = req.query;
    const result = await analyticsService.getFileUploadAnalytics(timeRange);

    res.json(result);
  } catch (error) {
    console.error('Get file analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get file analytics'
    });
  }
});

// Get user engagement analytics
router.get('/users', auth, [
  query('timeRange').optional().isIn(['1d', '7d', '30d', '90d']).withMessage('Invalid time range')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { timeRange = '7d' } = req.query;
    const result = await analyticsService.getUserEngagementAnalytics(timeRange);

    res.json(result);
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user analytics'
    });
  }
});

// Get notification analytics
router.get('/notifications', auth, [
  query('timeRange').optional().isIn(['1d', '7d', '30d', '90d']).withMessage('Invalid time range')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { timeRange = '7d' } = req.query;
    const result = await analyticsService.getNotificationAnalytics(timeRange);

    res.json(result);
  } catch (error) {
    console.error('Get notification analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification analytics'
    });
  }
});

// Get comprehensive platform analytics
router.get('/platform', auth, [
  query('timeRange').optional().isIn(['1d', '7d', '30d', '90d']).withMessage('Invalid time range')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { timeRange = '7d' } = req.query;
    const result = await analyticsService.getPlatformAnalytics(timeRange);

    res.json(result);
  } catch (error) {
    console.error('Get platform analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get platform analytics'
    });
  }
});

// Track user action
router.post('/track', auth, async (req, res) => {
  try {
    const { action, details = {} } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action is required'
      });
    }

    const result = await analyticsService.trackUserAction(
      req.user._id,
      action,
      {
        ...details,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json(result);
  } catch (error) {
    console.error('Track user action error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track user action'
    });
  }
});

module.exports = router;
