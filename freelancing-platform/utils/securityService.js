const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

class SecurityService {
  constructor() {
    this.algorithm = 'aes-256-cbc';
    this.secretKey = process.env.ENCRYPTION_KEY || 'your-secret-key-32-chars-long!!';
  }

  // Generate encryption key
  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Encrypt file content
  encryptFile(filePath) {
    try {
      const fileContent = fs.readFileSync(filePath);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.secretKey);
      
      let encrypted = cipher.update(fileContent, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Save encrypted file
      const encryptedPath = filePath + '.encrypted';
      fs.writeFileSync(encryptedPath, iv.toString('hex') + ':' + encrypted);
      
      return {
        success: true,
        encryptedPath,
        originalPath: filePath
      };
    } catch (error) {
      console.error('File encryption error:', error);
      return { success: false, error: error.message };
    }
  }

  // Decrypt file content
  decryptFile(encryptedPath) {
    try {
      const encryptedContent = fs.readFileSync(encryptedPath, 'utf8');
      const [ivHex, encrypted] = encryptedContent.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      
      const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return {
        success: true,
        content: decrypted
      };
    } catch (error) {
      console.error('File decryption error:', error);
      return { success: false, error: error.message };
    }
  }

  // Hash sensitive data
  hashData(data) {
    return bcrypt.hashSync(data, 12);
  }

  // Compare hashed data
  compareHash(data, hash) {
    return bcrypt.compareSync(data, hash);
  }

  // Generate secure token
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Validate file type by magic numbers
  validateFileType(buffer, allowedTypes) {
    const magicNumbers = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'application/pdf': [0x25, 0x50, 0x44, 0x46],
      'application/msword': [0xD0, 0xCF, 0x11, 0xE0],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [0x50, 0x4B, 0x03, 0x04]
    };

    for (const [mimeType, numbers] of Object.entries(magicNumbers)) {
      if (allowedTypes.includes(mimeType)) {
        const matches = numbers.every((byte, index) => buffer[index] === byte);
        if (matches) return true;
      }
    }
    return false;
  }

  // Sanitize filename
  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  // Generate secure file path
  generateSecureFilePath(originalName, userId) {
    const timestamp = Date.now();
    const randomString = this.generateSecureToken(8);
    const extension = path.extname(originalName);
    const sanitizedName = this.sanitizeFilename(path.basename(originalName, extension));
    
    return `${userId}/${timestamp}_${randomString}_${sanitizedName}${extension}`;
  }

  // Validate file size with compression estimation
  validateFileSize(fileSize, maxSize, fileType) {
    const compressionRatios = {
      'image/jpeg': 0.8,
      'image/png': 0.9,
      'image/gif': 0.7,
      'application/pdf': 1.0,
      'application/msword': 1.0
    };

    const ratio = compressionRatios[fileType] || 1.0;
    const estimatedSize = fileSize * ratio;
    
    return {
      isValid: estimatedSize <= maxSize,
      estimatedSize,
      originalSize: fileSize
    };
  }

  // Rate limiting helper
  createRateLimiter(windowMs, maxRequests, message = 'Too many requests') {
    const requests = new Map();
    
    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean old requests
      if (requests.has(key)) {
        requests.set(key, requests.get(key).filter(time => time > windowStart));
      } else {
        requests.set(key, []);
      }
      
      const userRequests = requests.get(key);
      
      if (userRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          message,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
      
      userRequests.push(now);
      next();
    };
  }

  // Input sanitization
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number format
  validatePhone(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // Generate audit log entry
  generateAuditLog(action, userId, details = {}) {
    return {
      timestamp: new Date(),
      action,
      userId,
      ip: details.ip,
      userAgent: details.userAgent,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      }
    };
  }
}

module.exports = new SecurityService();
