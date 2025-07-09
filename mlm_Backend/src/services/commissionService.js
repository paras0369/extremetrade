const mongoose = require('mongoose');
const { User, Wallet, Transaction, Team } = require('../models');
const { COMMISSION_RATES, TRANSACTION_TYPES, LEVELS } = require('../config/constants');
const logger = require('../utils/logger');

// Build team structure when a new user joins
const buildTeamStructure = async (newUserId, sponsorId) => {
  try {
    let currentSponsor = sponsorId;
    let level = 1;

    // Build team structure up to 4 levels
    while (currentSponsor && level <= 4) {
      // Create team entry
      const teamEntry = new Team({
        userId: currentSponsor,
        memberId: newUserId,
        level: level
      });

      await teamEntry.save();

      // Update team size for the sponsor
      await User.findByIdAndUpdate(currentSponsor, {
        $inc: { teamSize: 1 }
      });

      // Get next level sponsor
      const sponsor = await User.findById(currentSponsor);
      currentSponsor = sponsor ? sponsor.sponsorId : null;
      level++;
    }

    return true;
  } catch (error) {
    logger.error('Build team structure error:', error);
    throw error;
  }
};

// Calculate and distribute commissions for investment
const distributeCommissions = async (investorId, investmentAmount) => {
  try {
    const investor = await User.findById(investorId);
    if (!investor) {
      throw new Error('Investor not found');
    }

    let currentUserId = investor.sponsorId;
    let level = 1;

    // Distribute commissions up to 4 levels
    while (currentUserId && level <= 4) {
      const currentUser = await User.findById(currentUserId);
      if (!currentUser || currentUser.status !== 'ACTIVE') {
        // Move to next level
        currentUserId = currentUser ? currentUser.sponsorId : null;
        level++;
        continue;
      }

      // Calculate commission based on level
      let commissionRate = 0;
      let transactionType = TRANSACTION_TYPES.LEVEL_COMMISSION;

      switch (level) {
        case LEVELS.LEVEL1:
          commissionRate = COMMISSION_RATES.LEVEL1;
          transactionType = TRANSACTION_TYPES.DIRECT_REFERRAL;
          break;
        case LEVELS.LEVEL2:
          commissionRate = COMMISSION_RATES.LEVEL2;
          break;
        case LEVELS.LEVEL3:
          commissionRate = COMMISSION_RATES.LEVEL3;
          break;
        case LEVELS.LEVEL4:
          commissionRate = COMMISSION_RATES.LEVEL4;
          break;
      }

      if (commissionRate > 0) {
        const commissionAmount = (investmentAmount * commissionRate) / 100;

        // Add commission to user's wallet
        const wallet = await Wallet.findByUserId(currentUserId);
        if (wallet) {
          const incomeType = level === 1 ? 'DIRECT_REFERRAL' : `LEVEL${level}_COMMISSION`;
          await wallet.addIncome(incomeType, commissionAmount);

          // Create transaction record
          const transaction = new Transaction({
            userId: currentUserId,
            fromUserId: investorId,
            type: transactionType,
            amount: commissionAmount,
            level: level,
            commissionPercentage: commissionRate,
            description: `Level ${level} commission from ${investor.name}'s investment of $${investmentAmount}`
          });

          await transaction.save();

          // Update user's total earnings
          await User.findByIdAndUpdate(currentUserId, {
            $inc: { totalEarnings: commissionAmount }
          });

          logger.info(`Commission distributed: $${commissionAmount} to user ${currentUserId} for level ${level}`);
        }
      }

      // Move to next level
      currentUserId = currentUser.sponsorId;
      level++;
    }

    return true;
  } catch (error) {
    logger.error('Distribute commissions error:', error);
    throw error;
  }
};

