const cacheService = require('./cacheService');
const User = require('../models/User');
const Job = require('../models/Job');
const Message = require('../models/Message');

class PerformanceService {
  constructor() {
    this.cachePrefixes = {
      user: 'user:',
      job: 'job:',
      message: 'message:',
      analytics: 'analytics:',
      search: 'search:'
    };
  }

  // Database query optimization with caching
  async getOptimizedUser(userId, includeProfile = false) {
    const cacheKey = `${this.cachePrefixes.user}${userId}`;
    
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        const query = User.findById(userId);
        if (includeProfile) {
          query.populate('profile');
        }
        return await query.exec();
      },
      1800 // 30 minutes cache
    );
  }

  // Optimized job queries with caching
  async getOptimizedJobs(filters = {}, page = 1, limit = 20) {
    const cacheKey = `${this.cachePrefixes.job}list:${JSON.stringify(filters)}:${page}:${limit}`;
    
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        const query = Job.find(filters)
          .populate('clientId', 'phone')
          .populate('freelancerId', 'phone')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit);

        const [jobs, total] = await Promise.all([
          query.exec(),
          Job.countDocuments(filters)
        ]);

        return {
          jobs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      },
      900 // 15 minutes cache
    );
  }

  // Optimized message queries with caching
  async getOptimizedMessages(jobId, page = 1, limit = 50) {
    const cacheKey = `${this.cachePrefixes.message}job:${jobId}:${page}:${limit}`;
    
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        const query = Message.find({ jobId })
          .populate('senderId', 'phone role')
          .populate('receiverId', 'phone role')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit);

        const [messages, total] = await Promise.all([
          query.exec(),
          Message.countDocuments({ jobId })
        ]);

        return {
          messages,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      },
      300 // 5 minutes cache
    );
  }

  // Optimized search with caching
  async getOptimizedSearch(query, type, filters = {}) {
    const cacheKey = `${this.cachePrefixes.search}${type}:${query}:${JSON.stringify(filters)}`;
    
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        switch (type) {
          case 'jobs':
            return await this.searchJobs(query, filters);
          case 'users':
            return await this.searchUsers(query, filters);
          case 'messages':
            return await this.searchMessages(query, filters);
          default:
            throw new Error('Invalid search type');
        }
      },
      600 // 10 minutes cache
    );
  }

  // Optimized analytics with caching
  async getOptimizedAnalytics(timeRange = '7d') {
    const cacheKey = `${this.cachePrefixes.analytics}${timeRange}`;
    
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await this.generateAnalytics(timeRange);
      },
      1800 // 30 minutes cache
    );
  }

  // Invalidate cache for specific user
  async invalidateUserCache(userId) {
    const keys = [
      `${this.cachePrefixes.user}${userId}`,
      `${this.cachePrefixes.analytics}*`,
      `${this.cachePrefixes.search}*`
    ];
    
    for (const key of keys) {
      await cacheService.delete(key);
    }
  }

  // Invalidate cache for specific job
  async invalidateJobCache(jobId) {
    const keys = [
      `${this.cachePrefixes.job}${jobId}`,
      `${this.cachePrefixes.job}list:*`,
      `${this.cachePrefixes.message}job:${jobId}:*`,
      `${this.cachePrefixes.analytics}*`
    ];
    
    for (const key of keys) {
      await cacheService.delete(key);
    }
  }

  // Database indexing optimization
  async optimizeDatabaseIndexes() {
    try {
      // Create compound indexes for better query performance
      await User.collection.createIndex(
        { phone: 1, role: 1 },
        { background: true }
      );

      await Job.collection.createIndex(
        { status: 1, category: 1, createdAt: -1 },
        { background: true }
      );

      await Job.collection.createIndex(
        { clientId: 1, freelancerId: 1 },
        { background: true }
      );

      await Message.collection.createIndex(
        { jobId: 1, createdAt: -1 },
        { background: true }
      );

      await Message.collection.createIndex(
        { senderId: 1, receiverId: 1 },
        { background: true }
      );

      console.log('Database indexes optimized');
      return { success: true };
    } catch (error) {
      console.error('Database optimization error:', error);
      return { success: false, error: error.message };
    }
  }

  // Query performance monitoring
  async monitorQueryPerformance() {
    try {
      const stats = {
        userQueries: await this.getQueryStats('users'),
        jobQueries: await this.getQueryStats('jobs'),
        messageQueries: await this.getQueryStats('messages'),
        cacheHitRate: await this.getCacheHitRate()
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Performance monitoring error:', error);
      return { success: false, error: error.message };
    }
  }

  // Load balancing helpers
  async getLoadBalancedData(operation, params = {}) {
    try {
      // Check cache first
      const cacheKey = `lb:${operation}:${JSON.stringify(params)}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached.success && cached.data) {
        return { success: true, data: cached.data, fromCache: true };
      }

      // Execute operation based on load
      const load = await this.getCurrentLoad();
      const data = await this.executeWithLoadBalancing(operation, params, load);
      
      // Cache result
      await cacheService.set(cacheKey, data, 300);
      
      return { success: true, data, fromCache: false };
    } catch (error) {
      console.error('Load balanced operation error:', error);
      return { success: false, error: error.message };
    }
  }

  // Private helper methods
  async searchJobs(query, filters) {
    const searchQuery = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ],
      ...filters
    };

    return await Job.find(searchQuery)
      .populate('clientId', 'phone')
      .populate('freelancerId', 'phone')
      .sort({ createdAt: -1 })
      .limit(20);
  }

  async searchUsers(query, filters) {
    const searchQuery = {
      $or: [
        { phone: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      ...filters
    };

    return await User.find(searchQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(20);
  }

  async searchMessages(query, filters) {
    const searchQuery = {
      $text: { $search: query },
      ...filters
    };

    return await Message.find(searchQuery)
      .populate('senderId', 'phone role')
      .populate('receiverId', 'phone role')
      .sort({ createdAt: -1 })
      .limit(20);
  }

  async generateAnalytics(timeRange) {
    const startDate = this.getStartDate(timeRange);
    
    const [userStats, jobStats, messageStats] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      Job.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Message.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$messageType', count: { $sum: 1 } } }
      ])
    ]);

    return {
      userStats,
      jobStats,
      messageStats,
      timeRange
    };
  }

  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  async getQueryStats(collection) {
    // This would integrate with MongoDB's profiler or custom metrics
    return {
      totalQueries: 0,
      averageTime: 0,
      slowQueries: 0
    };
  }

  async getCacheHitRate() {
    // This would calculate cache hit rate from Redis stats
    return {
      hitRate: 0.85,
      totalRequests: 0,
      cacheHits: 0
    };
  }

  async getCurrentLoad() {
    // This would get current server load
    return {
      cpu: 0.3,
      memory: 0.5,
      connections: 10
    };
  }

  async executeWithLoadBalancing(operation, params, load) {
    // Implement load balancing logic
    if (load.cpu > 0.8) {
      // High load - use cached data or simplified queries
      return await this.getSimplifiedData(operation, params);
    } else {
      // Normal load - execute full operation
      return await this.executeFullOperation(operation, params);
    }
  }

  async getSimplifiedData(operation, params) {
    // Return simplified data for high load situations
    return { simplified: true, operation, params };
  }

  async executeFullOperation(operation, params) {
    // Execute full operation
    return { full: true, operation, params };
  }
}

module.exports = new PerformanceService();
