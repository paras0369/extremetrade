const mongoose = require('mongoose');
const config = require('../config/config');

const transactionSchema = new mongoose.Schema({
  // Basic Information
  transactionId: {
    type: String,
    unique: true,
    required: true,
  },
  userId: {
    type: String,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  
  // Transaction Details
  type: {
    type: String,
    enum: Object.values(config.transactionTypes),
    required: [true, 'Transaction type is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be positive'],
  },
  fee: {
    type: Number,
    default: 0,
    min: [0, 'Fee cannot be negative'],
  },
  netAmount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USDT',
    uppercase: true,
  },
  
  // Status and Processing
  status: {
    type: String,
    enum: Object.values(config.transactionStatus),
    default: config.transactionStatus.PENDING,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  
  // Payment Information (for deposits/withdrawals)
  paymentDetails: {
    method: {
      type: String,
      enum: ['bep20', 'erc20', 'trc20', 'bank_transfer', 'credit_card'],
    },
    walletAddress: String,
    transactionHash: String,
    bankDetails: {
      accountNumber: String,
      routingNumber: String,
      bankName: String,
    },
    cardDetails: {
      last4: String,
      brand: String,
    },
  },
  
  // Proof and Documentation
  proofOfPayment: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  
  // Admin Information
  processedBy: {
    type: String,
    ref: 'User',
  },
  processedAt: Date,
  adminNotes: String,
  rejectionReason: String,
  
  // Bonus/Income Specific Information
  bonusDetails: {
    incomeType: {
      type: String,
      enum: Object.values(config.incomeTypes),
    },
    sourceTransactionId: String,
    fromUser: {
      type: String,
      ref: 'User',
    },
    level: Number, // For team level bonuses
    packageName: String,
    calculationDetails: {
      baseAmount: Number,
      percentage: Number,
      formula: String,
    },
  },
  
  // Reference Information
  relatedTransactionId: String,
  parentTransactionId: String,
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    location: {
      country: String,
      city: String,
      timezone: String,
    },
    device: {
      type: String,
      os: String,
      browser: String,
    },
  },
  
  // Timestamps for different stages
  timestamps: {
    initiated: {
      type: Date,
      default: Date.now,
    },
    submitted: Date,
    approved: Date,
    processing: Date,
    completed: Date,
    rejected: Date,
  },
  
  // Blockchain Information (for crypto transactions)
  blockchain: {
    network: String,
    confirmations: {
      type: Number,
      default: 0,
    },
    requiredConfirmations: {
      type: Number,
      default: 12,
    },
    blockNumber: Number,
    gasUsed: Number,
    gasPrice: String,
  },
  
  // Compliance and Risk
  compliance: {
    amlCheck: {
      status: {
        type: String,
        enum: ['pending', 'passed', 'failed', 'manual_review'],
        default: 'pending',
      },
      score: Number,
      provider: String,
      checkedAt: Date,
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    flagged: {
      type: Boolean,
      default: false,
    },
    flagReason: String,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ 'paymentDetails.transactionHash': 1 });
transactionSchema.index({ 'bonusDetails.fromUser': 1 });
transactionSchema.index({ 'bonusDetails.incomeType': 1 });

// Virtual for transaction display
transactionSchema.virtual('displayAmount').get(function() {
  return `${this.amount} ${this.currency}`;
});

// Virtual for fee percentage
transactionSchema.virtual('feePercentage').get(function() {
  if (this.amount === 0) return 0;
  return (this.fee / this.amount) * 100;
});

// Virtual for days since creation
transactionSchema.virtual('daysSinceCreation').get(function() {
  const diffTime = Math.abs(new Date() - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to generate transaction ID
transactionSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    const prefix = this.type.toUpperCase().substring(0, 3);
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(1000 + Math.random() * 9000);
    this.transactionId = `${prefix}${timestamp}${random}`;
  }
  
  // Calculate net amount
  if (this.type === config.transactionTypes.WITHDRAWAL) {
    this.netAmount = this.amount - this.fee;
  } else {
    this.netAmount = this.amount;
  }
  
  next();
});

// Pre-save middleware to update timestamps based on status
transactionSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    
    switch (this.status) {
      case config.transactionStatus.PENDING:
        if (!this.timestamps.submitted) {
          this.timestamps.submitted = now;
        }
        break;
      case config.transactionStatus.APPROVED:
        this.timestamps.approved = now;
        break;
      case config.transactionStatus.PROCESSING:
        this.timestamps.processing = now;
        break;
      case config.transactionStatus.COMPLETED:
        this.timestamps.completed = now;
        break;
      case config.transactionStatus.REJECTED:
        this.timestamps.rejected = now;
        break;
    }
  }
  
  next();
});

// Static method to get user transaction summary
transactionSchema.statics.getUserSummary = async function(userId) {
  const pipeline = [
    { $match: { userId, status: config.transactionStatus.COMPLETED } },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        totalFees: { $sum: '$fee' },
        count: { $sum: 1 },
        lastTransaction: { $max: '$createdAt' },
      },
    },
  ];
  
  const results = await this.aggregate(pipeline);
  
  const summary = {
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalBonuses: 0,
    totalTransactions: 0,
    totalFees: 0,
    lastActivity: null,
  };
  
  results.forEach(result => {
    switch (result._id) {
      case config.transactionTypes.DEPOSIT:
        summary.totalDeposits = result.totalAmount;
        break;
      case config.transactionTypes.WITHDRAWAL:
        summary.totalWithdrawals = result.totalAmount;
        break;
      case config.transactionTypes.BONUS:
        summary.totalBonuses = result.totalAmount;
        break;
    }
    
    summary.totalTransactions += result.count;
    summary.totalFees += result.totalFees;
    
    if (!summary.lastActivity || result.lastTransaction > summary.lastActivity) {
      summary.lastActivity = result.lastTransaction;
    }
  });
  
  return summary;
};

// Static method to get pending transactions count
transactionSchema.statics.getPendingCount = async function() {
  return await this.countDocuments({ status: config.transactionStatus.PENDING });
};

// Static method to get transactions by date range
transactionSchema.statics.getByDateRange = async function(startDate, endDate, filters = {}) {
  const query = {
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
    ...filters,
  };
  
  return await this.find(query).sort({ createdAt: -1 });
};

// Instance method to approve transaction
transactionSchema.methods.approve = async function(adminId, notes = '') {
  this.status = config.transactionStatus.APPROVED;
  this.processedBy = adminId;
  this.processedAt = new Date();
  this.adminNotes = notes;
  
  return await this.save();
};

// Instance method to reject transaction
transactionSchema.methods.reject = async function(adminId, reason, notes = '') {
  this.status = config.transactionStatus.REJECTED;
  this.processedBy = adminId;
  this.processedAt = new Date();
  this.rejectionReason = reason;
  this.adminNotes = notes;
  
  return await this.save();
};

// Instance method to complete transaction
transactionSchema.methods.complete = async function(adminId = null, notes = '') {
  this.status = config.transactionStatus.COMPLETED;
  if (adminId) {
    this.processedBy = adminId;
    this.processedAt = new Date();
  }
  if (notes) {
    this.adminNotes = notes;
  }
  
  return await this.save();
};

module.exports = mongoose.model('Transaction', transactionSchema); 