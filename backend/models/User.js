const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include password in queries by default
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
  },
  
  // System Information
  userId: {
    type: String,
    unique: true,
  },
  role: {
    type: String,
    enum: Object.values(config.userRoles),
    default: config.userRoles.USER,
  },
  status: {
    type: String,
    enum: Object.values(config.userStatus),
    default: config.userStatus.PENDING,
  },
  
  // Referral Information
  sponsorId: {
    type: String,
    ref: 'User',
  },
  referralCode: {
    type: String,
    unique: true,
  },
  referralLink: {
    type: String,
  },
  
  // Trading Information
  currentPackage: {
    name: String,
    price: Number,
    purchaseDate: Date,
    expiryDate: Date,
    dailyReturn: Number,
    monthlyReturn: Number,
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  
  // Wallet Information
  wallets: {
    bep20: {
      type: String,
      trim: true,
    },
    erc20: {
      type: String,
      trim: true,
    },
    trc20: {
      type: String,
      trim: true,
    },
  },
  
  // Financial Information
  balance: {
    available: {
      type: Number,
      default: 0,
      min: [0, 'Available balance cannot be negative'],
    },
    locked: {
      type: Number,
      default: 0,
      min: [0, 'Locked balance cannot be negative'],
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: [0, 'Total earnings cannot be negative'],
    },
  },
  
  // Income Statistics
  incomeStats: {
    signupBonus: {
      type: Number,
      default: 0,
    },
    directSponsorBonus: {
      type: Number,
      default: 0,
    },
    tradingProfit: {
      type: Number,
      default: 0,
    },
    teamLevelIncome: {
      type: Number,
      default: 0,
    },
    communityRewards: {
      type: Number,
      default: 0,
    },
    royaltyBonus: {
      type: Number,
      default: 0,
    },
    totalWithdrawals: {
      type: Number,
      default: 0,
    },
  },
  
  // Team Statistics
  teamStats: {
    directReferrals: {
      type: Number,
      default: 0,
    },
    totalTeamSize: {
      type: Number,
      default: 0,
    },
    teamVolume: {
      type: Number,
      default: 0,
    },
    rank: {
      type: String,
      default: 'Bronze',
    },
  },
  
  // Security
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerified: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  
  // Profile Information
  profile: {
    avatar: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    socialLinks: {
      facebook: String,
      twitter: String,
      linkedin: String,
      telegram: String,
    },
  },
  
  // KYC Information
  kyc: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    documents: [{
      type: {
        type: String,
        enum: ['passport', 'driving_license', 'national_id', 'utility_bill'],
      },
      url: String,
      uploadDate: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
    }],
    verificationDate: Date,
    rejectionReason: String,
  },
  
  // Activity
  lastLogin: Date,
  lastActivity: Date,
  ipAddresses: [String],
  
  // Preferences
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      push: {
        type: Boolean,
        default: true,
      },
    },
    language: {
      type: String,
      default: 'en',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ userId: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ sponsorId: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'currentPackage.isActive': 1 });

// Virtual for isLocked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for total balance
userSchema.virtual('totalBalance').get(function() {
  return this.balance.available + this.balance.locked;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(config.security.bcryptRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate userId and referralCode
userSchema.pre('save', async function(next) {
  if (!this.userId) {
    // Generate unique user ID
    let userId;
    let isUnique = false;
    
    while (!isUnique) {
      userId = Math.floor(10000000 + Math.random() * 90000000).toString();
      const existingUser = await this.constructor.findOne({ userId });
      if (!existingUser) {
        isUnique = true;
      }
    }
    
    this.userId = userId;
  }
  
  if (!this.referralCode) {
    // Generate unique referral code
    let referralCode;
    let isUnique = false;
    
    while (!isUnique) {
      referralCode = Math.floor(100000 + Math.random() * 900000).toString();
      const existingUser = await this.constructor.findOne({ referralCode });
      if (!existingUser) {
        isUnique = true;
      }
    }
    
    this.referralCode = referralCode;
  }
  
  // Generate referral link
  if (!this.referralLink) {
    this.referralLink = `${config.server.frontendUrl}/signup?ref=${this.referralCode}`;
  }
  
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to handle login attempts
userSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after max attempts
  if (this.loginAttempts + 1 >= config.security.maxLoginAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + config.security.accountLockTime };
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static method to find by credentials
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  if (user.isLocked) {
    throw new Error('Account locked due to too many failed login attempts');
  }
  
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Invalid credentials');
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }
  
  // Update last login
  user.lastLogin = new Date();
  user.lastActivity = new Date();
  await user.save();
  
  return user;
};

// Static method to find by referral code
userSchema.statics.findBySponsorCode = async function(sponsorCode) {
  return await this.findOne({ referralCode: sponsorCode, status: config.userStatus.ACTIVE });
};

module.exports = mongoose.model('User', userSchema);