const JWTService = require('../utils/jwtService');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = JWTService.verifyToken(token);
    console.log('🔐 Token decoded:', { userId: decoded.userId });
    
    const user = await User.findById(decoded.userId).select('-password');
    console.log('👤 User found:', user ? { _id: user._id, role: user.role, isActive: user.isActive } : 'Not found');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.message === 'Invalid token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

module.exports = auth;
