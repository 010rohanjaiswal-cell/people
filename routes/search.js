const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const searchService = require('../utils/searchService');
const { query, validationResult } = require('express-validator');

// Search messages
router.get('/messages', auth, [
  query('query').optional().isString().withMessage('Query must be a string'),
  query('jobId').optional().isMongoId().withMessage('Invalid job ID'),
  query('senderId').optional().isMongoId().withMessage('Invalid sender ID'),
  query('receiverId').optional().isMongoId().withMessage('Invalid receiver ID'),
  query('messageType').optional().isIn(['text', 'image', 'file']).withMessage('Invalid message type'),
  query('hasAttachment').optional().isBoolean().withMessage('hasAttachment must be boolean'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
  query('isRead').optional().isBoolean().withMessage('isRead must be boolean'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['createdAt', 'message', 'senderId']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const filters = {
      query: req.query.query,
      jobId: req.query.jobId,
      senderId: req.query.senderId,
      receiverId: req.query.receiverId,
      messageType: req.query.messageType,
      hasAttachment: req.query.hasAttachment === 'true',
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      isRead: req.query.isRead === 'true',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await searchService.searchMessages(req.user._id, filters);
    res.json(result);
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages'
    });
  }
});

// Search conversations
router.get('/conversations', auth, [
  query('query').optional().isString().withMessage('Query must be a string'),
  query('jobStatus').optional().isIn(['pending', 'assigned', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid job status'),
  query('hasUnread').optional().isBoolean().withMessage('hasUnread must be boolean'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['lastMessageAt', 'messageCount', 'unreadCount']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const filters = {
      query: req.query.query,
      jobStatus: req.query.jobStatus,
      hasUnread: req.query.hasUnread === 'true',
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || 'lastMessageAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await searchService.searchConversations(req.user._id, filters);
    res.json(result);
  } catch (error) {
    console.error('Search conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search conversations'
    });
  }
});

// Search users (admin only)
router.get('/users', auth, [
  query('query').optional().isString().withMessage('Query must be a string'),
  query('role').optional().isIn(['client', 'freelancer', 'admin']).withMessage('Invalid role'),
  query('isVerified').optional().isBoolean().withMessage('isVerified must be boolean'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['createdAt', 'phone', 'role']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
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

    const filters = {
      query: req.query.query,
      role: req.query.role,
      isVerified: req.query.isVerified === 'true',
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await searchService.searchUsers(filters);
    res.json(result);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
});

// Get search suggestions
router.get('/suggestions', auth, [
  query('query').isString().withMessage('Query is required'),
  query('type').optional().isIn(['messages', 'jobs', 'users']).withMessage('Invalid suggestion type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { query: searchQuery, type = 'messages' } = req.query;

    // Check permissions for user search
    if (type === 'users' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only for user suggestions.'
      });
    }

    const result = await searchService.getSearchSuggestions(req.user._id, searchQuery, type);
    res.json(result);
  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search suggestions'
    });
  }
});

module.exports = router;
