const mongoose = require('mongoose');
const config = require('../config/config');

const packageSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Package name is required'],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    required: [true, 'Package description is required'],
    trim: true,
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [100, 'Short description cannot exceed 100 characters'],
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Package price is required'],
    min: [1, 'Package price must be at least 1'],
  },
  currency: {
    type: String,
    default: 'USDT',
    uppercase: true,
  },
  
  // Returns
  dailyReturn: {
    type: Number,
    required: [true, 'Daily return is required'],
    min: [0, 'Daily return cannot be negative'],
    max: [100, 'Daily return cannot exceed 100%'],
  },
  monthlyReturn: {
    type: Number,
    required: [true, 'Monthly return is required'],
    min: [0, 'Monthly return cannot be negative'],
    max: [1000, 'Monthly return cannot exceed 1000%'],
  },
  yearlyReturn: {
    type: Number,
    min: [0, 'Yearly return cannot be negative'],
  },
  
  // Duration and Terms
  duration: {
    type: Number,
    required: [true, 'Package duration is required'],
    min: [1, 'Duration must be at least 1 day'],
  },
  durationUnit: {
    type: String,
    enum: ['days', 'months', 'years'],
    default: 'days',
  },
  
  // Features and Benefits
  features: [{
    name: {
      type: String,
      required: true,
    },
    description: String,
    included: {
      type: Boolean,
      default: true,
    },
  }],
  
  // Limits and Requirements
  limits: {
    minInvestment: {
      type: Number,
      default: 0,
    },
    maxInvestment: {
      type: Number,
    },
    maxInvestors: {
      type: Number,
    },
    currentInvestors: {
      type: Number,
      default: 0,
    },
  },
  
  // Referral and Bonus Settings
  bonusSettings: {
    directReferralBonus: {
      type: Number,
      default: 0,
      min: [0, 'Direct referral bonus cannot be negative'],
      max: [100, 'Direct referral bonus cannot exceed 100%'],
    },
    teamLevelBonus: [{
      level: {
        type: Number,
        required: true,
        min: 1,
      },
      percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
    }],
    eligibleForRoyaltyBonus: {
      type: Boolean,
      default: false,
    },
  },
  
  // Risk and Investment Information
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'very_high'],
    required: [true, 'Risk level is required'],
  },
  investmentType: {
    type: String,
    enum: ['trading', 'mining', 'staking', 'liquidity_farming', 'mixed'],
    required: [true, 'Investment type is required'],
  },
  
  // Status and Availability
  status: {
    type: String,
    enum: ['active', 'inactive', 'coming_soon', 'sold_out', 'ended'],
    default: 'active',
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  
  // Timing
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: Date,
  
  // Media and Presentation
  images: [{
    url: String,
    caption: String,
    isMain: {
      type: Boolean,
      default: false,
    },
  }],
  icon: String,
  color: {
    type: String,
    default: '#00f5cc',
  },
  
  // Terms and Conditions
  terms: {
    withdrawalTerms: String,
    penaltyTerms: String,
    cancellationPolicy: String,
    compoundingAllowed: {
      type: Boolean,
      default: false,
    },
    autoRenewal: {
      type: Boolean,
      default: false,
    },
  },
  
  // Statistics
  statistics: {
    totalInvested: {
      type: Number,
      default: 0,
    },
    totalInvestors: {
      type: Number,
      default: 0,
    },
    totalReturned: {
      type: Number,
      default: 0,
    },
    averageInvestment: {
      type: Number,
      default: 0,
    },
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  
  // Admin Information
  createdBy: {
    type: String,
    ref: 'User',
  },
  lastModifiedBy: {
    type: String,
    ref: 'User',
  },
  
  // Metadata
  metadata: {
    tags: [String],
    category: String,
    targetAudience: [String],
    marketingNotes: String,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
packageSchema.index({ status: 1, startDate: 1 });
packageSchema.index({ price: 1 });
packageSchema.index({ riskLevel: 1 });
packageSchema.index({ isPopular: 1 });
packageSchema.index({ isFeatured: 1 });

// Virtual for availability status
packageSchema.virtual('isAvailable').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.startDate <= now && 
         (!this.endDate || this.endDate >= now) &&
         (!this.limits.maxInvestors || this.limits.currentInvestors < this.limits.maxInvestors);
});

// Virtual for days remaining
packageSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const diffTime = this.endDate - new Date();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// Virtual for slots remaining
packageSchema.virtual('slotsRemaining').get(function() {
  if (!this.limits.maxInvestors) return null;
  return Math.max(0, this.limits.maxInvestors - this.limits.currentInvestors);
});

// Virtual for ROI calculation
packageSchema.virtual('totalROI').get(function() {
  const durationInDays = this.durationUnit === 'days' ? this.duration :
                        this.durationUnit === 'months' ? this.duration * 30 :
                        this.duration * 365;
  return this.dailyReturn * durationInDays;
});

// Pre-save middleware to calculate yearly return
packageSchema.pre('save', function(next) {
  if (this.isModified('dailyReturn') || this.isModified('monthlyReturn')) {
    // Calculate yearly return based on daily return
    this.yearlyReturn = this.dailyReturn * 365;
  }
  
  // Update average investment
  if (this.statistics.totalInvestors > 0) {
    this.statistics.averageInvestment = this.statistics.totalInvested / this.statistics.totalInvestors;
  }
  
  next();
});

// Static method to get active packages
packageSchema.statics.getActivePackages = async function() {
  const now = new Date();
  return await this.find({
    status: 'active',
    startDate: { $lte: now },
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gte: now } }
    ]
  }).sort({ price: 1 });
};

