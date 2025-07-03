const { body, query, param, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value,
      })),
    });
  }
  
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),
  
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('sponsorCode')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('Sponsor code must be 6 characters')
    .isNumeric()
    .withMessage('Sponsor code must be numeric'),
  
  handleValidationErrors,
];

// User login validation
const validateUserLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors,
];

// Profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('profile.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  
  body('profile.gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  
  body('profile.address.street')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Street address must not exceed 100 characters'),
  
  body('profile.address.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City must not exceed 50 characters'),
  
  body('profile.address.state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State must not exceed 50 characters'),
  
  body('profile.address.country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Country must not exceed 50 characters'),
  
  body('profile.address.zipCode')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('ZIP code must not exceed 10 characters'),
  
  handleValidationErrors,
];

// Wallet update validation
const validateWalletUpdate = [
  body('wallets.bep20')
    .optional()
    .trim()
    .isLength({ min: 42, max: 42 })
    .withMessage('BEP20 wallet address must be 42 characters')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid BEP20 wallet address format'),
  
  body('wallets.erc20')
    .optional()
    .trim()
    .isLength({ min: 42, max: 42 })
    .withMessage('ERC20 wallet address must be 42 characters')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid ERC20 wallet address format'),
  
  body('wallets.trc20')
    .optional()
    .trim()
    .isLength({ min: 34, max: 34 })
    .withMessage('TRC20 wallet address must be 34 characters')
    .matches(/^T[1-9A-HJ-NP-Za-km-z]{33}$/)
    .withMessage('Invalid TRC20 wallet address format'),
  
  handleValidationErrors,
];

// Transaction validation
const validateTransaction = [
  body('type')
    .isIn(['deposit', 'withdrawal'])
    .withMessage('Transaction type must be deposit or withdrawal'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number with minimum 0.01'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('paymentDetails.method')
    .isIn(['bep20', 'erc20', 'trc20', 'bank_transfer'])
    .withMessage('Payment method must be bep20, erc20, trc20, or bank_transfer'),
  
  body('paymentDetails.walletAddress')
    .if(body('paymentDetails.method').isIn(['bep20', 'erc20', 'trc20']))
    .notEmpty()
    .withMessage('Wallet address is required for crypto payments'),
  
  body('paymentDetails.transactionHash')
    .if(body('paymentDetails.method').isIn(['bep20', 'erc20', 'trc20']))
    .optional()
    .isLength({ min: 64, max: 66 })
    .withMessage('Transaction hash must be 64-66 characters'),
  
  handleValidationErrors,
];

// Package purchase validation
const validatePackagePurchase = [
  body('packageId')
    .isMongoId()
    .withMessage('Invalid package ID'),
  
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number'),
  
  body('paymentMethod')
    .isIn(['balance', 'bep20', 'erc20', 'trc20'])
    .withMessage('Payment method must be balance, bep20, erc20, or trc20'),
  
  body('paymentDetails.walletAddress')
    .if(body('paymentMethod').isIn(['bep20', 'erc20', 'trc20']))
    .notEmpty()
    .withMessage('Wallet address is required for crypto payments'),
  
  handleValidationErrors,
];

// Income validation
const validateIncome = [
  body('type')
    .isIn(['signup_bonus', 'direct_sponsor_bonus', 'trading_profit', 'team_level_income', 'community_rewards', 'royalty_bonus'])
    .withMessage('Invalid income type'),
  
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  
  body('description')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Description must be between 5 and 500 characters'),
  
  body('sourceUserId')
    .optional()
    .isNumeric()
    .withMessage('Source user ID must be numeric'),
  
  body('level')
    .if(body('type').equals('team_level_income'))
    .isInt({ min: 1, max: 10 })
    .withMessage('Level must be between 1 and 10'),
  
  handleValidationErrors,
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('New password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  handleValidationErrors,
];

// Password reset validation
const validatePasswordReset = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  handleValidationErrors,
];

// Password reset confirm validation
const validatePasswordResetConfirm = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('New password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  handleValidationErrors,
];

// Email verification validation
const validateEmailVerification = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required'),
  
  handleValidationErrors,
];

// Query parameter validation
const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'amount', 'status', 'type'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  handleValidationErrors,
];

// Date range validation
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.query.startDate && value < req.query.startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  handleValidationErrors,
];

// MongoDB ObjectID validation
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  
  handleValidationErrors,
];

// User ID validation
const validateUserId = (paramName = 'userId') => [
  param(paramName)
    .isNumeric()
    .withMessage(`Invalid ${paramName}`)
    .isLength({ min: 8, max: 8 })
    .withMessage(`${paramName} must be 8 digits`),
  
  handleValidationErrors,
];

// Amount validation
const validateAmount = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number with minimum 0.01'),
  
  handleValidationErrors,
];

// Admin transaction approval validation
const validateTransactionApproval = [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be approved or rejected'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  
  body('rejectionReason')
    .if(body('status').equals('rejected'))
    .notEmpty()
    .withMessage('Rejection reason is required when rejecting'),
  
  handleValidationErrors,
];

// File upload validation
const validateFileUpload = [
  body('fileType')
    .isIn(['passport', 'driving_license', 'national_id', 'utility_bill'])
    .withMessage('Invalid file type'),
  
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  validateWalletUpdate,
  validateTransaction,
  validatePackagePurchase,
  validateIncome,
  validatePasswordChange,
  validatePasswordReset,
  validatePasswordResetConfirm,
  validateEmailVerification,
  validatePaginationQuery,
  validateDateRange,
  validateObjectId,
  validateUserId,
  validateAmount,
  validateTransactionApproval,
  validateFileUpload,
}; 