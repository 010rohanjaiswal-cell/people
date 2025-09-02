const roleAuth = (...roles) => {
  return (req, res, next) => {
    console.log('🔒 Role check:', { requiredRoles: roles, userRole: req.user?.role });
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log('❌ Role mismatch:', { userRole: req.user.role, requiredRoles: roles });
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    console.log('✅ Role check passed');
    next();
  };
};

module.exports = roleAuth;
