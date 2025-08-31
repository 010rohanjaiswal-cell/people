# 🗄️ Redis Production Setup Guide

## 📋 Redis Deployment Options

### Option 1: Redis Cloud (Recommended for Production)

#### 1. Redis Cloud Setup
1. **Go to [Redis Cloud](https://redis.com/try-free/)**
2. **Create Free Account** (30MB free tier)
3. **Create Database:**
   - Name: `freelancing-platform-cache`
   - Region: Choose closest to your backend
   - Memory: 30MB (free tier) or upgrade as needed

#### 2. Get Connection Details
```bash
# Redis Cloud Connection Details
REDIS_URL=redis://username:password@host:port
REDIS_HOST=your-redis-host
REDIS_PORT=your-redis-port
REDIS_PASSWORD=your-redis-password
```

### Option 2: Upstash Redis (Serverless)

#### 1. Upstash Setup
1. **Go to [Upstash](https://upstash.com/)**
2. **Create Free Account**
3. **Create Redis Database:**
   - Name: `freelancing-platform`
   - Region: Choose closest to your backend
   - TLS: Enabled

#### 2. Get Connection Details
```bash
# Upstash Connection Details
REDIS_URL=redis://username:password@host:port
```

### Option 3: Railway Redis

#### 1. Railway Setup
1. **Go to [Railway](https://railway.app/)**
2. **Create Account**
3. **Create New Project**
4. **Add Redis Service**

#### 2. Get Connection Details
```bash
# Railway Redis Connection
REDIS_URL=redis://username:password@host:port
```

### Option 4: Self-Hosted Redis (Advanced)

#### 1. Install Redis on Server
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# macOS
brew install redis
brew services start redis

# Docker
docker run -d --name redis -p 6379:6379 redis:alpine
```

#### 2. Configure Redis
```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Set password
requirepass your-redis-password

# Enable persistence
save 900 1
save 300 10
save 60 10000

# Restart Redis
sudo systemctl restart redis-server
```

## 🔧 Redis Configuration

### 1. Environment Variables
```env
# Production Redis Configuration
REDIS_URL=redis://username:password@host:port
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_TLS=true
```

### 2. Redis Connection Test
```bash
# Test Redis connection
redis-cli -h your-redis-host -p 6379 -a your-redis-password ping
# Should return: PONG
```

### 3. Redis Performance Configuration
```javascript
// utils/cacheService.js - Production Configuration
const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis connection failed after 10 retries');
        return false;
      }
      return Math.min(retries * 100, 3000);
    },
    connectTimeout: 10000,
    lazyConnect: true
  },
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});
```

## 📊 Redis Monitoring

### 1. Redis Info Commands
```bash
# Get Redis info
redis-cli -h your-redis-host -p 6379 -a your-redis-password info

# Get memory info
redis-cli -h your-redis-host -p 6379 -a your-redis-password info memory

# Get client info
redis-cli -h your-redis-host -p 6379 -a your-redis-password client list
```

### 2. Redis Performance Monitoring
```javascript
// Monitor Redis performance
const cacheService = require('./utils/cacheService');

// Get cache statistics
const stats = await cacheService.getStats();
console.log('Redis Stats:', stats);
```

## 🔒 Redis Security

### 1. Redis Security Best Practices
```bash
# 1. Use strong passwords
requirepass your-strong-redis-password

# 2. Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""

# 3. Bind to localhost only (if self-hosted)
bind 127.0.0.1

# 4. Enable TLS (if supported)
tls-port 6380
tls-cert-file /path/to/cert.pem
tls-key-file /path/to/key.pem
```

### 2. Redis Access Control
```bash
# Create Redis user with limited permissions
ACL SETUSER cache-user on >cache-password ~cache:* +get +set +del
```

## 🚀 Redis Production Checklist

### ✅ Setup Checklist
- [ ] **Redis Service** - Cloud Redis or self-hosted
- [ ] **Connection String** - REDIS_URL configured
- [ ] **Authentication** - Password set and secure
- [ ] **TLS/SSL** - Encrypted connection enabled
- [ ] **Monitoring** - Performance monitoring setup
- [ ] **Backup** - Data persistence configured
- [ ] **Scaling** - Plan for increased usage

### ✅ Testing Checklist
- [ ] **Connection Test** - Redis ping successful
- [ ] **Cache Operations** - Set/get/delete working
- [ ] **Performance Test** - Response times acceptable
- [ ] **Failover Test** - Connection recovery working
- [ ] **Memory Usage** - Within acceptable limits

## 📈 Redis Scaling

### 1. Memory Management
```javascript
// Monitor memory usage
const memoryInfo = await client.info('memory');
console.log('Redis Memory:', memoryInfo);

// Set memory limits
await client.config('SET', 'maxmemory', '100mb');
await client.config('SET', 'maxmemory-policy', 'allkeys-lru');
```

### 2. Connection Pooling
```javascript
// Use connection pooling for high traffic
const pool = require('redis-connection-pool');

const redisPool = pool('redis', {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  max: 10,
  min: 2
});
```

## 🔄 Redis Backup & Recovery

### 1. Automated Backups
```bash
# Create backup script
#!/bin/bash
redis-cli -h your-redis-host -p 6379 -a your-redis-password BGSAVE
```

### 2. Data Recovery
```bash
# Restore from backup
redis-cli -h your-redis-host -p 6379 -a your-redis-password RESTORE key 0 value
```

## 🎯 Next Steps

1. **Choose Redis provider** (Redis Cloud, Upstash, Railway, or self-hosted)
2. **Configure connection** with your Redis credentials
3. **Test Redis connection** locally
4. **Update environment variables** with Redis URL
5. **Proceed to backend deployment**

---

**🎯 Once Redis is configured, we'll deploy the backend to Render!**
