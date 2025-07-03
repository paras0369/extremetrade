const mongoose = require('mongoose');
const config = require('../config/config');

const teamSchema = new mongoose.Schema({
  // Basic Information
  userId: {
    type: String,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
    index: true,
  },
  sponsorId: {
    type: String,
    ref: 'User',
    index: true,
  },
  
  // Team Structure
  level: {
    type: Number,
    required: [true, 'Level is required'],
    min: [0, 'Level cannot be negative'],
    max: [10, 'Level cannot exceed 10'],
    default: 0,
  },
  position: {
    type: String,
    enum: ['left', 'right', 'center', 'auto'],
    default: 'auto',
  },
  
  // Direct Team Members
  directReferrals: [{
    userId: {
      type: String,
      ref: 'User',
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    totalInvestment: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    rank: {
      type: String,
      default: 'Bronze',
    },
  }],
  
  // Team Statistics
  teamStats: {
    totalMembers: {
      type: Number,
      default: 0,
    },
    activeMembers: {
      type: Number,
      default: 0,
    },
    totalVolume: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    generationCount: [{
      level: {
        type: Number,
        required: true,
      },
      count: {
        type: Number,
        default: 0,
      },
      volume: {
        type: Number,
        default: 0,
      },
      activeCount: {
        type: Number,
        default: 0,
      },
    }],
  },
  
  // Genealogy Tree (for binary/matrix plans)
  genealogy: {
    leftLeg: {
      members: {
        type: Number,
        default: 0,
      },
      volume: {
        type: Number,
        default: 0,
      },
      activeMembers: {
        type: Number,
        default: 0,
      },
    },
    rightLeg: {
      members: {
        type: Number,
        default: 0,
      },
      volume: {
        type: Number,
        default: 0,
      },
      activeMembers: {
        type: Number,
        default: 0,
      },
    },
    carryForward: {
      left: {
        type: Number,
        default: 0,
      },
      right: {
        type: Number,
        default: 0,
      },
    },
  },
  
  // Rank and Achievements
  rank: {
    current: {
      type: String,
      default: 'Bronze',
    },
    achieved: [{
      rank: String,
      achievedDate: {
        type: Date,
        default: Date.now,
      },
      qualifyingVolume: Number,
      qualifyingMembers: Number,
    }],
    nextRank: {
      target: String,
      requiredVolume: Number,
      requiredMembers: Number,
      progress: {
        volume: {
          type: Number,
          default: 0,
        },
        members: {
          type: Number,
          default: 0,
        },
      },
    },
  },
  
  // Qualification Criteria
  qualifications: {
    isActive: {
      type: Boolean,
      default: true,
    },
    hasActivePackage: {
      type: Boolean,
      default: false,
    },
    minimumVolume: {
      type: Number,
      default: 0,
    },
    minimumDirects: {
      type: Number,
      default: 0,
    },
    lastQualificationDate: Date,
  },
  
  // Bonus and Commission Settings
  bonusSettings: {
    directReferralBonus: {
      percentage: {
        type: Number,
        default: 0,
      },
      maxAmount: Number,
      qualified: {
        type: Boolean,
        default: true,
      },
    },
    levelCommissions: [{
      level: {
        type: Number,
        required: true,
      },
      percentage: {
        type: Number,
        required: true,
      },
      maxAmount: Number,
      qualified: {
        type: Boolean,
        default: true,
      },
    }],
    binaryBonus: {
      percentage: {
        type: Number,
        default: 0,
      },
      maxAmount: Number,
      qualified: {
        type: Boolean,
        default: false,
      },
    },
  },
  
  // Performance Metrics
  performance: {
    thisMonth: {
      personalVolume: {
        type: Number,
        default: 0,
      },
      teamVolume: {
        type: Number,
        default: 0,
      },
      newReferrals: {
        type: Number,
        default: 0,
      },
      totalEarnings: {
        type: Number,
        default: 0,
      },
    },
    lastMonth: {
      personalVolume: {
        type: Number,
        default: 0,
      },
      teamVolume: {
        type: Number,
        default: 0,
      },
      newReferrals: {
        type: Number,
        default: 0,
      },
      totalEarnings: {
        type: Number,
        default: 0,
      },
    },
    allTime: {
      personalVolume: {
        type: Number,
        default: 0,
      },
      teamVolume: {
        type: Number,
        default: 0,
      },
      totalReferrals: {
        type: Number,
        default: 0,
      },
      totalEarnings: {
        type: Number,
        default: 0,
      },
    },
  },
  
  // Team Path (for easy upline tracking)
  teamPath: [{
    userId: {
      type: String,
      ref: 'User',
    },
    level: Number,
    position: String,
  }],
  
  // Activity and Engagement
  activity: {
    lastActive: Date,
    loginCount: {
      type: Number,
      default: 0,
    },
    activityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    engagementLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  
  // Metadata
  metadata: {
    joinSource: {
      type: String,
      enum: ['referral', 'direct', 'campaign', 'social', 'other'],
      default: 'referral',
    },
    placementBy: {
      type: String,
      ref: 'User',
    },
    placementDate: {
      type: Date,
      default: Date.now,
    },
    notes: String,
    tags: [String],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
teamSchema.index({ userId: 1 });
teamSchema.index({ sponsorId: 1 });
teamSchema.index({ level: 1 });
teamSchema.index({ 'rank.current': 1 });
teamSchema.index({ 'teamStats.totalVolume': -1 });
teamSchema.index({ 'qualifications.isActive': 1 });

// Virtual for direct referrals count
teamSchema.virtual('directReferralsCount').get(function() {
  return this.directReferrals.length;
});

// Virtual for active direct referrals count
teamSchema.virtual('activeDirectReferralsCount').get(function() {
  return this.directReferrals.filter(ref => ref.status === 'active').length;
});

// Virtual for total team volume
teamSchema.virtual('totalTeamVolume').get(function() {
  return this.teamStats.totalVolume;
});

// Virtual for binary match
teamSchema.virtual('binaryMatch').get(function() {
  return Math.min(this.genealogy.leftLeg.volume, this.genealogy.rightLeg.volume);
});

// Virtual for weaker leg
teamSchema.virtual('weakerLeg').get(function() {
  return this.genealogy.leftLeg.volume <= this.genealogy.rightLeg.volume ? 'left' : 'right';
});

// Virtual for stronger leg
teamSchema.virtual('strongerLeg').get(function() {
  return this.genealogy.leftLeg.volume > this.genealogy.rightLeg.volume ? 'left' : 'right';
});

// Pre-save middleware to update team statistics
teamSchema.pre('save', function(next) {
  // Update active members count
  this.teamStats.activeMembers = this.directReferrals.filter(ref => ref.status === 'active').length;
  
  // Update total members count
  this.teamStats.totalMembers = this.directReferrals.length;
  
  // Calculate activity score
  const now = new Date();
  const daysSinceLastActive = this.activity.lastActive ? 
    Math.floor((now - this.activity.lastActive) / (1000 * 60 * 60 * 24)) : 30;
  
  this.activity.activityScore = Math.max(0, 100 - (daysSinceLastActive * 2));
  
  // Set engagement level based on activity score
  if (this.activity.activityScore >= 70) {
    this.activity.engagementLevel = 'high';
  } else if (this.activity.activityScore >= 40) {
    this.activity.engagementLevel = 'medium';
  } else {
    this.activity.engagementLevel = 'low';
  }
  
  next();
});

// Static method to get team hierarchy
teamSchema.statics.getTeamHierarchy = async function(userId, maxLevel = 5) {
  const pipeline = [
    { $match: { sponsorId: userId } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: 'userId',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: 1,
        level: 1,
        rank: 1,
        teamStats: 1,
        'user.name': 1,
        'user.email': 1,
        'user.status': 1,
        'user.balance': 1,
        'user.currentPackage': 1,
      },
    },
    { $sort: { level: 1, 'teamStats.totalVolume': -1 } },
  ];
  
  const directTeam = await this.aggregate(pipeline);
  
  // Recursively get team members for each direct referral
  const hierarchy = [];
  
  for (const member of directTeam) {
    if (member.level < maxLevel) {
      const subTeam = await this.getTeamHierarchy(member.userId, maxLevel);
      member.subTeam = subTeam;
    }
    hierarchy.push(member);
  }
  
  return hierarchy;
};

// Static method to get team statistics
teamSchema.statics.getTeamStatistics = async function(userId) {
  const pipeline = [
    { $match: { sponsorId: userId } },
    {
      $group: {
        _id: null,
        totalMembers: { $sum: '$teamStats.totalMembers' },
        activeMembers: { $sum: '$teamStats.activeMembers' },
        totalVolume: { $sum: '$teamStats.totalVolume' },
        totalEarnings: { $sum: '$teamStats.totalEarnings' },
        avgVolume: { $avg: '$teamStats.totalVolume' },
      },
    },
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalMembers: 0,
    activeMembers: 0,
    totalVolume: 0,
    totalEarnings: 0,
    avgVolume: 0,
  };
};

// Static method to get top performers
teamSchema.statics.getTopPerformers = async function(limit = 10, criteria = 'volume') {
  const sortField = criteria === 'volume' ? 'teamStats.totalVolume' : 'teamStats.totalEarnings';
  
  const pipeline = [
    { $match: { 'qualifications.isActive': true } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: 'userId',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: 1,
        rank: 1,
        teamStats: 1,
        'user.name': 1,
        'user.email': 1,
      },
    },
    { $sort: { [sortField]: -1 } },
    { $limit: limit },
  ];
  
  return await this.aggregate(pipeline);
};

// Instance method to add referral
teamSchema.methods.addReferral = async function(referralUserId, investmentAmount = 0) {
  const existingReferral = this.directReferrals.find(ref => ref.userId === referralUserId);
  
  if (existingReferral) {
    existingReferral.totalInvestment += investmentAmount;
  } else {
    this.directReferrals.push({
      userId: referralUserId,
      totalInvestment: investmentAmount,
      joinDate: new Date(),
      status: 'active',
    });
  }
  
  // Update team statistics
  this.teamStats.totalVolume += investmentAmount;
  this.performance.thisMonth.teamVolume += investmentAmount;
  this.performance.allTime.teamVolume += investmentAmount;
  
  if (!existingReferral) {
    this.performance.thisMonth.newReferrals += 1;
    this.performance.allTime.totalReferrals += 1;
  }
  
  return await this.save();
};

// Instance method to update genealogy
teamSchema.methods.updateGenealogy = async function(leg, volume, members = 1) {
  if (leg === 'left') {
    this.genealogy.leftLeg.volume += volume;
    this.genealogy.leftLeg.members += members;
  } else if (leg === 'right') {
    this.genealogy.rightLeg.volume += volume;
    this.genealogy.rightLeg.members += members;
  }
  
  return await this.save();
};

// Instance method to calculate binary bonus
teamSchema.methods.calculateBinaryBonus = function() {
  const matchVolume = Math.min(this.genealogy.leftLeg.volume, this.genealogy.rightLeg.volume);
  const bonusPercentage = this.bonusSettings.binaryBonus.percentage;
  const maxAmount = this.bonusSettings.binaryBonus.maxAmount;
  
  let bonus = (matchVolume * bonusPercentage) / 100;
  
  if (maxAmount && bonus > maxAmount) {
    bonus = maxAmount;
  }
  
  return bonus;
};

// Instance method to check rank qualification
teamSchema.methods.checkRankQualification = async function() {
  const rankCriteria = {
    'Bronze': { volume: 0, members: 0 },
    'Silver': { volume: 10000, members: 5 },
    'Gold': { volume: 50000, members: 10 },
    'Platinum': { volume: 100000, members: 20 },
    'Diamond': { volume: 500000, members: 50 },
    'Crown': { volume: 1000000, members: 100 },
  };
  
  const currentVolume = this.teamStats.totalVolume;
  const currentMembers = this.teamStats.activeMembers;
  
  let qualifiedRank = 'Bronze';
  
  for (const [rank, criteria] of Object.entries(rankCriteria)) {
    if (currentVolume >= criteria.volume && currentMembers >= criteria.members) {
      qualifiedRank = rank;
    }
  }
  
  // Update rank if it's higher than current
  if (qualifiedRank !== this.rank.current) {
    this.rank.achieved.push({
      rank: qualifiedRank,
      achievedDate: new Date(),
      qualifyingVolume: currentVolume,
      qualifyingMembers: currentMembers,
    });
    
    this.rank.current = qualifiedRank;
    await this.save();
  }
  
  return qualifiedRank;
};

// Instance method to reset monthly statistics
teamSchema.methods.resetMonthlyStats = async function() {
  this.performance.lastMonth = { ...this.performance.thisMonth };
  this.performance.thisMonth = {
    personalVolume: 0,
    teamVolume: 0,
    newReferrals: 0,
    totalEarnings: 0,
  };
  
  return await this.save();
};

module.exports = mongoose.model('Team', teamSchema); 