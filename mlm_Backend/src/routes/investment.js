const express = require('express');
const router = express.Router();

const investmentController = require('../controllers/investmentController');
const { authenticate } = require('../middleware/auth');

// @route   POST /api/investment
// @desc    Create new investment
// @access  Private
router.post('/', authenticate, investmentController.createInvestment);

// @route   GET /api/investment
// @desc    Get user's investments
// @access  Private
router.get('/', authenticate, investmentController.getUserInvestments);

// @route   GET /api/investment/stats
// @desc    Get investment statistics
// @access  Private
router.get('/stats', authenticate, investmentController.getInvestmentStats);

// @route   GET /api/investment/:investmentId
// @desc    Get investment details
// @access  Private
router.get('/:investmentId', authenticate, investmentController.getInvestmentById);

module.exports = router;