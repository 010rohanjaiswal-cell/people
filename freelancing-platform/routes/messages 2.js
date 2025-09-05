const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Job = require('../models/Job');
const auth = require('../middleware/auth');

// Get messages for a specific job
router.get('/job/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Verify user has access to this job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the client or freelancer for this job
    if (job.clientId.toString() !== req.user._id.toString() && 
        job.freelancerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const messages = await Message.find({ jobId })
      .populate('senderId', 'phone role')
      .populate('receiverId', 'phone role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ jobId });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Show oldest first
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
});

// Send a message
router.post('/job/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { message, messageType = 'text' } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    // Verify user has access to this job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the client or freelancer for this job
    if (job.clientId.toString() !== req.user._id.toString() && 
        job.freelancerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Determine receiver
    const receiverId = job.clientId.toString() === req.user._id.toString() 
      ? job.freelancerId 
      : job.clientId;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'No receiver found for this job'
      });
    }

    const newMessage = new Message({
      jobId,
      senderId: req.user._id,
      receiverId,
      message: message.trim(),
      messageType
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'phone role')
      .populate('receiverId', 'phone role');

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: { message: populatedMessage }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Mark messages as read
router.put('/job/:jobId/read', auth, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify user has access to this job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the client or freelancer for this job
    if (job.clientId.toString() !== req.user._id.toString() && 
        job.freelancerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        jobId,
        receiverId: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
});

// Get unread message count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiverId: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
});

// Get recent conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get jobs where user is client or freelancer
    const jobs = await Job.find({
      $or: [
        { clientId: req.user._id },
        { freelancerId: req.user._id }
      ]
    }).select('_id title');

    const jobIds = jobs.map(job => job._id);

    // Get latest message for each job
    const conversations = await Message.aggregate([
      {
        $match: {
          jobId: { $in: jobIds }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$jobId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$receiverId', req.user._id] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Populate job and user details
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const job = await Job.findById(conv._id)
          .populate('clientId', 'phone')
          .populate('freelancerId', 'phone');

        const lastMessage = await Message.findById(conv.lastMessage._id)
          .populate('senderId', 'phone role')
          .populate('receiverId', 'phone role');

        return {
          jobId: conv._id,
          job,
          lastMessage,
          unreadCount: conv.unreadCount
        };
      })
    );

    const total = await Message.aggregate([
      {
        $match: {
          jobId: { $in: jobIds }
        }
      },
      {
        $group: {
          _id: '$jobId'
        }
      },
      {
        $count: 'total'
      }
    ]);

    res.json({
      success: true,
      data: {
        conversations: populatedConversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total[0]?.total || 0,
          pages: Math.ceil((total[0]?.total || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations'
    });
  }
});

module.exports = router;
