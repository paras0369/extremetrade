const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Team = require('../models/Team');
const Income = require('../models/Income');
const config = require('../config/config');

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
  
  return { accessToken, refreshToken };
};

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, phone, sponsorCode } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email',
      });
    }
    
    // Find sponsor if sponsor code is provided
    let sponsor = null;
    if (sponsorCode) {
      sponsor = await User.findBySponsorCode(sponsorCode);
      if (!sponsor) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid sponsor code',
        });
      }
    }
    
    // Create new user
    const userData = {
      name,
      email,
      password,
      phone,
      sponsorId: sponsor ? sponsor.userId : null,
      status: config.userStatus.ACTIVE, // Auto-activate for demo
      emailVerified: true, // Auto-verify for demo
    };
    
    const user = new User(userData);
    await user.save();
    
    // Create team record
    const teamData = {
      userId: user.userId,
      sponsorId: sponsor ? sponsor.userId : null,
      level: sponsor ? 1 : 0,
    };
    
    const team = new Team(teamData);
    await team.save();
    
    // If user has sponsor, update sponsor's team statistics
    if (sponsor) {
      const sponsorTeam = await Team.findOne({ userId: sponsor.userId });
      if (sponsorTeam) {
        await sponsorTeam.addReferral(user.userId);
      }
      
      // Award signup bonus to new user
      const signupBonus = new Income({
        userId: user.userId,
        type: config.incomeTypes.SIGNUP_BONUS,
        amount: 10, // $10 signup bonus
        sourceType: 'system',
        description: 'Welcome bonus for new user registration',
        status: 'approved',
      });
      await signupBonus.save();
      
      // Award direct sponsor bonus to sponsor
      const sponsorBonus = new Income({
        userId: sponsor.userId,
        type: config.incomeTypes.DIRECT_SPONSOR_BONUS,
        amount: 5, // $5 direct sponsor bonus
        sourceType: 'referral',
        sourceUserId: user.userId,
        description: `Direct sponsor bonus for referring ${user.name}`,
        status: 'approved',
      });
      await sponsorBonus.save();
      
      // Update user balance
      user.balance.available += 10;
      await user.save();
      
      // Update sponsor balance
      sponsor.balance.available += 5;
      await sponsor.save();
    }
    
    // Generate tokens
    const tokens = generateTokens(user.userId);
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: userResponse,
        tokens,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed',
      error: error.message,
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by credentials
    const user = await User.findByCredentials(email, password);
    
    // Generate tokens
    const tokens = generateTokens(user.userId);
    
    // Update IP address tracking
    const clientIp = req.ip || req.connection.remoteAddress;
    if (clientIp && !user.ipAddresses.includes(clientIp)) {
      user.ipAddresses.push(clientIp);
      if (user.ipAddresses.length > 10) {
        user.ipAddresses = user.ipAddresses.slice(-10); // Keep only last 10 IPs
      }
      await user.save();
    }
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userResponse,
        tokens,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    const user = req.user; // User is set by authenticateRefreshToken middleware
    
    // Generate new tokens
    const tokens = generateTokens(user.userId);
    
    res.json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        tokens,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Token refresh failed',
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const user = req.user;
    
    // Update last activity
    user.lastActivity = new Date();
    await user.save();
    
    res.json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Logout failed',
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    
    // Get user's team information
    const team = await Team.findOne({ userId: user.userId });
    
    // Get user's income summary
    const incomeSummary = await Income.getUserIncomeSummary(user.userId);
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({
      status: 'success',
      data: {
        user: userResponse,
        team,
        incomeSummary,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get profile',
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const allowedUpdates = ['name', 'phone', 'profile'];
    const updates = {};
    
    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    // Update user
    Object.assign(user, updates);
    await user.save();
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Profile update failed',
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect',
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Password change failed',
    });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        status: 'success',
        message: 'Password reset email sent if account exists',
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set reset token and expiry
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();
    
    // TODO: Send email with reset link
    // For now, just return success
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    res.json({
      status: 'success',
      message: 'Password reset email sent if account exists',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Password reset request failed',
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token',
      });
    }
    
    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    res.json({
      status: 'success',
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Password reset failed',
    });
  }
};

// Send email verification
const sendEmailVerification = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.emailVerified) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is already verified',
      });
    }
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    user.emailVerificationToken = verificationToken;
    await user.save();
    
    // TODO: Send verification email
    console.log(`Email verification token for ${user.email}: ${verificationToken}`);
    
    res.json({
      status: 'success',
      message: 'Verification email sent',
    });
  } catch (error) {
    console.error('Send email verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send verification email',
    });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    const user = await User.findOne({
      emailVerificationToken: token,
    });
    
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid verification token',
      });
    }
    
    // Verify email
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
    
    res.json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Email verification failed',
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  sendEmailVerification,
  verifyEmail,
}; 