const express = require('express');
const router = express.Router();

const withdrawalController = require('../controllers/withdrawalController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { withdrawalLimiter } = require('../middleware/rateLimiters');

// @route   POST /api/withdrawal
// @desc    Create withdrawal request
// @access  Private
router.post('/', authenticate, withdrawalLimiter, withdrawalController.requestWithdrawal);

// @route   GET /api/withdrawal
// @desc    Get user's withdrawals
// @access  Private
router.get('/', authenticate, withdrawalController.getUserWithdrawals);

// @route   GET /api/withdrawal/stats
// @desc    Get withdrawal statistics
// @access  Private
router.get('/stats', authenticate, withdrawalController.getWithdrawalStats);

// @route   GET /api/withdrawal/:withdrawalId
// @desc    Get withdrawal details
// @access  Private
router.get('/:withdrawalId', authenticate, withdrawalController.getWithdrawalById);

// @route   PUT /api/withdrawal/:withdrawalId/cancel
// @desc    Cancel withdrawal request
// @access  Private
router.put('/:withdrawalId/cancel', authenticate, withdrawalController.cancelWithdrawal);

// Admin routes
// @route   GET /api/withdrawal/admin/all
// @desc    Get all withdrawals (Admin only)
// @access  Private/Admin
router.get('/admin/all', authenticate, isAdmin, withdrawalController.getAllWithdrawals);

// @route   PUT /api/withdrawal/:withdrawalId/process
// @desc    Process withdrawal (Admin only)
// @access  Private/Admin
router.put('/:withdrawalId/process', authenticate, isAdmin, withdrawalController.processWithdrawal);

module.exports = router;