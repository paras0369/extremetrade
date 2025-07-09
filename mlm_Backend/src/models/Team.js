const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalBusiness: {
    type: Number,
    default: 0
  },
  directBusiness: {
    type: Number,
    default: 0
  },
  teamBusiness: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for better query performance
teamSchema.index({ userId: 1, level: 1 });
teamSchema.index({ userId: 1, memberId: 1 }, { unique: true });
teamSchema.index({ memberId: 1 });
teamSchema.index({ level: 1 });

// Virtual for member details
teamSchema.virtual('memberDetails', {
  ref: 'User',
  localField: 'memberId',
  foreignField: '_id',
  justOne: true
});

// Virtual for user details
teamSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Static method to get team by user ID and level
teamSchema.statics.findByUserAndLevel = function(userId, level) {
  return this.find({ userId, level }).populate('memberDetails', 'name email referralCode totalInvestment joinedAt status');
};

// Static method to get entire team
teamSchema.statics.findTeamByUser = function(userId) {
  return this.find({ userId }).populate('memberDetails', 'name email referralCode totalInvestment joinedAt status level');
};

// Static method to get team statistics
teamSchema.statics.getTeamStats = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$level',
        count: { $sum: 1 },
        totalBusiness: { $sum: '$totalBusiness' },
        activeMemberCount: {
          $sum: {
            $cond: [{ $eq: ['$isActive', true] }, 1, 0]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to update team business
teamSchema.statics.updateTeamBusiness = async function(userId, businessAmount) {
  // Update direct business for immediate sponsor
  await this.updateOne(
    { userId, memberId: userId },
    { $inc: { directBusiness: businessAmount, totalBusiness: businessAmount } }
  );
  
  // Update team business for all upline members
  const teamMembers = await this.find({ memberId: userId });
  
  for (const member of teamMembers) {
    await this.updateOne(
      { userId: member.userId, memberId: userId },
      { $inc: { teamBusiness: businessAmount, totalBusiness: businessAmount } }
    );
  }
};

module.exports = mongoose.model('Team', teamSchema);