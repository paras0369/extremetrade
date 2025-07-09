const mongoose = require('mongoose');
const { TRANSACTION_TYPES, TRANSACTION_STATUS } = require('../config/constants');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  type: {
    type: String,
    enum: Object.values(TRANSACTION_TYPES),
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: Object.values(TRANSACTION_STATUS),
    default: TRANSACTION_STATUS.COMPLETED
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: Number,
    default: null,
    min: 1,
    max: 4
  },
  commissionPercentage: {
    type: Number,
    default: null,
    min: 0,
    max: 100
  },
  transactionHash: {
    type: String,
    default: null
  },
  reference: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  processedAt: {
    type: Date,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for transaction age
transactionSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Index for better query performance
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ fromUserId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ createdAt: -1 });

// Pre-save middleware to set processed date
transactionSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === TRANSACTION_STATUS.COMPLETED) {
      this.processedAt = new Date();
    } else if (this.status === TRANSACTION_STATUS.APPROVED) {
      this.approvedAt = new Date();
    } else if (this.status === TRANSACTION_STATUS.REJECTED) {
      this.rejectedAt = new Date();
    }
  }
  next();
});

// Method to approve transaction
transactionSchema.methods.approve = async function(approvedBy) {
  this.status = TRANSACTION_STATUS.APPROVED;
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  await this.save();
  return this;
};

// Method to reject transaction
transactionSchema.methods.reject = async function(rejectedBy, reason) {
  this.status = TRANSACTION_STATUS.REJECTED;
  this.rejectedBy = rejectedBy;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  await this.save();
  return this;
};

// Method to complete transaction
transactionSchema.methods.complete = async function() {
  this.status = TRANSACTION_STATUS.COMPLETED;
  this.processedAt = new Date();
  await this.save();
  return this;
};

// Static method to get user transactions
transactionSchema.statics.findByUserId = function(userId, options = {}) {
  const query = this.find({ userId });
  
  if (options.type) {
    query.where('type').equals(options.type);
  }
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  if (options.sort) {
    query.sort(options.sort);
  } else {
    query.sort({ createdAt: -1 });
  }
  
  return query;
};

// Static method to get commission transactions
transactionSchema.statics.findCommissionTransactions = function(fromUserId, options = {}) {
  const query = this.find({ fromUserId });
  
  if (options.level) {
    query.where('level').equals(options.level);
  }
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  return query.sort({ createdAt: -1 });
};

// Static method to get income summary
transactionSchema.statics.getIncomeSummary = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);