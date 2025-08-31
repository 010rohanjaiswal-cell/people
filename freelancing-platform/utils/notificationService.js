const PushToken = require('../models/PushToken');
const Notification = require('../models/Notification');
const { FirebaseNotificationService } = require('../config/firebase');

class NotificationService {
  // Register push token for a user
  async registerPushToken(userId, token, deviceType = 'android') {
    try {
      // Check if token already exists
      const existingToken = await PushToken.findOne({ token });
      
      if (existingToken) {
        // Update existing token
        existingToken.userId = userId;
        existingToken.deviceType = deviceType;
        existingToken.isActive = true;
        existingToken.lastUsed = new Date();
        await existingToken.save();
        return existingToken;
      }

      // Create new token
      const pushToken = new PushToken({
        userId,
        token,
        deviceType,
        isActive: true,
        lastUsed: new Date()
      });

      await pushToken.save();
      return pushToken;
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  }

  // Remove push token
  async removePushToken(token) {
    try {
      await PushToken.findOneAndUpdate(
        { token },
        { isActive: false },
        { new: true }
      );
    } catch (error) {
      console.error('Error removing push token:', error);
      throw error;
    }
  }

  // Get all active tokens for a user
  async getUserTokens(userId) {
    try {
      return await PushToken.find({ userId, isActive: true });
    } catch (error) {
      console.error('Error getting user tokens:', error);
      throw error;
    }
  }

  // Send push notification to a user
  async sendPushNotification(userId, title, body, data = {}, type = 'message') {
    try {
      // Get user's active tokens
      const tokens = await this.getUserTokens(userId);
      
      if (tokens.length === 0) {
        console.log(`No active tokens found for user ${userId}`);
        return;
      }

      // Create notification record
      const notification = new Notification({
        userId,
        title,
        body,
        type,
        data
      });
      await notification.save();

      // Send to all user's devices
      const results = await Promise.allSettled(
        tokens.map(token => this.sendToDevice(token.token, title, body, data))
      );

      // Log results
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to send notification to token ${tokens[index].token}:`, result.reason);
        }
      });

      return notification;
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  // Send notification to specific device
  async sendToDevice(token, title, body, data = {}) {
    try {
      // Use Firebase Cloud Messaging
      const result = await FirebaseNotificationService.sendToDevice(
        token,
        { title, body },
        data
      );
      
      return result;
    } catch (error) {
      console.error('Error sending to device:', error);
      throw error;
    }
  }

  // Send notification to multiple users
  async sendToMultipleUsers(userIds, title, body, data = {}, type = 'message') {
    try {
      const results = await Promise.allSettled(
        userIds.map(userId => this.sendPushNotification(userId, title, body, data, type))
      );

      return results.map((result, index) => ({
        userId: userIds[index],
        success: result.status === 'fulfilled',
        error: result.status === 'rejected' ? result.reason : null
      }));
    } catch (error) {
      console.error('Error sending to multiple users:', error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const notifications = await Notification.find({ userId })
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Notification.countDocuments({ userId });

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { 
          isRead: true,
          readAt: new Date()
        },
        { new: true }
      );

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { userId, isRead: false },
        { 
          isRead: true,
          readAt: new Date()
        }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread count for a user
  async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({ userId, isRead: false });
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Delete old notifications (cleanup)
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Notification.deleteMany({
        sentAt: { $lt: cutoffDate },
        isRead: true
      });

      console.log(`Cleaned up ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
