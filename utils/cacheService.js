const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.init();
  }

  async init() {
    try {
      // Create Redis client
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis connection failed after 10 retries');
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      // Handle connection events
      this.client.on('connect', () => {
        console.log('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('Redis client ready');
      });

      this.client.on('error', (err) => {
        console.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('Redis client disconnected');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
    } catch (error) {
      console.error('Redis initialization error:', error);
      this.isConnected = false;
    }
  }

  // Set cache with expiration
  async set(key, value, expirationSeconds = 3600) {
    try {
      if (!this.isConnected || !this.client) {
        return { success: false, error: 'Redis not connected' };
      }

      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.setEx(key, expirationSeconds, serializedValue);
      
      return { success: true };
    } catch (error) {
      console.error('Cache set error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get cache value
  async get(key) {
    try {
      if (!this.isConnected || !this.client) {
        return { success: false, error: 'Redis not connected' };
      }

      const value = await this.client.get(key);
      
      if (value === null) {
        return { success: true, data: null };
      }

      // Try to parse as JSON, fallback to string
      try {
        const parsedValue = JSON.parse(value);
        return { success: true, data: parsedValue };
      } catch {
        return { success: true, data: value };
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete cache key
  async delete(key) {
    try {
      if (!this.isConnected || !this.client) {
        return { success: false, error: 'Redis not connected' };
      }

      const result = await this.client.del(key);
      return { success: true, deleted: result > 0 };
    } catch (error) {
      console.error('Cache delete error:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete multiple cache keys
  async deleteMultiple(keys) {
    try {
      if (!this.isConnected || !this.client) {
        return { success: false, error: 'Redis not connected' };
      }

      const result = await this.client.del(keys);
      return { success: true, deleted: result };
    } catch (error) {
      console.error('Cache delete multiple error:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if key exists
  async exists(key) {
    try {
      if (!this.isConnected || !this.client) {
        return { success: false, error: 'Redis not connected' };
      }

      const result = await this.client.exists(key);
      return { success: true, exists: result > 0 };
    } catch (error) {
      console.error('Cache exists error:', error);
      return { success: false, error: error.message };
    }
  }

  // Set cache with expiration (in milliseconds)
  async setEx(key, value, expirationMs) {
    try {
      if (!this.isConnected || !this.client) {
        return { success: false, error: 'Redis not connected' };
      }

      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.setEx(key, Math.ceil(expirationMs / 1000), serializedValue);
      
      return { success: true };
    } catch (error) {
      console.error('Cache setEx error:', error);
      return { success: false, error: error.message };
    }
  }

  // Increment counter
  async increment(key, amount = 1) {
    try {
      if (!this.isConnected || !this.client) {
        return { success: false, error: 'Redis not connected' };
      }

      const result = await this.client.incrBy(key, amount);
      return { success: true, value: result };
    } catch (error) {
      console.error('Cache increment error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get cache with fallback function
  async getOrSet(key, fallbackFunction, expirationSeconds = 3600) {
    try {
      // Try to get from cache first
      const cached = await this.get(key);
      
      if (cached.success && cached.data !== null) {
        return { success: true, data: cached.data, fromCache: true };
      }

      // If not in cache, execute fallback function
      const data = await fallbackFunction();
      
      // Store in cache
      await this.set(key, data, expirationSeconds);
      
      return { success: true, data, fromCache: false };
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear all cache (use with caution)
  async clearAll() {
    try {
      if (!this.isConnected || !this.client) {
        return { success: false, error: 'Redis not connected' };
      }

      await this.client.flushAll();
      return { success: true };
    } catch (error) {
      console.error('Cache clear all error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get cache statistics
  async getStats() {
    try {
      if (!this.isConnected || !this.client) {
        return { success: false, error: 'Redis not connected' };
      }

      const info = await this.client.info();
      return { success: true, info };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { success: false, error: error.message };
    }
  }

  // Close Redis connection
  async close() {
    try {
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
      }
    } catch (error) {
      console.error('Cache close error:', error);
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing Redis connection...');
  await cacheService.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing Redis connection...');
  await cacheService.close();
  process.exit(0);
});

module.exports = cacheService;
