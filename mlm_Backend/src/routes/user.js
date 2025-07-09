const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { 
  validateProfileUpdate, 
  validateBankAccount, 
  validateUSDTAddress,
  validateUserId,
  validatePagination,
  validateSearch
} = require('../middleware/validation');

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, validateProfileUpdate, userController.updateProfile);

// @route   PUT /api/user/bank-account
// @desc    Update bank account details
// @access  Private
router.put('/bank-account', authenticate, validateBankAccount, userController.updateBankAccount);

// @route   PUT /api/user/usdt-address
// @desc    Update USDT address
// @access  Private
router.put('/usdt-address', authenticate, validateUSDTAddress, userController.updateUSDTAddress);

// @route   GET /api/user/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticate, userController.getUserStats);

// @route   GET /api/user/:userId
// @desc    Get user by ID (Admin only)
// @access  Private/Admin
router.get('/:userId', authenticate, isAdmin, validateUserId, userController.getUserById);

// @route   PUT /api/user/:userId/activate
// @desc    Activate user (Admin only)
// @access  Private/Admin
router.put('/:userId/activate', authenticate, isAdmin, validateUserId, userController.activateUser);

// @route   PUT /api/user/:userId/deactivate
// @desc    Deactivate user (Admin only)
// @access  Private/Admin
router.put('/:userId/deactivate', authenticate, isAdmin, validateUserId, userController.deactivateUser);

// @route   GET /api/user
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', authenticate, isAdmin, validatePagination, validateSearch, userController.getAllUsers);

module.exports = router;