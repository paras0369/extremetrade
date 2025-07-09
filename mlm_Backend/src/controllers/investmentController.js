const mongoose = require('mongoose');
const { User, Wallet, Transaction } = require('../models');
const { TRANSACTION_TYPES } = require('../config/constants');
const commissionService = require('../services/commissionService');
const logger = require('../utils/logger');

// Create new investment
const createInvestment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, investmentType = 'BASIC_PLAN', description } = req.body;

    // Validate investment amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid investment amount'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create investment transaction
    const investment = new Transaction({
      userId,
      type: TRANSACTION_TYPES.INVESTMENT,
      amount,
      description: description || `Investment in ${investmentType}`,
      status: 'COMPLETED',
      metadata: {
        investmentType,
        createdAt: new Date()
      }
    });

    await investment.save();

    // Update user's total investment
    await User.findByIdAndUpdate(userId, {
      $inc: { totalInvestment: amount }
    });

    // Distribute commissions to upline
    await commissionService.distributeCommissions(userId, amount);

    // Update team business for all upline members
    await commissionService.updateTeamBusiness(userId, amount);

    res.status(201).json({
      success: true,
      message: 'Investment created successfully',
      data: {
        investment: {
          id: investment._id,
          amount: investment.amount,
          type: investment.type,
          investmentType,
          description: investment.description,
          status: investment.status,
          createdAt: investment.createdAt
        }
      }
    });

  } catch (error) {
    logger.error('Create investment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create investment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's investments
const getUserInvestments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get user's investment transactions
    const investments = await Transaction.find({
      userId,
      type: TRANSACTION_TYPES.INVESTMENT
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Get total count
    const totalCount = await Transaction.countDocuments({
      userId,
      type: TRANSACTION_TYPES.INVESTMENT
    });

    // Calculate total investment
    const totalInvestment = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: TRANSACTION_TYPES.INVESTMENT
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Format investments
    const formattedInvestments = investments.map(investment => ({
      id: investment._id,
      amount: investment.amount,
      formattedAmount: investment.formattedAmount,
      type: investment.type,
      investmentType: investment.metadata?.investmentType || 'BASIC_PLAN',
      description: investment.description,
      status: investment.status,
      createdAt: investment.createdAt
    }));

    res.json({
      success: true,
      data: {
        investments: formattedInvestments,
        summary: {
          totalInvestment: totalInvestment[0]?.totalAmount || 0,
          totalCount: totalCount
        },
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get user investments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get investment details
const getInvestmentById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { investmentId } = req.params;

    // Get investment
    const investment = await Transaction.findOne({
      _id: investmentId,
      userId,
      type: TRANSACTION_TYPES.INVESTMENT
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    // Get commissions generated from this investment
    const commissions = await Transaction.find({
      fromUserId: userId,
      type: { $in: [TRANSACTION_TYPES.DIRECT_REFERRAL, TRANSACTION_TYPES.LEVEL_COMMISSION] },
      createdAt: { $gte: investment.createdAt, $lte: new Date(investment.createdAt.getTime() + 60000) }
    }).populate('userId', 'name email referralCode');

    res.json({
      success: true,
      data: {
        investment: {
          id: investment._id,
          amount: investment.amount,
          formattedAmount: investment.formattedAmount,
          type: investment.type,
          investmentType: investment.metadata?.investmentType || 'BASIC_PLAN',
          description: investment.description,
          status: investment.status,
          createdAt: investment.createdAt
        },
        commissionsGenerated: commissions.map(commission => ({
          id: commission._id,
          amount: commission.amount,
          level: commission.level,
          commissionPercentage: commission.commissionPercentage,
          recipient: {
            name: commission.userId.name,
            email: commission.userId.email,
            referralCode: commission.userId.referralCode
          },
          createdAt: commission.createdAt
        }))
      }
    });

  } catch (error) {
    logger.error('Get investment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investment details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get investment statistics
const getInvestmentStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get investment statistics
    const stats = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: TRANSACTION_TYPES.INVESTMENT
        }
      },
      {
        $group: {
          _id: '$metadata.investmentType',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          lastInvestment: { $max: '$createdAt' }
        }
      }
    ]);

    // Get total statistics
    const totalStats = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: TRANSACTION_TYPES.INVESTMENT
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          firstInvestment: { $min: '$createdAt' },
          lastInvestment: { $max: '$createdAt' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byType: stats,
        overall: totalStats[0] || {
          totalAmount: 0,
          count: 0,
          avgAmount: 0,
          firstInvestment: null,
          lastInvestment: null
        }
      }
    });

  } catch (error) {
    logger.error('Get investment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investment statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createInvestment,
  getUserInvestments,
  getInvestmentById,
  getInvestmentStats
};