const Message = require('../models/Message');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');

class AnalyticsService {
  // Get message analytics
  async getMessageAnalytics(timeRange = '7d') {
    try {
      const startDate = this.getStartDate(timeRange);
      
      const totalMessages = await Message.countDocuments({
        createdAt: { $gte: startDate }
      });

      const messagesByType = await Message.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$messageType',
            count: { $sum: 1 }
          }
        }
      ]);

      const messagesByHour = await Message.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      const topActiveUsers = await Message.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$senderId',
            messageCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            userId: '$_id',
            phone: '$user.phone',
            role: '$user.role',
            messageCount: 1
          }
        },
        {
          $sort: { messageCount: -1 }
        },
        {
          $limit: 10
        }
      ]);

      return {
        success: true,
        data: {
          totalMessages,
          messagesByType,
          messagesByHour,
          topActiveUsers,
          timeRange
        }
      };
    } catch (error) {
      console.error('Message analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get file upload analytics
  async getFileUploadAnalytics(timeRange = '7d') {
    try {
      const startDate = this.getStartDate(timeRange);
      
      const messagesWithAttachments = await Message.find({
        attachment: { $exists: true, $ne: null },
        createdAt: { $gte: startDate }
      });

      const fileTypeStats = {};
      const totalFileSize = messagesWithAttachments.reduce((total, message) => {
        if (message.attachment && message.attachment.size) {
          const fileType = message.attachment.mimetype || 'unknown';
          fileTypeStats[fileType] = (fileTypeStats[fileType] || 0) + 1;
          return total + message.attachment.size;
        }
        return total;
      }, 0);

      const fileTypeBreakdown = Object.entries(fileTypeStats).map(([type, count]) => ({
        type,
        count,
        percentage: ((count / messagesWithAttachments.length) * 100).toFixed(2)
      }));

      return {
        success: true,
        data: {
          totalFiles: messagesWithAttachments.length,
          totalFileSize,
          fileTypeBreakdown,
          averageFileSize: messagesWithAttachments.length > 0 ? 
            (totalFileSize / messagesWithAttachments.length) : 0,
          timeRange
        }
      };
    } catch (error) {
      console.error('File upload analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user engagement analytics
  async getUserEngagementAnalytics(timeRange = '7d') {
    try {
      const startDate = this.getStartDate(timeRange);
      
      const totalUsers = await User.countDocuments({
        createdAt: { $gte: startDate }
      });

      const activeUsers = await Message.distinct('senderId', {
        createdAt: { $gte: startDate }
      });

      const usersByRole = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      const userActivityByDay = await Message.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            uniqueUsers: { $addToSet: '$senderId' },
            messageCount: { $sum: 1 }
          }
        },
        {
          $project: {
            date: '$_id',
            uniqueUsers: { $size: '$uniqueUsers' },
            messageCount: 1
          }
        },
        {
          $sort: { date: 1 }
        }
      ]);

      return {
        success: true,
        data: {
          totalUsers,
          activeUsers: activeUsers.length,
          engagementRate: totalUsers > 0 ? 
            ((activeUsers.length / totalUsers) * 100).toFixed(2) : 0,
          usersByRole,
          userActivityByDay,
          timeRange
        }
      };
    } catch (error) {
      console.error('User engagement analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get notification analytics
  async getNotificationAnalytics(timeRange = '7d') {
    try {
      const startDate = this.getStartDate(timeRange);
      
      const totalNotifications = await Notification.countDocuments({
        sentAt: { $gte: startDate }
      });

      const notificationsByType = await Notification.aggregate([
        {
          $match: {
            sentAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            readCount: {
              $sum: {
                $cond: ['$isRead', 1, 0]
              }
            }
          }
        },
        {
          $project: {
            type: '$_id',
            count: 1,
            readCount: 1,
            readRate: {
              $multiply: [
                {
                  $cond: [
                    { $eq: ['$count', 0] },
                    0,
                    { $divide: ['$readCount', '$count'] }
                  ]
                },
                100
              ]
            }
          }
        }
      ]);

      const notificationsByHour = await Notification.aggregate([
        {
          $match: {
            sentAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: { $hour: '$sentAt' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      return {
        success: true,
        data: {
          totalNotifications,
          notificationsByType,
          notificationsByHour,
          averageReadRate: notificationsByType.length > 0 ?
            (notificationsByType.reduce((sum, item) => sum + item.readRate, 0) / notificationsByType.length).toFixed(2) : 0,
          timeRange
        }
      };
    } catch (error) {
      console.error('Notification analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get comprehensive platform analytics
  async getPlatformAnalytics(timeRange = '7d') {
    try {
      const [messageAnalytics, fileAnalytics, userAnalytics, notificationAnalytics] = await Promise.all([
        this.getMessageAnalytics(timeRange),
        this.getFileUploadAnalytics(timeRange),
        this.getUserEngagementAnalytics(timeRange),
        this.getNotificationAnalytics(timeRange)
      ]);

      const totalJobs = await Job.countDocuments({
        createdAt: { $gte: this.getStartDate(timeRange) }
      });

      const jobsByStatus = await Job.aggregate([
        {
          $match: {
            createdAt: { $gte: this.getStartDate(timeRange) }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        success: true,
        data: {
          messageAnalytics: messageAnalytics.data,
          fileAnalytics: fileAnalytics.data,
          userAnalytics: userAnalytics.data,
          notificationAnalytics: notificationAnalytics.data,
          jobAnalytics: {
            totalJobs,
            jobsByStatus
          },
          timeRange
        }
      };
    } catch (error) {
      console.error('Platform analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper method to get start date based on time range
  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  // Track user action for analytics
  async trackUserAction(userId, action, details = {}) {
    try {
      // This could be expanded to store in a separate analytics collection
      console.log('User action tracked:', {
        userId,
        action,
        details,
        timestamp: new Date()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Track user action error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AnalyticsService();
