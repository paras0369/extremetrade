const Joi = require('joi');

// Handle validation errors
const handleValidationErrors = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

// User registration validation
const validateRegistration = handleValidationErrors(
  Joi.object({
    name: Joi.string().trim().min(2).max(50).required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    }),
    
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
    
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required().messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'any.required': 'Phone number is required'
    }),
    
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
    
    sponsorReferralCode: Joi.string().min(6).max(12).optional().messages({
      'string.min': 'Referral code must be at least 6 characters',
      'string.max': 'Referral code cannot exceed 12 characters'
    })
  })
);

// User login validation
const validateLogin = handleValidationErrors(
  Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
    
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  })
);

// Profile update validation
const validateProfileUpdate = handleValidationErrors(
  Joi.object({
    name: Joi.string().trim().min(2).max(50).optional(),
    
    profileImage: Joi.string().uri().optional().messages({
      'string.uri': 'Profile image must be a valid URL'
    }),
    
    address: Joi.object({
      street: Joi.string().max(100).optional(),
      city: Joi.string().max(50).optional(),
      state: Joi.string().max(50).optional(),
      country: Joi.string().max(50).optional(),
      zipCode: Joi.string().max(10).optional()
    }).optional()
  })
);

// Bank account validation
const validateBankAccount = handleValidationErrors(
  Joi.object({
    bankName: Joi.string().trim().required().messages({
      'any.required': 'Bank name is required'
    }),
    
    accountNumber: Joi.string().trim().min(8).max(20).required().messages({
      'string.min': 'Account number must be at least 8 characters',
      'string.max': 'Account number cannot exceed 20 characters',
      'any.required': 'Account number is required'
    }),
    
    accountHolderName: Joi.string().trim().required().messages({
      'any.required': 'Account holder name is required'
    }),
    
    ifscCode: Joi.string().trim().length(11).optional().messages({
      'string.length': 'IFSC code must be exactly 11 characters'
    }),
    
    routingNumber: Joi.string().trim().length(9).optional().messages({
      'string.length': 'Routing number must be exactly 9 characters'
    })
  })
);

// USDT address validation
const validateUSDTAddress = handleValidationErrors(
  Joi.object({
    usdtAddress: Joi.string().trim().min(26).max(42).required().messages({
      'string.min': 'Invalid USDT address format',
      'string.max': 'Invalid USDT address format',
      'any.required': 'USDT address is required'
    })
  })
);

// Withdrawal request validation
const validateWithdrawal = handleValidationErrors(
  Joi.object({
    amount: Joi.number().positive().required().messages({
      'number.positive': 'Amount must be greater than 0',
      'any.required': 'Amount is required'
    }),
    
    method: Joi.string().valid('BANK_TRANSFER', 'USDT', 'CRYPTO').required().messages({
      'any.only': 'Invalid withdrawal method',
      'any.required': 'Withdrawal method is required'
    }),
    
    bankDetails: Joi.when('method', {
      is: 'BANK_TRANSFER',
      then: Joi.object({
        bankName: Joi.string().required(),
        accountNumber: Joi.string().required(),
        accountHolderName: Joi.string().required(),
        ifscCode: Joi.string().optional(),
        routingNumber: Joi.string().optional()
      }).required(),
      otherwise: Joi.optional()
    }),
    
    usdtAddress: Joi.when('method', {
      is: 'USDT',
      then: Joi.string().min(26).max(42).optional(),
      otherwise: Joi.optional()
    })
  })
);

// Investment validation
const validateInvestment = handleValidationErrors(
  Joi.object({
    amount: Joi.number().positive().required().messages({
      'number.positive': 'Investment amount must be greater than 0',
      'any.required': 'Investment amount is required'
    }),
    
    package: Joi.string().trim().optional()
  })
);

// Parameter validations - these will be middleware functions
const validateUserId = (req, res, next) => {
  const { userId } = req.params;
  
  if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID'
    });
  }
  
  next();
};

const validateWithdrawalId = (req, res, next) => {
  const { withdrawalId } = req.params;
  
  if (!withdrawalId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid withdrawal ID'
    });
  }
  
  next();
};

const validateLevel = (req, res, next) => {
  const level = parseInt(req.params.level);
  
  if (isNaN(level) || level < 1 || level > 4) {
    return res.status(400).json({
      success: false,
      message: 'Level must be between 1 and 4'
    });
  }
  
  next();
};

const validateReferralCode = (req, res, next) => {
  const { referralCode } = req.params;
  
  if (!referralCode || referralCode.length < 6 || referralCode.length > 12) {
    return res.status(400).json({
      success: false,
      message: 'Invalid referral code format'
    });
  }
  
  next();
};

// Query parameter validations
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page must be a positive integer'
    });
  }
  
  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
  }
  
  next();
};

const validateSearch = (req, res, next) => {
  const { search } = req.query;
  
  if (search && (search.length < 1 || search.length > 50)) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be between 1 and 50 characters'
    });
  }
  
  next();
};

// Admin validations
const validateApproval = handleValidationErrors(
  Joi.object({
    rejectionReason: Joi.when('action', {
      is: 'reject',
      then: Joi.string().required().messages({
        'any.required': 'Rejection reason is required when rejecting'
      }),
      otherwise: Joi.optional()
    }),
    action: Joi.string().optional()
  })
);

const validateWithdrawalCompletion = handleValidationErrors(
  Joi.object({
    transactionHash: Joi.string().trim().min(10).max(100).optional().messages({
      'string.min': 'Invalid transaction hash format',
      'string.max': 'Invalid transaction hash format'
    })
  })
);

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateBankAccount,
  validateUSDTAddress,
  validateWithdrawal,
  validateInvestment,
  validateUserId,
  validateWithdrawalId,
  validateLevel,
  validateReferralCode,
  validatePagination,
  validateSearch,
  validateApproval,
  validateWithdrawalCompletion
};