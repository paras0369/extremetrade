const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_STATUS } = require('../config/constants');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  referralCode: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    trim: true
  },
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  sponsorReferralCode: {
    type: String,
    default: null,
    uppercase: true,
    trim: true
  },
  level: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: Object.values(USER_STATUS),
    default: USER_STATUS.ACTIVE
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  profileImage: {
    type: String,
    default: null
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    zipCode: { type: String, default: '' }
  },
  bankAccount: {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    accountHolderName: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    routingNumber: { type: String, default: '' }
  },
  usdtAddress: {
    type: String,
    default: '',
    trim: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  totalInvestment: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalWithdrawals: {
    type: Number,
    default: 0
  },
  directReferrals: {
    type: Number,
    default: 0
  },
  teamSize: {
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

// Virtual for user's direct referrals
userSchema.virtual('directTeam', {
  ref: 'User',
  localField: '_id',
  foreignField: 'sponsorId'
});

// Virtual for user's wallet
userSchema.virtual('wallet', {
  ref: 'Wallet',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

// Index for better query performance
userSchema.index({ referralCode: 1 });
userSchema.index({ sponsorId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ status: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.checkPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user's genealogy tree
userSchema.methods.getGenealogy = async function(level = 4) {
  const genealogy = [];
  
  const getDownlines = async (userId, currentLevel) => {
    if (currentLevel > level) return;
    
    const users = await this.constructor.find({ sponsorId: userId })
      .select('name email referralCode totalInvestment joinedAt status')
      .lean();
    
    for (const user of users) {
      genealogy.push({
        ...user,
        level: currentLevel
      });
      
      if (currentLevel < level) {
        await getDownlines(user._id, currentLevel + 1);
      }
    }
  };
  
  await getDownlines(this._id, 1);
  return genealogy;
};

// Method to calculate team business
userSchema.methods.calculateTeamBusiness = async function() {
  const genealogy = await this.getGenealogy();
  return genealogy.reduce((total, member) => total + member.totalInvestment, 0);
};

// Static method to find user by referral code
userSchema.statics.findByReferralCode = function(referralCode) {
  return this.findOne({ referralCode: referralCode.toUpperCase() });
};

module.exports = mongoose.model('User', userSchema);