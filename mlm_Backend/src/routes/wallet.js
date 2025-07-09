const express = require('express');
const router = express.Router();

const walletController = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/wallet
// @desc    Get user's wallet information
// @access  Private
router.get('/', authenticate, walletController.getWallet);

// @route   GET /api/wallet/transactions
// @desc    Get wallet transactions
// @access  Private
router.get('/transactions', authenticate, walletController.getWalletTransactions);

// @route   GET /api/wallet/income-summary
// @desc    Get income summary
// @access  Private
router.get('/income-summary', authenticate, walletController.getIncomeSummary);

// @route   GET /api/wallet/commissions
// @desc    Get commission earnings by level
// @access  Private
router.get('/commissions', authenticate, walletController.getCommissionEarnings);

// @route   GET /api/wallet/balance-history
// @desc    Get wallet balance history
// @access  Private
router.get('/balance-history', authenticate, walletController.getBalanceHistory);

module.exports = router;