const { User, Team, Wallet } = require('../models');
const logger = require('../utils/logger');

// Get user's direct team (Level 1 referrals)
const getDirectTeam = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get direct team members
    const directTeam = await Team.find({ userId, level: 1 })
      .populate('memberDetails', 'name email phone referralCode totalInvestment totalEarnings status joinedAt')
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await Team.countDocuments({ userId, level: 1 });

    res.json({
      success: true,
      data: {
        directTeam: directTeam.map(member => ({
          id: member.memberId,
          name: member.memberDetails.name,
          email: member.memberDetails.email,
          phone: member.memberDetails.phone,
          referralCode: member.memberDetails.referralCode,
          totalInvestment: member.memberDetails.totalInvestment,
          totalEarnings: member.memberDetails.totalEarnings,
          status: member.memberDetails.status,
          joinedAt: member.memberDetails.joinedAt,
          level: member.level,
          totalBusiness: member.totalBusiness,
          isActive: member.isActive
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get direct team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch direct team',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get team by specific level
const getTeamByLevel = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { level } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate level
    if (level < 1 || level > 4) {
      return res.status(400).json({
        success: false,
        message: 'Invalid level. Level must be between 1 and 4'
      });
    }

    // Get team members by level
    const teamMembers = await Team.find({ userId, level: parseInt(level) })
      .populate('memberDetails', 'name email phone referralCode totalInvestment totalEarnings status joinedAt')
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await Team.countDocuments({ userId, level: parseInt(level) });

    res.json({
      success: true,
      data: {
        level: parseInt(level),
        teamMembers: teamMembers.map(member => ({
          id: member.memberId,
          name: member.memberDetails.name,
          email: member.memberDetails.email,
          phone: member.memberDetails.phone,
          referralCode: member.memberDetails.referralCode,
          totalInvestment: member.memberDetails.totalInvestment,
          totalEarnings: member.memberDetails.totalEarnings,
          status: member.memberDetails.status,
          joinedAt: member.memberDetails.joinedAt,
          level: member.level,
          totalBusiness: member.totalBusiness,
          isActive: member.isActive
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get team by level error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team by level',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get complete team (all levels)
const getCompleteTeam = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get all team members
    const allTeamMembers = await Team.find({ userId })
      .populate('memberDetails', 'name email phone referralCode totalInvestment totalEarnings status joinedAt')
      .sort({ level: 1, joinedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await Team.countDocuments({ userId });

    // Group by level
    const teamByLevel = {
      level1: [],
      level2: [],
      level3: [],
      level4: []
    };

    allTeamMembers.forEach(member => {
      const memberData = {
        id: member.memberId,
        name: member.memberDetails.name,
        email: member.memberDetails.email,
        phone: member.memberDetails.phone,
        referralCode: member.memberDetails.referralCode,
        totalInvestment: member.memberDetails.totalInvestment,
        totalEarnings: member.memberDetails.totalEarnings,
        status: member.memberDetails.status,
        joinedAt: member.memberDetails.joinedAt,
        level: member.level,
        totalBusiness: member.totalBusiness,
        isActive: member.isActive
      };

      teamByLevel[`level${member.level}`].push(memberData);
    });

    res.json({
      success: true,
      data: {
        teamByLevel,
        allMembers: allTeamMembers.map(member => ({
          id: member.memberId,
          name: member.memberDetails.name,
          email: member.memberDetails.email,
          phone: member.memberDetails.phone,
          referralCode: member.memberDetails.referralCode,
          totalInvestment: member.memberDetails.totalInvestment,
          totalEarnings: member.memberDetails.totalEarnings,
          status: member.memberDetails.status,
          joinedAt: member.memberDetails.joinedAt,
          level: member.level,
          totalBusiness: member.totalBusiness,
          isActive: member.isActive
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get complete team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complete team',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get team statistics
const getTeamStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get team statistics using aggregation
    const teamStats = await Team.getTeamStats(userId);

    // Get user's own data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate team business
    const teamBusiness = await user.calculateTeamBusiness();

    // Format team statistics
    const formattedStats = {
      level1: { count: 0, totalBusiness: 0, activeCount: 0 },
      level2: { count: 0, totalBusiness: 0, activeCount: 0 },
      level3: { count: 0, totalBusiness: 0, activeCount: 0 },
      level4: { count: 0, totalBusiness: 0, activeCount: 0 }
    };

    teamStats.forEach(stat => {
      formattedStats[`level${stat._id}`] = {
        count: stat.count,
        totalBusiness: stat.totalBusiness,
        activeCount: stat.activeMemberCount
      };
    });

    // Calculate totals
    const totalTeamSize = teamStats.reduce((sum, stat) => sum + stat.count, 0);
    const totalTeamBusiness = teamStats.reduce((sum, stat) => sum + stat.totalBusiness, 0);
    const totalActiveMembers = teamStats.reduce((sum, stat) => sum + stat.activeMemberCount, 0);

    res.json({
      success: true,
      data: {
        teamStats: formattedStats,
        summary: {
          totalTeamSize,
          totalTeamBusiness,
          totalActiveMembers,
          directReferrals: user.directReferrals,
          calculatedTeamBusiness: teamBusiness
        }
      }
    });

  } catch (error) {
    logger.error('Get team stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get team genealogy (tree structure)
const getTeamGenealogy = async (req, res) => {
  try {
    const userId = req.user.userId;
    const levels = parseInt(req.query.levels) || 4;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get genealogy tree
    const genealogy = await user.getGenealogy(levels);

    // Build tree structure
    const buildTree = (members, parentId = null, currentLevel = 1) => {
      return members
        .filter(member => {
          if (currentLevel === 1) {
            return member.level === 1;
          }
          return member.level === currentLevel;
        })
        .map(member => ({
          id: member._id,
          name: member.name,
          email: member.email,
          referralCode: member.referralCode,
          totalInvestment: member.totalInvestment,
          joinedAt: member.joinedAt,
          status: member.status,
          level: member.level,
          children: currentLevel < levels ? buildTree(members, member._id, currentLevel + 1) : []
        }));
    };

    const treeStructure = buildTree(genealogy);

    res.json({
      success: true,
      data: {
        genealogy: treeStructure,
        flatGenealogy: genealogy,
        totalMembers: genealogy.length,
        levels: levels
      }
    });

  } catch (error) {
    logger.error('Get team genealogy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team genealogy',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getDirectTeam,
  getTeamByLevel,
  getCompleteTeam,
  getTeamStats,
  getTeamGenealogy
};