// Check and award reward income
const checkAndAwardRewardIncome = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate total team business
    const teamBusiness = await user.calculateTeamBusiness();

    // Check if user has reached reward threshold
    if (teamBusiness >= COMMISSION_RATES.REWARD_THRESHOLD) {
      // Check if reward has already been given
      const existingReward = await Transaction.findOne({
        userId,
        type: TRANSACTION_TYPES.REWARD_INCOME
      });

      if (!existingReward) {
        // Award reward income
        const wallet = await Wallet.findByUserId(userId);
        if (wallet) {
          await wallet.addIncome('REWARD_INCOME', COMMISSION_RATES.REWARD_AMOUNT);

          // Create transaction record
          const transaction = new Transaction({
            userId,
            type: TRANSACTION_TYPES.REWARD_INCOME,
            amount: COMMISSION_RATES.REWARD_AMOUNT,
            description: `Reward income for achieving $${COMMISSION_RATES.REWARD_THRESHOLD} team business`
          });

          await transaction.save();

          // Update user's total earnings
          await User.findByIdAndUpdate(userId, {
            $inc: { totalEarnings: COMMISSION_RATES.REWARD_AMOUNT }
          });

          logger.info(`Reward income awarded: $${COMMISSION_RATES.REWARD_AMOUNT} to user ${userId}`);
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    logger.error('Check and award reward income error:', error);
    throw error;
  }
};

// Update team business for all upline members
const updateTeamBusiness = async (userId, businessAmount) => {
  try {
    let currentUserId = userId;

    // Get user's sponsor chain
    while (currentUserId) {
      const user = await User.findById(currentUserId);
      if (!user || !user.sponsorId) break;

      // Update sponsor's team business
      await User.findByIdAndUpdate(user.sponsorId, {
        $inc: { teamBusiness: businessAmount }
      });

      // Update team business in Team model
      await Team.updateOne(
        { userId: user.sponsorId, memberId: userId },
        { $inc: { totalBusiness: businessAmount } }
      );

      // Check for reward income eligibility
      await checkAndAwardRewardIncome(user.sponsorId);

      currentUserId = user.sponsorId;
    }

    return true;
  } catch (error) {
    logger.error('Update team business error:', error);
    throw error;
  }
};

// Calculate potential earnings for a user
const calculatePotentialEarnings = async (userId, investmentAmount) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user's genealogy to calculate potential from team
    const genealogy = await user.getGenealogy(4);

    let potentialEarnings = {
      directReferralPotential: 0,
      level2Potential: 0,
      level3Potential: 0,
      level4Potential: 0,
      totalPotential: 0
    };

    // Calculate potential from each level
    genealogy.forEach(member => {
      const memberInvestment = member.totalInvestment || 0;
      
      switch (member.level) {
        case 1:
          potentialEarnings.directReferralPotential += (memberInvestment * COMMISSION_RATES.LEVEL1) / 100;
          break;
        case 2:
          potentialEarnings.level2Potential += (memberInvestment * COMMISSION_RATES.LEVEL2) / 100;
          break;
        case 3:
          potentialEarnings.level3Potential += (memberInvestment * COMMISSION_RATES.LEVEL3) / 100;
          break;
        case 4:
          potentialEarnings.level4Potential += (memberInvestment * COMMISSION_RATES.LEVEL4) / 100;
          break;
      }
    });

    // Calculate total potential
    potentialEarnings.totalPotential = 
      potentialEarnings.directReferralPotential +
      potentialEarnings.level2Potential +
      potentialEarnings.level3Potential +
      potentialEarnings.level4Potential;

    // If user makes an investment, calculate commission they would generate for upline
    if (investmentAmount) {
      potentialEarnings.commissionsGenerated = {
        level1: (investmentAmount * COMMISSION_RATES.LEVEL1) / 100,
        level2: (investmentAmount * COMMISSION_RATES.LEVEL2) / 100,
        level3: (investmentAmount * COMMISSION_RATES.LEVEL3) / 100,
        level4: (investmentAmount * COMMISSION_RATES.LEVEL4) / 100
      };
    }

    return potentialEarnings;
  } catch (error) {
    logger.error('Calculate potential earnings error:', error);
    throw error;
  }
};

// Get commission summary for a user
const getCommissionSummary = async (userId, startDate = null, endDate = null) => {
  try {
    const query = {
      userId: new mongoose.Types.ObjectId(userId),
      type: { $in: [TRANSACTION_TYPES.DIRECT_REFERRAL, TRANSACTION_TYPES.LEVEL_COMMISSION, TRANSACTION_TYPES.REWARD_INCOME] }
    };

    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const summary = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            type: '$type',
            level: '$level'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format the summary
    const formattedSummary = {
      directReferral: { amount: 0, count: 0 },
      levelCommissions: {
        level2: { amount: 0, count: 0 },
        level3: { amount: 0, count: 0 },
        level4: { amount: 0, count: 0 }
      },
      rewardIncome: { amount: 0, count: 0 },
      total: { amount: 0, count: 0 }
    };

    summary.forEach(item => {
      const { type, level } = item._id;
      const { totalAmount, count } = item;

      if (type === TRANSACTION_TYPES.DIRECT_REFERRAL) {
        formattedSummary.directReferral = { amount: totalAmount, count };
      } else if (type === TRANSACTION_TYPES.LEVEL_COMMISSION) {
        formattedSummary.levelCommissions[`level${level}`] = { amount: totalAmount, count };
      } else if (type === TRANSACTION_TYPES.REWARD_INCOME) {
        formattedSummary.rewardIncome = { amount: totalAmount, count };
      }

      formattedSummary.total.amount += totalAmount;
      formattedSummary.total.count += count;
    });

    return formattedSummary;
  } catch (error) {
    logger.error('Get commission summary error:', error);
    throw error;
  }
};

module.exports = {
  buildTeamStructure,
  distributeCommissions,
  checkAndAwardRewardIncome,
  updateTeamBusiness,
  calculatePotentialEarnings,
  getCommissionSummary
};