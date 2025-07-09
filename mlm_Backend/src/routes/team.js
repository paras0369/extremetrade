const express = require('express');
const router = express.Router();

const teamController = require('../controllers/teamController');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/team/direct
// @desc    Get user's direct team (Level 1)
// @access  Private
router.get('/direct', authenticate, teamController.getDirectTeam);

// @route   GET /api/team/level/:level
// @desc    Get team by specific level
// @access  Private
router.get('/level/:level', authenticate, teamController.getTeamByLevel);

// @route   GET /api/team/complete
// @desc    Get complete team (all levels)
// @access  Private
router.get('/complete', authenticate, teamController.getCompleteTeam);

// @route   GET /api/team/stats
// @desc    Get team statistics
// @access  Private
router.get('/stats', authenticate, teamController.getTeamStats);

// @route   GET /api/team/genealogy
// @desc    Get team genealogy (tree structure)
// @access  Private
router.get('/genealogy', authenticate, teamController.getTeamGenealogy);

module.exports = router;