const Message = require('../models/Message');
const Job = require('../models/Job');
const User = require('../models/User');

class SearchService {
  // Search messages with advanced filters
  async searchMessages(userId, filters = {}) {
    try {
      const {
        query = '',
        jobId,
        senderId,
        receiverId,
        messageType,
        hasAttachment,
        dateFrom,
        dateTo,
        isRead,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      // Build search criteria
      const searchCriteria = {};

      // User can only search messages from jobs they're involved in
      const userJobs = await Job.find({
        $or: [
          { clientId: userId },
          { freelancerId: userId }
        ]
      }).select('_id');

      const jobIds = userJobs.map(job => job._id);
      searchCriteria.jobId = { $in: jobIds };

      // Text search
      if (query.trim()) {
        searchCriteria.$text = { $search: query };
      }

      // Job filter
      if (jobId) {
        searchCriteria.jobId = jobId;
      }

      // Sender filter
      if (senderId) {
        searchCriteria.senderId = senderId;
      }

      // Receiver filter
      if (receiverId) {
        searchCriteria.receiverId = receiverId;
      }

      // Message type filter
      if (messageType) {
        searchCriteria.messageType = messageType;
      }

      // Attachment filter
      if (hasAttachment !== undefined) {
        if (hasAttachment) {
          searchCriteria.attachment = { $exists: true, $ne: null };
        } else {
          searchCriteria.$or = [
            { attachment: { $exists: false } },
            { attachment: null }
          ];
        }
      }

      // Date range filter
      if (dateFrom || dateTo) {
        searchCriteria.createdAt = {};
        if (dateFrom) {
          searchCriteria.createdAt.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          searchCriteria.createdAt.$lte = new Date(dateTo);
        }
      }

      // Read status filter
      if (isRead !== undefined) {
        searchCriteria.isRead = isRead;
      }

      // Calculate skip for pagination
      const skip = (page - 1) * limit;

      // Build sort object
      const sortObject = {};
      sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute search
      const messages = await Message.find(searchCriteria)
        .populate('senderId', 'phone role')
        .populate('receiverId', 'phone role')
        .populate('jobId', 'title status')
        .sort(sortObject)
        .skip(skip)
        .limit(limit);

      // Get total count for pagination
      const total = await Message.countDocuments(searchCriteria);

      return {
        success: true,
        data: {
          messages,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          filters
        }
      };
    } catch (error) {
      console.error('Search messages error:', error);
      return { success: false, error: error.message };
    }
  }

  // Search conversations with filters
  async searchConversations(userId, filters = {}) {
    try {
      const {
        query = '',
        jobStatus,
        hasUnread,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20,
        sortBy = 'lastMessageAt',
        sortOrder = 'desc'
      } = filters;

      // Get user's jobs
      const userJobs = await Job.find({
        $or: [
          { clientId: userId },
          { freelancerId: userId }
        ]
      }).populate('clientId', 'phone').populate('freelancerId', 'phone');

      // Filter jobs based on criteria
      let filteredJobs = userJobs;

      if (jobStatus) {
        filteredJobs = filteredJobs.filter(job => job.status === jobStatus);
      }

      if (query.trim()) {
        filteredJobs = filteredJobs.filter(job => 
          job.title.toLowerCase().includes(query.toLowerCase()) ||
          job.description.toLowerCase().includes(query.toLowerCase())
        );
      }

      const jobIds = filteredJobs.map(job => job._id);

      // Get conversations for these jobs
      const conversations = await Message.aggregate([
        {
          $match: {
            jobId: { $in: jobIds }
          }
        },
        {
          $group: {
            _id: '$jobId',
            lastMessage: { $last: '$$ROOT' },
            messageCount: { $sum: 1 },
            unreadCount: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$isRead', false] }] },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'jobs',
            localField: '_id',
            foreignField: '_id',
            as: 'job'
          }
        },
        {
          $unwind: '$job'
        },
        {
          $lookup: {
            from: 'users',
            localField: 'lastMessage.senderId',
            foreignField: '_id',
            as: 'lastSender'
          }
        },
        {
          $unwind: '$lastSender'
        },
        {
          $project: {
            jobId: '$_id',
            job: {
              _id: '$job._id',
              title: '$job.title',
              status: '$job.status',
              clientId: '$job.clientId',
              freelancerId: '$job.freelancerId'
            },
            lastMessage: {
              _id: '$lastMessage._id',
              message: '$lastMessage.message',
              messageType: '$lastMessage.messageType',
              createdAt: '$lastMessage.createdAt',
              senderId: {
                _id: '$lastSender._id',
                phone: '$lastSender.phone',
                role: '$lastSender.role'
              }
            },
            messageCount: 1,
            unreadCount: 1
          }
        }
      ]);

      // Apply additional filters
      let filteredConversations = conversations;

      if (hasUnread !== undefined) {
        if (hasUnread) {
          filteredConversations = filteredConversations.filter(conv => conv.unreadCount > 0);
        } else {
          filteredConversations = filteredConversations.filter(conv => conv.unreadCount === 0);
        }
      }

      if (dateFrom || dateTo) {
        filteredConversations = filteredConversations.filter(conv => {
          const messageDate = new Date(conv.lastMessage.createdAt);
          if (dateFrom && messageDate < new Date(dateFrom)) return false;
          if (dateTo && messageDate > new Date(dateTo)) return false;
          return true;
        });
      }

      // Sort conversations
      filteredConversations.sort((a, b) => {
        const aValue = a[sortBy] || a.lastMessage.createdAt;
        const bValue = b[sortBy] || b.lastMessage.createdAt;
        
        if (sortOrder === 'desc') {
          return new Date(bValue) - new Date(aValue);
        } else {
          return new Date(aValue) - new Date(bValue);
        }
      });

      // Apply pagination
      const total = filteredConversations.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedConversations = filteredConversations.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          conversations: paginatedConversations,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          filters
        }
      };
    } catch (error) {
      console.error('Search conversations error:', error);
      return { success: false, error: error.message };
    }
  }

  // Search users (admin only)
  async searchUsers(filters = {}) {
    try {
      const {
        query = '',
        role,
        isVerified,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      // Build search criteria
      const searchCriteria = {};

      // Text search
      if (query.trim()) {
        searchCriteria.$or = [
          { phone: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ];
      }

      // Role filter
      if (role) {
        searchCriteria.role = role;
      }

      // Verification filter
      if (isVerified !== undefined) {
        searchCriteria.isVerified = isVerified;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        searchCriteria.createdAt = {};
        if (dateFrom) {
          searchCriteria.createdAt.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          searchCriteria.createdAt.$lte = new Date(dateTo);
        }
      }

      // Calculate skip for pagination
      const skip = (page - 1) * limit;

      // Build sort object
      const sortObject = {};
      sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute search
      const users = await User.find(searchCriteria)
        .select('-password')
        .sort(sortObject)
        .skip(skip)
        .limit(limit);

      // Get total count for pagination
      const total = await User.countDocuments(searchCriteria);

      return {
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          filters
        }
      };
    } catch (error) {
      console.error('Search users error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get search suggestions
  async getSearchSuggestions(userId, query, type = 'messages') {
    try {
      if (!query.trim() || query.length < 2) {
        return { success: true, data: { suggestions: [] } };
      }

      let suggestions = [];

      switch (type) {
        case 'messages':
          // Get unique message content suggestions
          const messages = await Message.find({
            $text: { $search: query },
            jobId: {
              $in: await Job.find({
                $or: [{ clientId: userId }, { freelancerId: userId }]
              }).select('_id')
            }
          })
          .select('message')
          .limit(10);

          suggestions = [...new Set(messages.map(msg => msg.message))].slice(0, 5);
          break;

        case 'jobs':
          // Get job title suggestions
          const jobs = await Job.find({
            $text: { $search: query },
            $or: [{ clientId: userId }, { freelancerId: userId }]
          })
          .select('title')
          .limit(5);

          suggestions = jobs.map(job => job.title);
          break;

        case 'users':
          // Get user phone suggestions (admin only)
          const users = await User.find({
            phone: { $regex: query, $options: 'i' }
          })
          .select('phone')
          .limit(5);

          suggestions = users.map(user => user.phone);
          break;

        default:
          suggestions = [];
      }

      return {
        success: true,
        data: { suggestions }
      };
    } catch (error) {
      console.error('Get search suggestions error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SearchService();
