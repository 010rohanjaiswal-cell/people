const jwt = require('jsonwebtoken');

class JWTService {
  // Generate JWT token
  static generateToken(userId, role) {
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-for-development';
    return jwt.sign(
      { userId, role },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-for-development';
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Decode token without verification (for getting payload)
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }
}

module.exports = JWTService;
