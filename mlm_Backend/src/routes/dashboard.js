const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/dashboard
// @desc    Get dashboard overview
// @access  Private
router.get('/', authenticate, dashboardController.getDashboardSummary);

// @route   GET /api/dashboard/earnings-chart
// @desc    Get earnings chart data
// @access  Private
router.get('/earnings-chart', authenticate, dashboardController.getEarningsChart);

// @route   GET /api/dashboard/team-growth
// @desc    Get team growth chart
// @access  Private
router.get('/team-growth', authenticate, dashboardController.getTeamGrowthChart);

// @route   GET /api/dashboard/quick-actions
// @desc    Get quick actions data
// @access  Private
router.get('/quick-actions', authenticate, dashboardController.getQuickActions);

// @route   GET /api/dashboard/income-analytics
// @desc    Get income analytics
// @access  Private
router.get('/income-analytics', authenticate, dashboardController.getIncomeAnalytics);

module.exports = router;