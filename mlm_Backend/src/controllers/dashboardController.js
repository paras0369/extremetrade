const mongoose = require('mongoose');
const { User, Wallet, Transaction, Team, Withdrawal } = require('../models');
const logger = require('../utils/logger');

// Get dashboard summary
const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user details
    const user = await User.findById(userId).populate('wallet');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get wallet details
    const wallet = user.wallet || { totalBalance: 0, availableBalance: 0, totalEarnings: 0 };

    // Get recent transactions
    const recentTransactions = await Transaction.findByUserId(userId, { limit: 5 })
      .populate('fromUserId', 'name referralCode');

    // Get team statistics
    const teamStats = await Team.getTeamStats(userId);
    
    // Get direct referrals count
    const directReferrals = await User.countDocuments({ sponsorId: userId });

    // Get pending withdrawals
    const pendingWithdrawals = await Withdrawal.countDocuments({ 
      userId, 
      status: 'PENDING' 
    });

    // Calculate total team size
    const totalTeamSize = teamStats.reduce((sum, level) => sum + level.count, 0);

    // Get this month's earnings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyEarnings = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startOfMonth },
          type: { $in: ['SIGNUP_BONUS', 'DIRECT_REFERRAL', 'LEVEL_COMMISSION', 'REWARD_INCOME'] }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          referralCode: user.referralCode,
          status: user.status,
          joinedAt: user.joinedAt
        },
        wallet: {
          totalBalance: wallet.totalBalance,
          availableBalance: wallet.availableBalance,
          totalEarnings: wallet.totalEarnings,
          incomeBreakdown: wallet.incomeBreakdown || {}
        },
        stats: {
          directReferrals,
          totalTeamSize,
          pendingWithdrawals,
          monthlyEarnings: monthlyEarnings[0]?.totalEarnings || 0
        },
        teamStats,
        recentTransactions
      }
    });

  } catch (error) {
    logger.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get earnings chart data
const getEarningsChart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = 'last7days' } = req.query;

    let startDate = new Date();
    let groupBy = {};

    switch (period) {
      case 'last7days':
        startDate.setDate(startDate.getDate() - 7);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'last30days':
        startDate.setDate(startDate.getDate() - 30);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'last12months':
        startDate.setMonth(startDate.getMonth() - 12);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    const earningsData = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate },
          type: { $in: ['SIGNUP_BONUS', 'DIRECT_REFERRAL', 'LEVEL_COMMISSION', 'REWARD_INCOME'] }
        }
      },
      {
        $group: {
          _id: groupBy,
          totalEarnings: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        period,
        earningsData
      }
    });

  } catch (error) {
    logger.error('Get earnings chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch earnings chart data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get team growth chart
const getTeamGrowthChart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = 'last30days' } = req.query;

    let startDate = new Date();
    let groupBy = {};

    switch (period) {
      case 'last30days':
        startDate.setDate(startDate.getDate() - 30);
        groupBy = {
          year: { $year: '$joinedAt' },
          month: { $month: '$joinedAt' },
          day: { $dayOfMonth: '$joinedAt' }
        };
        break;
      case 'last12months':
        startDate.setMonth(startDate.getMonth() - 12);
        groupBy = {
          year: { $year: '$joinedAt' },
          month: { $month: '$joinedAt' }
        };
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
        groupBy = {
          year: { $year: '$joinedAt' },
          month: { $month: '$joinedAt' },
          day: { $dayOfMonth: '$joinedAt' }
        };
    }

    // Get all team member IDs
    const teamMemberIds = await Team.find({ userId }).distinct('memberId');

    const teamGrowthData = await User.aggregate([
      {
        $match: {
          _id: { $in: teamMemberIds },
          joinedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          newMembers: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        period,
        teamGrowthData
      }
    });

  } catch (error) {
    logger.error('Get team growth chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team growth chart data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get quick actions data
const getQuickActions = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get pending actions count
    const pendingWithdrawals = await Withdrawal.countDocuments({ 
      userId, 
      status: 'PENDING' 
    });

    const unreadNotifications = 0; // Implement notification system if needed

    // Get recent activity
    const recentActivity = await Transaction.findByUserId(userId, { limit: 3 })
      .populate('fromUserId', 'name referralCode');

    // Get team milestones
    const directReferrals = await User.countDocuments({ sponsorId: userId });
    const teamStats = await Team.getTeamStats(userId);
    const totalTeamSize = teamStats.reduce((sum, level) => sum + level.count, 0);

    const milestones = [
      {
        title: 'First Direct Referral',
        description: 'Refer your first team member',
        completed: directReferrals > 0,
        progress: Math.min(directReferrals, 1),
        target: 1
      },
      {
        title: '10 Direct Referrals',
        description: 'Build a team of 10 direct referrals',
        completed: directReferrals >= 10,
        progress: Math.min(directReferrals, 10),
        target: 10
      },
      {
        title: '100 Team Members',
        description: 'Grow your total team to 100 members',
        completed: totalTeamSize >= 100,
        progress: Math.min(totalTeamSize, 100),
        target: 100
      }
    ];

    res.json({
      success: true,
      data: {
        pendingActions: {
          withdrawals: pendingWithdrawals,
          notifications: unreadNotifications
        },
        recentActivity,
        milestones
      }
    });

  } catch (error) {
    logger.error('Get quick actions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quick actions data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get income analytics
const getIncomeAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get income breakdown by type
    const incomeBreakdown = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: { $in: ['SIGNUP_BONUS', 'DIRECT_REFERRAL', 'LEVEL_COMMISSION', 'REWARD_INCOME'] }
        }
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get level-wise commission
    const levelCommissions = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'LEVEL_COMMISSION'
        }
      },
      {
        $group: {
          _id: '$level',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top earning sources (team members)
    const topEarningSources = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          fromUserId: { $exists: true },
          type: { $in: ['DIRECT_REFERRAL', 'LEVEL_COMMISSION'] }
        }
      },
      {
        $group: {
          _id: '$fromUserId',
          totalEarnings: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalEarnings: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $project: {
          totalEarnings: 1,
          transactionCount: 1,
          'user.name': 1,
          'user.referralCode': 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        incomeBreakdown,
        levelCommissions,
        topEarningSources
      }
    });

  } catch (error) {
    logger.error('Get income analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch income analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getDashboardSummary,
  getEarningsChart,
  getTeamGrowthChart,
  getQuickActions,
  getIncomeAnalytics
};