const mongoose = require('mongoose');
const config = require('../config/config');

const incomeSchema = new mongoose.Schema({
  // Basic Information
  incomeId: {
    type: String,
    unique: true,
  },
  userId: {
    type: String,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  
  // Income Details
  type: {
    type: String,
    enum: Object.values(config.incomeTypes),
    required: [true, 'Income type is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  currency: {
    type: String,
    default: 'USDT',
    uppercase: true,
  },
  
  // Source Information
  sourceType: {
    type: String,
    enum: ['user_action', 'referral', 'trading', 'system', 'bonus', 'promotion'],
    required: [true, 'Source type is required'],
  },
  sourceUserId: {
    type: String,
    ref: 'User',
  },
  sourceTransactionId: {
    type: String,
    ref: 'Transaction',
  },
  sourcePackageId: {
    type: String,
    ref: 'Package',
  },
  
  // Status and Processing
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'rejected', 'cancelled'],
    default: 'pending',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Referral/Team Information
  level: {
    type: Number,
    min: [1, 'Level must be at least 1'],
    max: [10, 'Level cannot exceed 10'],
  },
  percentage: {
    type: Number,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100%'],
  },
  baseAmount: {
    type: Number,
    min: [0, 'Base amount cannot be negative'],
  },
  
  // Calculation Details
  calculation: {
    formula: String,
    variables: mongoose.Schema.Types.Mixed,
    result: Number,
    notes: String,
  },
  
  // Timing Information
  earnedDate: {
    type: Date,
    default: Date.now,
  },
  creditDate: Date,
  expiryDate: Date,
  
  // Period Information (for recurring income)
  period: {
    type: String,
    enum: ['one_time', 'daily', 'weekly', 'monthly', 'yearly'],
    default: 'one_time',
  },
  periodStart: Date,
  periodEnd: Date,
  
  // Package/Investment Related
  packageDetails: {
    name: String,
    price: Number,
    duration: Number,
    roi: Number,
    startDate: Date,
    endDate: Date,
  },
  
  // Team/Referral Structure
  teamDetails: {
    directReferrals: Number,
    teamSize: Number,
    teamVolume: Number,
    generationVolume: [{
      level: Number,
      volume: Number,
      count: Number,
    }],
  },
  
  // Description and Notes
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  adminNotes: String,
  
  // Processing Information
  processedBy: {
    type: String,
    ref: 'User',
  },
  processedAt: Date,
  
  // Metadata
  metadata: {
    campaign: String,
    promotion: String,
    bonusMultiplier: Number,
    tags: [String],
    category: String,
  },
  
  // Compliance and Tax
  taxable: {
    type: Boolean,
    default: true,
  },
  taxCategory: {
    type: String,
    enum: ['income', 'bonus', 'commission', 'dividend', 'capital_gain'],
    default: 'income',
  },
  
  // Relation to other records
  relatedIncomes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Income',
  }],
  
  // Approval workflow
  approvalWorkflow: {
    requiredApprovals: {
      type: Number,
      default: 1,
    },
    currentApprovals: {
      type: Number,
      default: 0,
    },
    approvers: [{
      userId: {
        type: String,
        ref: 'User',
      },
      approvedAt: Date,
      notes: String,
    }],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
incomeSchema.index({ userId: 1, createdAt: -1 });
incomeSchema.index({ incomeId: 1 });
incomeSchema.index({ type: 1, status: 1 });
incomeSchema.index({ sourceUserId: 1, type: 1 });
incomeSchema.index({ earnedDate: 1 });
incomeSchema.index({ status: 1, earnedDate: -1 });
incomeSchema.index({ level: 1, type: 1 });

// Virtual for days since earned
incomeSchema.virtual('daysSinceEarned').get(function() {
  const diffTime = Math.abs(new Date() - this.earnedDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for display amount
incomeSchema.virtual('displayAmount').get(function() {
  return `${this.amount} ${this.currency}`;
});

// Virtual for is expired
incomeSchema.virtual('isExpired').get(function() {
  return this.expiryDate && this.expiryDate < new Date();
});

// Virtual for needs approval
incomeSchema.virtual('needsApproval').get(function() {
  return this.approvalWorkflow.currentApprovals < this.approvalWorkflow.requiredApprovals;
});

// Pre-save middleware to generate income ID
incomeSchema.pre('save', async function(next) {
  if (!this.incomeId) {
    const prefix = this.type.toUpperCase().substring(0, 3);
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(1000 + Math.random() * 9000);
    this.incomeId = `${prefix}${timestamp}${random}`;
  }
  
  next();
});

// Pre-save middleware to update credit date
incomeSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'paid' && !this.creditDate) {
    this.creditDate = new Date();
  }
  
  next();
});

// Static method to get user income summary
incomeSchema.statics.getUserIncomeSummary = async function(userId, period = 'all') {
  let matchStage = { userId, status: 'paid' };
  
  if (period !== 'all') {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }
    
    if (startDate) {
      matchStage.earnedDate = { $gte: startDate };
    }
  }
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        lastEarned: { $max: '$earnedDate' },
      },
    },
  ];
  
  const results = await this.aggregate(pipeline);
  
  const summary = {
    signupBonus: 0,
    directSponsorBonus: 0,
    tradingProfit: 0,
    teamLevelIncome: 0,
    communityRewards: 0,
    royaltyBonus: 0,
    totalIncome: 0,
    totalTransactions: 0,
    lastEarned: null,
  };
  
  results.forEach(result => {
    const key = result._id.charAt(0).toLowerCase() + result._id.slice(1).replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    if (summary.hasOwnProperty(key)) {
      summary[key] = result.totalAmount;
    }
    
    summary.totalIncome += result.totalAmount;
    summary.totalTransactions += result.count;
    
    if (!summary.lastEarned || result.lastEarned > summary.lastEarned) {
      summary.lastEarned = result.lastEarned;
    }
  });
  
  return summary;
};

