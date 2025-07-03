const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token required',
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Get user from token
    const user = await User.findOne({ userId: decoded.userId });
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found',
      });
    }
    
    // Check if user is active
    if (user.status !== config.userStatus.ACTIVE) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is not active',
      });
    }
    
    // Check if account is locked
    if (user.isLocked) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is temporarily locked',
      });
    }
    
    // Update last activity
    user.lastActivity = new Date();
    await user.save();
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired',
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Authentication failed',
    });
  }
};

// Middleware to verify refresh token
const authenticateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token required',
      });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    
    // Get user from token
    const user = await User.findOne({ userId: decoded.userId });
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found',
      });
    }
    
    // Check if user is active
    if (user.status !== config.userStatus.ACTIVE) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is not active',
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Refresh token error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token expired',
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Refresh token verification failed',
    });
  }
};

// Middleware to check user role
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions',
      });
    }
    
    next();
  };
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required',
    });
  }
  
  if (req.user.role !== config.userRoles.ADMIN) {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required',
    });
  }
  
  next();
};

// Middleware to check if user owns the resource
const requireOwnership = (resourceIdParam = 'id') => {
  return (req, res, next) => {
    const resourceId = req.params[resourceIdParam];
    
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }
    
    // Admin can access any resource
    if (req.user.role === config.userRoles.ADMIN) {
      return next();
    }
    
    // Check if user owns the resource
    if (req.user.userId !== resourceId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
    }
    
    next();
  };
};

// Middleware to check if user has active package
const requireActivePackage = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required',
    });
  }
  
  if (!req.user.currentPackage || !req.user.currentPackage.isActive) {
    return res.status(403).json({
      status: 'error',
      message: 'Active package required',
    });
  }
  
  next();
};

// Middleware to check KYC verification
const requireKYCVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required',
    });
  }
  
  if (req.user.kyc.status !== 'approved') {
    return res.status(403).json({
      status: 'error',
      message: 'KYC verification required',
    });
  }
  
  next();
};

// Middleware to check email verification
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required',
    });
  }
  
  if (!req.user.emailVerified) {
    return res.status(403).json({
      status: 'error',
      message: 'Email verification required',
    });
  }
  
  next();
};

// Middleware to check two-factor authentication
const requireTwoFactor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required',
    });
  }
  
  if (req.user.twoFactorEnabled && !req.user.twoFactorVerified) {
    return res.status(403).json({
      status: 'error',
      message: 'Two-factor authentication required',
    });
  }
  
  next();
};

// Middleware to validate transaction limits
const validateTransactionLimits = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required',
    });
  }
  
  const { amount, type } = req.body;
  
  if (!amount || !type) {
    return res.status(400).json({
      status: 'error',
      message: 'Amount and type are required',
    });
  }
  
  // Check minimum limits
  if (type === 'deposit' && amount < config.trading.minDeposit) {
    return res.status(400).json({
      status: 'error',
      message: `Minimum deposit amount is ${config.trading.minDeposit}`,
    });
  }
  
  if (type === 'withdrawal' && amount < config.trading.minWithdrawal) {
    return res.status(400).json({
      status: 'error',
      message: `Minimum withdrawal amount is ${config.trading.minWithdrawal}`,
    });
  }
  
  // Check available balance for withdrawal
  if (type === 'withdrawal' && amount > req.user.balance.available) {
    return res.status(400).json({
      status: 'error',
      message: 'Insufficient balance',
    });
  }
  
  next();
};

// Middleware to log user activity
const logActivity = (action) => {
  return (req, res, next) => {
    // Store activity info in request for later logging
    req.activityLog = {
      action,
      userId: req.user ? req.user.userId : null,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
    };
    
    next();
  };
};

module.exports = {
  authenticateToken,
  authenticateRefreshToken,
  authorizeRole,
  requireAdmin,
  requireOwnership,
  requireActivePackage,
  requireKYCVerification,
  requireEmailVerification,
  requireTwoFactor,
  validateTransactionLimits,
  logActivity,
}; 