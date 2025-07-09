const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  availableBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  lockedBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  signupBonus: {
    type: Number,
    default: 0,
    min: 0
  },
  directReferralIncome: {
    type: Number,
    default: 0,
    min: 0
  },
  level2Income: {
    type: Number,
    default: 0,
    min: 0
  },
  level3Income: {
    type: Number,
    default: 0,
    min: 0
  },
  level4Income: {
    type: Number,
    default: 0,
    min: 0
  },
  rewardIncome: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWithdrawals: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingWithdrawals: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to calculate total level commission
walletSchema.virtual('totalLevelCommission').get(function() {
  return this.level2Income + this.level3Income + this.level4Income;
});

// Virtual to calculate total income breakdown
walletSchema.virtual('incomeBreakdown').get(function() {
  return {
    signupBonus: this.signupBonus,
    directReferralIncome: this.directReferralIncome,
    levelCommissions: {
      level2: this.level2Income,
      level3: this.level3Income,
      level4: this.level4Income,
      total: this.totalLevelCommission
    },
    rewardIncome: this.rewardIncome,
    totalEarnings: this.totalEarnings
  };
});

// Index for better query performance
walletSchema.index({ userId: 1 });
walletSchema.index({ totalBalance: 1 });
walletSchema.index({ availableBalance: 1 });

// Pre-save middleware to update total balance and earnings
walletSchema.pre('save', function(next) {
  // Calculate total earnings
  this.totalEarnings = this.signupBonus + this.directReferralIncome + 
                      this.level2Income + this.level3Income + 
                      this.level4Income + this.rewardIncome;
  
  // Calculate total balance
  this.totalBalance = this.totalEarnings - this.totalWithdrawals;
  
  // Calculate available balance
  this.availableBalance = this.totalBalance - this.lockedBalance - this.pendingWithdrawals;
  
  // Update last updated timestamp
  this.lastUpdated = new Date();
  
  next();
});

// Method to add income
walletSchema.methods.addIncome = async function(incomeType, amount) {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  
  switch (incomeType) {
    case 'SIGNUP_BONUS':
      this.signupBonus += amount;
      break;
    case 'DIRECT_REFERRAL':
      this.directReferralIncome += amount;
      break;
    case 'LEVEL2_COMMISSION':
      this.level2Income += amount;
      break;
    case 'LEVEL3_COMMISSION':
      this.level3Income += amount;
      break;
    case 'LEVEL4_COMMISSION':
      this.level4Income += amount;
      break;
    case 'REWARD_INCOME':
      this.rewardIncome += amount;
      break;
    default:
      throw new Error('Invalid income type');
  }
  
  await this.save();
  return this;
};

// Method to lock/unlock balance
walletSchema.methods.lockBalance = async function(amount) {
  if (amount > this.availableBalance) {
    throw new Error('Insufficient available balance');
  }
  
  this.lockedBalance += amount;
  await this.save();
  return this;
};

walletSchema.methods.unlockBalance = async function(amount) {
  if (amount > this.lockedBalance) {
    throw new Error('Cannot unlock more than locked balance');
  }
  
  this.lockedBalance -= amount;
  await this.save();
  return this;
};

// Method to process withdrawal
walletSchema.methods.processWithdrawal = async function(amount) {
  if (amount > this.availableBalance) {
    throw new Error('Insufficient available balance');
  }
  
  this.pendingWithdrawals += amount;
  await this.save();
  return this;
};

// Method to complete withdrawal
walletSchema.methods.completeWithdrawal = async function(amount) {
  if (amount > this.pendingWithdrawals) {
    throw new Error('Cannot complete withdrawal more than pending amount');
  }
  
  this.pendingWithdrawals -= amount;
  this.totalWithdrawals += amount;
  await this.save();
  return this;
};

// Method to cancel withdrawal
walletSchema.methods.cancelWithdrawal = async function(amount) {
  if (amount > this.pendingWithdrawals) {
    throw new Error('Cannot cancel withdrawal more than pending amount');
  }
  
  this.pendingWithdrawals -= amount;
  await this.save();
  return this;
};

// Static method to get wallet by user ID
walletSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

module.exports = mongoose.model('Wallet', walletSchema);