// Static method to get team income by level
incomeSchema.statics.getTeamIncomeByLevel = async function(userId, maxLevel = 10) {
  const pipeline = [
    {
      $match: {
        userId,
        type: config.incomeTypes.TEAM_LEVEL_INCOME,
        status: 'paid',
        level: { $lte: maxLevel },
      },
    },
    {
      $group: {
        _id: '$level',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ];
  
  return await this.aggregate(pipeline);
};

// Static method to get pending income for approval
incomeSchema.statics.getPendingApproval = async function(limit = 50) {
  return await this.find({
    status: 'pending',
    $expr: {
      $lt: ['$approvalWorkflow.currentApprovals', '$approvalWorkflow.requiredApprovals']
    }
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to get income by date range
incomeSchema.statics.getByDateRange = async function(startDate, endDate, filters = {}) {
  const query = {
    earnedDate: {
      $gte: startDate,
      $lte: endDate,
    },
    ...filters,
  };
  
  return await this.find(query).sort({ earnedDate: -1 });
};

// Instance method to approve income
incomeSchema.methods.approve = async function(approverId, notes = '') {
  this.approvalWorkflow.currentApprovals += 1;
  this.approvalWorkflow.approvers.push({
    userId: approverId,
    approvedAt: new Date(),
    notes,
  });
  
  if (this.approvalWorkflow.currentApprovals >= this.approvalWorkflow.requiredApprovals) {
    this.status = 'approved';
    this.processedBy = approverId;
    this.processedAt = new Date();
  }
  
  return await this.save();
};

// Instance method to reject income
incomeSchema.methods.reject = async function(rejectorId, reason, notes = '') {
  this.status = 'rejected';
  this.processedBy = rejectorId;
  this.processedAt = new Date();
  this.adminNotes = notes;
  this.metadata.rejectionReason = reason;
  
  return await this.save();
};

// Instance method to mark as paid
incomeSchema.methods.markAsPaid = async function(payerId = null) {
  this.status = 'paid';
  this.creditDate = new Date();
  
  if (payerId) {
    this.processedBy = payerId;
    this.processedAt = new Date();
  }
  
  return await this.save();
};

// Instance method to calculate tax liability
incomeSchema.methods.calculateTax = function(taxRate = 0) {
  if (!this.taxable || taxRate === 0) {
    return 0;
  }
  
  return (this.amount * taxRate) / 100;
};

module.exports = mongoose.model('Income', incomeSchema); 