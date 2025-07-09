const { User, Wallet, Transaction, Team } = require('../models');
const { generateToken } = require('../config/auth');
const { TRANSACTION_TYPES, COMMISSION_RATES } = require('../config/constants');
const { generateReferralCode } = require('../utils/generateReferralCode');
const commissionService = require('../services/commissionService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

// Register user
const register = async (req, res) => {
  try {
    const { name, email, phone, password, sponsorReferralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone number'
      });
    }

    let sponsor = null;
    if (sponsorReferralCode) {
      sponsor = await User.findByReferralCode(sponsorReferralCode);
      if (!sponsor) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sponsor referral code'
        });
      }
    }

    // Generate unique referral code
    const referralCode = await generateReferralCode();

    // Create new user
    const user = new User({
      name,
      email,
      phone,
      password,
      referralCode,
      sponsorId: sponsor ? sponsor._id : null,
      sponsorReferralCode: sponsorReferralCode || null
    });

    await user.save();

    // Create wallet for the user
    const wallet = new Wallet({
      userId: user._id
    });

    // Add signup bonus to new user
    await wallet.addIncome('SIGNUP_BONUS', COMMISSION_RATES.SIGNUP_BONUS);

    // Create signup bonus transaction
    const signupTransaction = new Transaction({
      userId: user._id,
      type: TRANSACTION_TYPES.SIGNUP_BONUS,
      amount: COMMISSION_RATES.SIGNUP_BONUS,
      description: 'Signup bonus for account creation'
    });

    await signupTransaction.save();

    // Process sponsor rewards and team building
    if (sponsor) {
      // Add signup bonus to sponsor
      const sponsorWallet = await Wallet.findByUserId(sponsor._id);
      if (sponsorWallet) {
        await sponsorWallet.addIncome('SIGNUP_BONUS', COMMISSION_RATES.SIGNUP_BONUS);
        
        // Create sponsor signup bonus transaction
        const sponsorTransaction = new Transaction({
          userId: sponsor._id,
          fromUserId: user._id,
          type: TRANSACTION_TYPES.SIGNUP_BONUS,
          amount: COMMISSION_RATES.SIGNUP_BONUS,
          description: `Signup bonus for referring ${user.name}`
        });

        await sponsorTransaction.save();
      }

      // Update sponsor's direct referral count
      await User.findByIdAndUpdate(sponsor._id, {
        $inc: { directReferrals: 1 }
      });

      // Build team structure
      await commissionService.buildTeamStructure(user._id, sponsor._id);
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      email: user.email
    });

    // Send welcome email
    /*
    try {
      await emailService.sendWelcomeEmail(user.email, user.name, referralCode);
    } catch (emailError) {
      logger.error('Failed to send welcome email:', emailError);
    }
*/
    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          referralCode: user.referralCode,
          sponsorReferralCode: user.sponsorReferralCode,
          joinedAt: user.joinedAt
        },
        token,
        wallet: {
          totalBalance: wallet.totalBalance,
          availableBalance: wallet.availableBalance,
          signupBonus: wallet.signupBonus
        }
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active. Please contact support.'
      });
    }

    // Check password
    const isPasswordValid = await user.checkPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await User.findByIdAndUpdate(user._id, {
      lastLogin: new Date()
    });

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      email: user.email
    });

    // Get user's wallet
    const wallet = await Wallet.findByUserId(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          referralCode: user.referralCode,
          sponsorReferralCode: user.sponsorReferralCode,
          status: user.status,
          lastLogin: user.lastLogin,
          joinedAt: user.joinedAt
        },
        token,
        wallet: wallet ? {
          totalBalance: wallet.totalBalance,
          availableBalance: wallet.availableBalance,
          totalEarnings: wallet.totalEarnings
        } : null
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
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
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify referral code
const verifyReferralCode = async (req, res) => {
  try {
    const { referralCode } = req.params;

    const user = await User.findByReferralCode(referralCode)
      .select('name email referralCode joinedAt status');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Referral code belongs to inactive user'
      });
    }

    res.json({
      success: true,
      data: {
        sponsor: {
          name: user.name,
          email: user.email,
          referralCode: user.referralCode,
          joinedAt: user.joinedAt
        }
      }
    });

  } catch (error) {
    logger.error('Verify referral code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify referral code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout user (if needed for token blacklisting)
const logout = async (req, res) => {
  try {
    // In a more advanced implementation, you might want to blacklist the token
    // For now, we'll just send a success response
    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  verifyReferralCode,
  logout
};