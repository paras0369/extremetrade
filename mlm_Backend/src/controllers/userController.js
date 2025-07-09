const { User, Wallet } = require('../models');
const logger = require('../utils/logger');
const { USER_STATUS } = require('../config/constants');

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, profileImage, address, bankAccount, usdtAddress } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user fields
    const updateData = {};
    
    if (name) updateData.name = name;
    if (profileImage) updateData.profileImage = profileImage;
    if (address) updateData.address = { ...user.address, ...address };
    if (bankAccount) updateData.bankAccount = { ...user.bankAccount, ...bankAccount };
    if (usdtAddress) updateData.usdtAddress = usdtAddress;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          referralCode: updatedUser.referralCode,
          profileImage: updatedUser.profileImage,
          address: updatedUser.address,
          bankAccount: updatedUser.bankAccount,
          usdtAddress: updatedUser.usdtAddress,
          status: updatedUser.status,
          joinedAt: updatedUser.joinedAt,
          lastLogin: updatedUser.lastLogin
        }
      }
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user by ID (for admin purposes)
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate('wallet')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          referralCode: user.referralCode,
          sponsorReferralCode: user.sponsorReferralCode,
          status: user.status,
          profileImage: user.profileImage,
          address: user.address,
          bankAccount: user.bankAccount,
          usdtAddress: user.usdtAddress,
          totalInvestment: user.totalInvestment,
          totalEarnings: user.totalEarnings,
          totalWithdrawals: user.totalWithdrawals,
          directReferrals: user.directReferrals,
          teamSize: user.teamSize,
          teamBusiness: user.teamBusiness,
          joinedAt: user.joinedAt,
          lastLogin: user.lastLogin
        },
        wallet: user.wallet || null
      }
    });

  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Activate user
const activateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user status to active
    user.status = USER_STATUS.ACTIVE;
    await user.save();

    res.json({
      success: true,
      message: 'User activated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          status: user.status
        }
      }
    });

  } catch (error) {
    logger.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Deactivate user
const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user status to inactive
    user.status = USER_STATUS.INACTIVE;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          status: user.status
        }
      }
    });

  } catch (error) {
    logger.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all users (for admin purposes)
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { referralCode: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    // Get users
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update bank account
const updateBankAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bankName, accountNumber, accountHolderName, ifscCode, routingNumber } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update bank account details
    user.bankAccount = {
      bankName: bankName || user.bankAccount.bankName,
      accountNumber: accountNumber || user.bankAccount.accountNumber,
      accountHolderName: accountHolderName || user.bankAccount.accountHolderName,
      ifscCode: ifscCode || user.bankAccount.ifscCode,
      routingNumber: routingNumber || user.bankAccount.routingNumber
    };

    await user.save();

    res.json({
      success: true,
      message: 'Bank account updated successfully',
      data: {
        bankAccount: user.bankAccount
      }
    });

  } catch (error) {
    logger.error('Update bank account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bank account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update USDT address
const updateUSDTAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { usdtAddress } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update USDT address
    user.usdtAddress = usdtAddress;
    await user.save();

    res.json({
      success: true,
      message: 'USDT address updated successfully',
      data: {
        usdtAddress: user.usdtAddress
      }
    });

  } catch (error) {
    logger.error('Update USDT address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update USDT address',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).populate('wallet');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate team business
    const teamBusiness = await user.calculateTeamBusiness();

    res.json({
      success: true,
      data: {
        stats: {
          totalInvestment: user.totalInvestment,
          totalEarnings: user.totalEarnings,
          totalWithdrawals: user.totalWithdrawals,
          directReferrals: user.directReferrals,
          teamSize: user.teamSize,
          teamBusiness: teamBusiness,
          wallet: user.wallet ? user.wallet.incomeBreakdown : null
        }
      }
    });

  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  updateProfile,
  getUserById,
  activateUser,
  deactivateUser,
  getAllUsers,
  updateBankAccount,
  updateUSDTAddress,
  getUserStats
};