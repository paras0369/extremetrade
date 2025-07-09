const { User, Wallet, Withdrawal, Transaction } = require('../models');
const { WITHDRAWAL_STATUS, TRANSACTION_TYPES } = require('../config/constants');
const logger = require('../utils/logger');

// Request withdrawal
const requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, method, bankDetails, usdtAddress } = req.body;

    // Validate withdrawal amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid withdrawal amount'
      });
    }

    // Validate withdrawal method
    if (!['BANK_TRANSFER', 'USDT', 'CRYPTO'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid withdrawal method'
      });
    }

    // Get user's wallet
    const wallet = await Wallet.findByUserId(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Check if user has sufficient balance
    if (wallet.availableBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance for withdrawal'
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate withdrawal details based on method
    let withdrawalData = {
      userId,
      amount,
      method,
      status: WITHDRAWAL_STATUS.PENDING
    };

    if (method === 'BANK_TRANSFER') {
      if (!bankDetails || !bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountHolderName) {
        return res.status(400).json({
          success: false,
          message: 'Bank details are required for bank transfer'
        });
      }
      withdrawalData.bankDetails = bankDetails;
    } else if (method === 'USDT' || method === 'CRYPTO') {
      if (!usdtAddress) {
        return res.status(400).json({
          success: false,
          message: 'USDT/Crypto address is required'
        });
      }
      withdrawalData.usdtAddress = usdtAddress;
    }

    // Calculate processing fee (if any)
    const processingFeePercentage = parseFloat(process.env.WITHDRAWAL_FEE_PERCENTAGE) || 0;
    const processingFee = (amount * processingFeePercentage) / 100;
    withdrawalData.processingFee = processingFee;
    withdrawalData.netAmount = amount - processingFee;

    // Create withdrawal request
    const withdrawal = new Withdrawal(withdrawalData);
    await withdrawal.save();

    // Lock the withdrawal amount in wallet
    await wallet.processWithdrawal(amount);

    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: TRANSACTION_TYPES.WITHDRAWAL,
      amount: amount,
      description: `Withdrawal request via ${method}`,
      reference: withdrawal._id.toString(),
      status: 'PENDING'
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        withdrawal: {
          id: withdrawal._id,
          amount: withdrawal.amount,
          formattedAmount: withdrawal.formattedAmount,
          method: withdrawal.method,
          processingFee: withdrawal.processingFee,
          netAmount: withdrawal.netAmount,
          formattedNetAmount: withdrawal.formattedNetAmount,
          status: withdrawal.status,
          requestedAt: withdrawal.requestedAt
        }
      }
    });

  } catch (error) {
    logger.error('Request withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit withdrawal request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's withdrawals
const getUserWithdrawals = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    // Build query options
    const options = { limit, skip };
    if (status) {
      options.status = status;
    }

    // Get user's withdrawals
    const withdrawals = await Withdrawal.findByUserId(userId, options);

    // Get total count
    let countQuery = { userId };
    if (status) {
      countQuery.status = status;
    }
    const totalCount = await Withdrawal.countDocuments(countQuery);

    // Format withdrawals
    const formattedWithdrawals = withdrawals.map(withdrawal => ({
      id: withdrawal._id,
      amount: withdrawal.amount,
      formattedAmount: withdrawal.formattedAmount,
      method: withdrawal.method,
      status: withdrawal.status,
      processingFee: withdrawal.processingFee,
      netAmount: withdrawal.netAmount,
      formattedNetAmount: withdrawal.formattedNetAmount,
      requestedAt: withdrawal.requestedAt,
      processedAt: withdrawal.processedAt,
      completedAt: withdrawal.completedAt,
      rejectedAt: withdrawal.rejectedAt,
      rejectionReason: withdrawal.rejectionReason,
      transactionHash: withdrawal.transactionHash,
      age: withdrawal.age,
      bankDetails: withdrawal.bankDetails,
      usdtAddress: withdrawal.usdtAddress
    }));

    res.json({
      success: true,
      data: {
        withdrawals: formattedWithdrawals,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get user withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get withdrawal by ID
const getWithdrawalById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { withdrawalId } = req.params;

    // Get withdrawal
    const withdrawal = await Withdrawal.findOne({ _id: withdrawalId, userId });
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    res.json({
      success: true,
      data: {
        withdrawal: {
          id: withdrawal._id,
          amount: withdrawal.amount,
          formattedAmount: withdrawal.formattedAmount,
          method: withdrawal.method,
          status: withdrawal.status,
          processingFee: withdrawal.processingFee,
          netAmount: withdrawal.netAmount,
          formattedNetAmount: withdrawal.formattedNetAmount,
          requestedAt: withdrawal.requestedAt,
          processedAt: withdrawal.processedAt,
          completedAt: withdrawal.completedAt,
          rejectedAt: withdrawal.rejectedAt,
          rejectionReason: withdrawal.rejectionReason,
          transactionHash: withdrawal.transactionHash,
          age: withdrawal.age,
          bankDetails: withdrawal.bankDetails,
          usdtAddress: withdrawal.usdtAddress,
          adminNotes: withdrawal.adminNotes
        }
      }
    });

  } catch (error) {
    logger.error('Get withdrawal by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cancel withdrawal (only for pending withdrawals)
const cancelWithdrawal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { withdrawalId } = req.params;

    // Get withdrawal
    const withdrawal = await Withdrawal.findOne({ _id: withdrawalId, userId });
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    // Check if withdrawal can be cancelled
    if (withdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: 'Only pending withdrawals can be cancelled'
      });
    }

    // Get user's wallet
    const wallet = await Wallet.findByUserId(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Cancel withdrawal in wallet (release locked amount)
    await wallet.cancelWithdrawal(withdrawal.amount);

    // Update withdrawal status
    withdrawal.status = WITHDRAWAL_STATUS.REJECTED;
    withdrawal.rejectionReason = 'Cancelled by user';
    withdrawal.rejectedAt = new Date();
    await withdrawal.save();

    // Update transaction status
    await Transaction.updateOne(
      { reference: withdrawal._id.toString(), type: TRANSACTION_TYPES.WITHDRAWAL },
      { status: 'REJECTED', rejectionReason: 'Cancelled by user' }
    );

    res.json({
      success: true,
      message: 'Withdrawal cancelled successfully',
      data: {
        withdrawal: {
          id: withdrawal._id,
          status: withdrawal.status,
          rejectionReason: withdrawal.rejectionReason,
          rejectedAt: withdrawal.rejectedAt
        }
      }
    });

  } catch (error) {
    logger.error('Cancel withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel withdrawal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get withdrawal statistics
const getWithdrawalStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get withdrawal statistics
    const stats = await Withdrawal.getWithdrawalStats(userId);

    // Format statistics
    const formattedStats = {
      pending: { count: 0, totalAmount: 0, totalNetAmount: 0 },
      processing: { count: 0, totalAmount: 0, totalNetAmount: 0 },
      completed: { count: 0, totalAmount: 0, totalNetAmount: 0 },
      rejected: { count: 0, totalAmount: 0, totalNetAmount: 0 },
      total: { count: 0, totalAmount: 0, totalNetAmount: 0 }
    };

    stats.forEach(stat => {
      const status = stat._id.toLowerCase();
      if (formattedStats[status]) {
        formattedStats[status] = {
          count: stat.count,
          totalAmount: stat.totalAmount,
          totalNetAmount: stat.totalNetAmount
        };
      }

      formattedStats.total.count += stat.count;
      formattedStats.total.totalAmount += stat.totalAmount;
      formattedStats.total.totalNetAmount += stat.totalNetAmount;
    });

    res.json({
      success: true,
      data: {
        withdrawalStats: formattedStats
      }
    });

  } catch (error) {
    logger.error('Get withdrawal stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Get all withdrawals
const getAllWithdrawals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const method = req.query.method;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (method) query.method = method;

    // Get withdrawals
    const withdrawals = await Withdrawal.find(query)
      .populate('userId', 'name email phone referralCode')
      .populate('processedBy', 'name email')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const totalCount = await Withdrawal.countDocuments(query);

    // Format withdrawals
    const formattedWithdrawals = withdrawals.map(withdrawal => ({
      id: withdrawal._id,
      amount: withdrawal.amount,
      formattedAmount: withdrawal.formattedAmount,
      method: withdrawal.method,
      status: withdrawal.status,
      processingFee: withdrawal.processingFee,
      netAmount: withdrawal.netAmount,
      formattedNetAmount: withdrawal.formattedNetAmount,
      requestedAt: withdrawal.requestedAt,
      processedAt: withdrawal.processedAt,
      completedAt: withdrawal.completedAt,
      rejectedAt: withdrawal.rejectedAt,
      rejectionReason: withdrawal.rejectionReason,
      transactionHash: withdrawal.transactionHash,
      age: withdrawal.age,
      user: withdrawal.userId ? {
        id: withdrawal.userId._id,
        name: withdrawal.userId.name,
        email: withdrawal.userId.email,
        phone: withdrawal.userId.phone,
        referralCode: withdrawal.userId.referralCode
      } : null,
      processedBy: withdrawal.processedBy ? {
        id: withdrawal.processedBy._id,
        name: withdrawal.processedBy.name,
        email: withdrawal.processedBy.email
      } : null,
      adminNotes: withdrawal.adminNotes
    }));

    res.json({
      success: true,
      data: {
        withdrawals: formattedWithdrawals,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get all withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Process withdrawal
const processWithdrawal = async (req, res) => {
  try {
    const adminUserId = req.user.userId;
    const { withdrawalId } = req.params;
    const { action, rejectionReason, transactionHash, adminNotes } = req.body;

    // Validate action
    if (!['approve', 'reject', 'complete'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve, reject, or complete'
      });
    }

    // Get withdrawal
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    // Get user's wallet
    const wallet = await Wallet.findByUserId(withdrawal.userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'User wallet not found'
      });
    }

    let updatedWithdrawal;

    switch (action) {
      case 'approve':
        if (withdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
          return res.status(400).json({
            success: false,
            message: 'Only pending withdrawals can be approved'
          });
        }
        updatedWithdrawal = await withdrawal.approve(adminUserId);
        break;

      case 'complete':
        if (withdrawal.status !== WITHDRAWAL_STATUS.PROCESSING) {
          return res.status(400).json({
            success: false,
            message: 'Only processing withdrawals can be completed'
          });
        }
        updatedWithdrawal = await withdrawal.complete(transactionHash);
        // Complete withdrawal in wallet
        await wallet.completeWithdrawal(withdrawal.amount);
        break;

      case 'reject':
        if (![WITHDRAWAL_STATUS.PENDING, WITHDRAWAL_STATUS.PROCESSING].includes(withdrawal.status)) {
          return res.status(400).json({
            success: false,
            message: 'Only pending or processing withdrawals can be rejected'
          });
        }
        updatedWithdrawal = await withdrawal.reject(rejectionReason, adminUserId);
        // Cancel withdrawal in wallet (release locked amount)
        await wallet.cancelWithdrawal(withdrawal.amount);
        break;
    }

    // Update admin notes if provided
    if (adminNotes) {
      updatedWithdrawal.adminNotes = adminNotes;
      await updatedWithdrawal.save();
    }

    // Update transaction status
    const transactionStatus = action === 'complete' ? 'COMPLETED' : 
                             action === 'reject' ? 'REJECTED' : 'APPROVED';
    await Transaction.updateOne(
      { reference: withdrawal._id.toString(), type: TRANSACTION_TYPES.WITHDRAWAL },
      { 
        status: transactionStatus,
        rejectionReason: rejectionReason || null,
        transactionHash: transactionHash || null
      }
    );

    res.json({
      success: true,
      message: `Withdrawal ${action}d successfully`,
      data: {
        withdrawal: {
          id: updatedWithdrawal._id,
          status: updatedWithdrawal.status,
          processedAt: updatedWithdrawal.processedAt,
          completedAt: updatedWithdrawal.completedAt,
          rejectedAt: updatedWithdrawal.rejectedAt,
          rejectionReason: updatedWithdrawal.rejectionReason,
          transactionHash: updatedWithdrawal.transactionHash,
          adminNotes: updatedWithdrawal.adminNotes
        }
      }
    });

  } catch (error) {
    logger.error('Process withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  requestWithdrawal,
  getUserWithdrawals,
  getWithdrawalById,
  cancelWithdrawal,
  getWithdrawalStats,
  getAllWithdrawals,
  processWithdrawal
};