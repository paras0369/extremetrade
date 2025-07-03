require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Database Configuration
  database: {
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/extremetrade',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@extremetrade.com',
  },

  // Trading Platform Configuration
  trading: {
    minDeposit: parseFloat(process.env.MIN_DEPOSIT) || 10,
    minWithdrawal: parseFloat(process.env.MIN_WITHDRAWAL) || 5,
    withdrawalFeePercentage: parseFloat(process.env.WITHDRAWAL_FEE_PERCENTAGE) || 5,
    referralBonusPercentage: parseFloat(process.env.REFERRAL_BONUS_PERCENTAGE) || 10,
    directSponsorBonusPercentage: parseFloat(process.env.DIRECT_SPONSOR_BONUS_PERCENTAGE) || 15,
    teamLevelBonusPercentage: parseFloat(process.env.TEAM_LEVEL_BONUS_PERCENTAGE) || 5,
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),
    uploadPath: './uploads/',
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    accountLockTime: parseInt(process.env.ACCOUNT_LOCK_TIME) || 300000, // 5 minutes
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // Package Configuration
  packages: [
    {
      name: 'Basic',
      price: 100,
      dailyReturn: 2,
      monthlyReturn: 12,
      duration: 365, // days
    },
    {
      name: 'Premium',
      price: 500,
      dailyReturn: 2.5,
      monthlyReturn: 15,
      duration: 365,
    },
    {
      name: 'Professional',
      price: 1000,
      dailyReturn: 3,
      monthlyReturn: 18,
      duration: 365,
    },
    {
      name: 'Elite',
      price: 5000,
      dailyReturn: 3.5,
      monthlyReturn: 21,
      duration: 365,
    },
  ],

  // Income Types
  incomeTypes: {
    SIGNUP_BONUS: 'signup_bonus',
    DIRECT_SPONSOR_BONUS: 'direct_sponsor_bonus',
    TRADING_PROFIT: 'trading_profit',
    TEAM_LEVEL_INCOME: 'team_level_income',
    COMMUNITY_REWARDS: 'community_rewards',
    ROYALTY_BONUS: 'royalty_bonus',
  },

  // Transaction Types
  transactionTypes: {
    DEPOSIT: 'deposit',
    WITHDRAWAL: 'withdrawal',
    BONUS: 'bonus',
    PENALTY: 'penalty',
  },

  // Transaction Status
  transactionStatus: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
  },

  // User Status
  userStatus: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING: 'pending',
  },

  // User Roles
  userRoles: {
    USER: 'user',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
  },
};

module.exports = config; 