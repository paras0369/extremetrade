const mongoose = require('mongoose');
const { User, Wallet, Transaction } = require('../models');
const { TRANSACTION_TYPES } = require('../config/constants');
const logger = require('../utils/logger');

// Get user's wallet information
const getWallet = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's wallet
    const wallet = await Wallet.findByUserId(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Get user information
    const user = await User.findById(userId).select('name email referralCode totalInvestment');

    res.json({
      success: true,
      data: {
        wallet: {
          userId: wallet.userId,
          totalBalance: wallet.totalBalance,
          availableBalance: wallet.availableBalance,
          lockedBalance: wallet.lockedBalance,
          pendingWithdrawals: wallet.pendingWithdrawals,
          incomeBreakdown: wallet.incomeBreakdown,
          individual: {
            signupBonus: wallet.signupBonus,
            directReferralIncome: wallet.directReferralIncome,
            level2Income: wallet.level2Income,
            level3Income: wallet.level3Income,
            level4Income: wallet.level4Income,
            rewardIncome: wallet.rewardIncome
          },
          totals: {
            totalEarnings: wallet.totalEarnings,
            totalWithdrawals: wallet.totalWithdrawals,
            totalLevelCommission: wallet.totalLevelCommission
          },
          lastUpdated: wallet.lastUpdated
        },
        user: {
          name: user.name,
          email: user.email,
          referralCode: user.referralCode,
          totalInvestment: user.totalInvestment
        }
      }
    });

  } catch (error) {
    logger.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get wallet transactions
const getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const type = req.query.type;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // Build query
    let query = { userId };
    
    if (type) {
      query.type = type;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get transactions
    const transactions = await Transaction.find(query)
      .populate('fromUserId', 'name email referralCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const totalCount = await Transaction.countDocuments(query);

    // Format transactions
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction._id,
      type: transaction.type,
      amount: transaction.amount,
      formattedAmount: transaction.formattedAmount,
      description: transaction.description,
      status: transaction.status,
      level: transaction.level,
      commissionPercentage: transaction.commissionPercentage,
      createdAt: transaction.createdAt,
      fromUser: transaction.fromUserId ? {
        id: transaction.fromUserId._id,
        name: transaction.fromUserId.name,
        email: transaction.fromUserId.email,
        referralCode: transaction.fromUserId.referralCode
      } : null,
      reference: transaction.reference,
      transactionHash: transaction.transactionHash
    }));

    res.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get wallet transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get income summary
const getIncomeSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // Build date query
    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Get income summary
    const incomeSummary = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: {
            $in: [
              TRANSACTION_TYPES.SIGNUP_BONUS,
              TRANSACTION_TYPES.DIRECT_REFERRAL,
              TRANSACTION_TYPES.LEVEL_COMMISSION,
              TRANSACTION_TYPES.REWARD_INCOME
            ]
          },
          ...dateQuery
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            level: '$level'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format income summary
    const formattedSummary = {
      signupBonus: { amount: 0, count: 0 },
      directReferral: { amount: 0, count: 0 },
      levelCommissions: {
        level2: { amount: 0, count: 0 },
        level3: { amount: 0, count: 0 },
        level4: { amount: 0, count: 0 }
      },
      rewardIncome: { amount: 0, count: 0 },
      total: { amount: 0, count: 0 }
    };

    incomeSummary.forEach(item => {
      const { type, level } = item._id;
      const { totalAmount, count } = item;

      switch (type) {
        case TRANSACTION_TYPES.SIGNUP_BONUS:
          formattedSummary.signupBonus = { amount: totalAmount, count };
          break;
        case TRANSACTION_TYPES.DIRECT_REFERRAL:
          formattedSummary.directReferral = { amount: totalAmount, count };
          break;
        case TRANSACTION_TYPES.LEVEL_COMMISSION:
          if (level >= 2 && level <= 4) {
            formattedSummary.levelCommissions[`level${level}`] = { amount: totalAmount, count };
          }
          break;
        case TRANSACTION_TYPES.REWARD_INCOME:
          formattedSummary.rewardIncome = { amount: totalAmount, count };
          break;
      }

      formattedSummary.total.amount += totalAmount;
      formattedSummary.total.count += count;
    });

    res.json({
      success: true,
      data: {
        incomeSummary: formattedSummary,
        period: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      }
    });

  } catch (error) {
    logger.error('Get income summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch income summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get commission earnings by level
const getCommissionEarnings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const level = req.query.level;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {
      userId,
      type: {
        $in: [TRANSACTION_TYPES.DIRECT_REFERRAL, TRANSACTION_TYPES.LEVEL_COMMISSION]
      }
    };

    if (level) {
      query.level = parseInt(level);
    }

    // Get commission transactions
    const commissions = await Transaction.find(query)
      .populate('fromUserId', 'name email referralCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const totalCount = await Transaction.countDocuments(query);

    // Format commission data
    const formattedCommissions = commissions.map(commission => ({
      id: commission._id,
      type: commission.type,
      amount: commission.amount,
      formattedAmount: commission.formattedAmount,
      level: commission.level,
      commissionPercentage: commission.commissionPercentage,
      description: commission.description,
      createdAt: commission.createdAt,
      fromUser: commission.fromUserId ? {
        id: commission.fromUserId._id,
        name: commission.fromUserId.name,
        email: commission.fromUserId.email,
        referralCode: commission.fromUserId.referralCode
      } : null
    }));

    res.json({
      success: true,
      data: {
        commissions: formattedCommissions,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        filter: {
          level: level || 'all'
        }
      }
    });

  } catch (error) {
    logger.error('Get commission earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission earnings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get wallet balance history
const getBalanceHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const days = parseInt(req.query.days) || 30;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get transactions within date range
    const transactions = await Transaction.find({
      userId,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ createdAt: 1 });

    // Calculate running balance
    let runningBalance = 0;
    const balanceHistory = [];

    transactions.forEach(transaction => {
      if (transaction.type !== TRANSACTION_TYPES.WITHDRAWAL) {
        runningBalance += transaction.amount;
      } else {
        runningBalance -= transaction.amount;
      }

      balanceHistory.push({
        date: transaction.createdAt,
        balance: runningBalance,
        change: transaction.type === TRANSACTION_TYPES.WITHDRAWAL ? -transaction.amount : transaction.amount,
        type: transaction.type,
        description: transaction.description
      });
    });

    // Get current wallet balance
    const wallet = await Wallet.findByUserId(userId);
    const currentBalance = wallet ? wallet.totalBalance : 0;

    res.json({
      success: true,
      data: {
        balanceHistory,
        currentBalance,
        period: {
          startDate,
          endDate,
          days
        }
      }
    });

  } catch (error) {
    logger.error('Get balance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getWallet,
  getWalletTransactions,
  getIncomeSummary,
  getCommissionEarnings,
  getBalanceHistory
};