const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiters');
const { 
  validateRegistration, 
  validateLogin, 
  validateReferralCode 
} = require('../middleware/validation');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authLimiter, validateRegistration, authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, validateLogin, authController.login);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, authController.getProfile);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticate, authController.logout);

// @route   GET /api/auth/verify-referral/:referralCode
// @desc    Verify referral code
// @access  Public
router.get('/verify-referral/:referralCode', validateReferralCode, authController.verifyReferralCode);

module.exports = router;