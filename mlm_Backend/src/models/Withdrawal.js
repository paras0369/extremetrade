const mongoose = require('mongoose');
const { WITHDRAWAL_STATUS } = require('../config/constants');

const withdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  method: {
    type: String,
    enum: ['BANK_TRANSFER', 'USDT', 'CRYPTO'],
    required: true
  },
  status: {
    type: String,
    enum: Object.values(WITHDRAWAL_STATUS),
    default: WITHDRAWAL_STATUS.PENDING
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountHolderName: String,
    ifscCode: String,
    routingNumber: String
  },
  usdtAddress: {
    type: String,
    trim: true
  },
  transactionHash: {
    type: String,
    default: null
  },
  processingFee: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  adminNotes: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for withdrawal age
withdrawalSchema.virtual('age').get(function() {
  return Date.now() - this.requestedAt;
});

// Virtual for formatted amount
withdrawalSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Virtual for formatted net amount
withdrawalSchema.virtual('formattedNetAmount').get(function() {
  return `$${this.netAmount.toFixed(2)}`;
});

// Index for better query performance
withdrawalSchema.index({ userId: 1, requestedAt: -1 });
withdrawalSchema.index({ status: 1, requestedAt: -1 });
withdrawalSchema.index({ method: 1 });
withdrawalSchema.index({ processedBy: 1 });

// Pre-save middleware to calculate net amount
withdrawalSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('processingFee')) {
    this.netAmount = this.amount - this.processingFee;
  }
  
  if (this.isModified('status')) {
    const now = new Date();
    
    switch (this.status) {
      case WITHDRAWAL_STATUS.PROCESSING:
        this.processedAt = now;
        break;
      case WITHDRAWAL_STATUS.COMPLETED:
        this.completedAt = now;
        break;
      case WITHDRAWAL_STATUS.REJECTED:
        this.rejectedAt = now;
        break;
    }
  }
  
  next();
});

// Method to approve withdrawal
withdrawalSchema.methods.approve = async function(processedBy) {
  this.status = WITHDRAWAL_STATUS.PROCESSING;
  this.processedBy = processedBy;
  this.processedAt = new Date();
  await this.save();
  return this;
};

// Method to complete withdrawal
withdrawalSchema.methods.complete = async function(transactionHash = null) {
  this.status = WITHDRAWAL_STATUS.COMPLETED;
  this.completedAt = new Date();
  if (transactionHash) {
    this.transactionHash = transactionHash;
  }
  await this.save();
  return this;
};

// Method to reject withdrawal
withdrawalSchema.methods.reject = async function(rejectionReason, processedBy) {
  this.status = WITHDRAWAL_STATUS.REJECTED;
  this.rejectionReason = rejectionReason;
  this.processedBy = processedBy;
  this.rejectedAt = new Date();
  await this.save();
  return this;
};

// Static method to get user withdrawals
withdrawalSchema.statics.findByUserId = function(userId, options = {}) {
  const query = this.find({ userId });
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  if (options.method) {
    query.where('method').equals(options.method);
  }
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  return query.sort({ requestedAt: -1 });
};

// Static method to get withdrawal statistics
withdrawalSchema.statics.getWithdrawalStats = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalNetAmount: { $sum: '$netAmount' }
      }
    }
  ]);
};

// Static method to get pending withdrawals
withdrawalSchema.statics.getPendingWithdrawals = function(options = {}) {
  const query = this.find({ status: WITHDRAWAL_STATUS.PENDING });
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  return query.sort({ requestedAt: 1 }).populate('userId', 'name email phone');
};

module.exports = mongoose.model('Withdrawal', withdrawalSchema);