// Static method to get popular packages
packageSchema.statics.getPopularPackages = async function(limit = 5) {
  return await this.find({
    status: 'active',
    isPopular: true
  })
  .sort({ 'statistics.totalInvestors': -1 })
  .limit(limit);
};

// Static method to get featured packages
packageSchema.statics.getFeaturedPackages = async function() {
  return await this.find({
    status: 'active',
    isFeatured: true
  }).sort({ price: 1 });
};

// Static method to get packages by risk level
packageSchema.statics.getByRiskLevel = async function(riskLevel) {
  return await this.find({
    status: 'active',
    riskLevel: riskLevel
  }).sort({ price: 1 });
};

// Instance method to check if user can invest
packageSchema.methods.canUserInvest = function(amount, userCurrentPackage = null) {
  if (!this.isAvailable) {
    return { canInvest: false, reason: 'Package not available' };
  }
  
  if (amount < this.limits.minInvestment) {
    return { canInvest: false, reason: `Minimum investment is ${this.limits.minInvestment} ${this.currency}` };
  }
  
  if (this.limits.maxInvestment && amount > this.limits.maxInvestment) {
    return { canInvest: false, reason: `Maximum investment is ${this.limits.maxInvestment} ${this.currency}` };
  }
  
  if (userCurrentPackage && userCurrentPackage.isActive) {
    return { canInvest: false, reason: 'User already has an active package' };
  }
  
  return { canInvest: true };
};

// Instance method to calculate returns
packageSchema.methods.calculateReturns = function(principal, days = null) {
  const investmentDays = days || (this.durationUnit === 'days' ? this.duration :
                                 this.durationUnit === 'months' ? this.duration * 30 :
                                 this.duration * 365);
  
  const dailyProfit = (principal * this.dailyReturn) / 100;
  const totalProfit = dailyProfit * investmentDays;
  const totalReturn = principal + totalProfit;
  
  return {
    principal,
    dailyProfit,
    totalProfit,
    totalReturn,
    days: investmentDays,
    roi: (totalProfit / principal) * 100
  };
};

// Instance method to increment investor count
packageSchema.methods.addInvestor = async function(investmentAmount) {
  this.limits.currentInvestors += 1;
  this.statistics.totalInvestors += 1;
  this.statistics.totalInvested += investmentAmount;
  
  return await this.save();
};

// Instance method to decrement investor count (for cancellations)
packageSchema.methods.removeInvestor = async function(investmentAmount) {
  this.limits.currentInvestors = Math.max(0, this.limits.currentInvestors - 1);
  this.statistics.totalInvestors = Math.max(0, this.statistics.totalInvestors - 1);
  this.statistics.totalInvested = Math.max(0, this.statistics.totalInvested - investmentAmount);
  
  return await this.save();
};

module.exports = mongoose.model('Package', packageSchema); 