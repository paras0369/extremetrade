const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./user');
const walletRoutes = require('./wallet');
const teamRoutes = require('./team');
const withdrawalRoutes = require('./withdrawal');
const dashboardRoutes = require('./dashboard');
const investmentRoutes = require('./investment');

// Use routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/wallet', walletRoutes);
router.use('/team', teamRoutes);
router.use('/withdrawal', withdrawalRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/investment', investmentRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MLM Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      wallet: '/api/wallet',
      team: '/api/team',
      withdrawal: '/api/withdrawal',
      dashboard: '/api/dashboard',
      investment: '/api/investment'
    }
  });
});

module.exports = router;