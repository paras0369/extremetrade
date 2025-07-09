const crypto = require('crypto');
const { User } = require('../models');

// Generate unique referral code
const generateReferralCode = async (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let isUnique = false;
  let referralCode = '';

  while (!isUnique) {
    referralCode = '';
    
    // Generate random code
    for (let i = 0; i < length; i++) {
      referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists
    const existingUser = await User.findOne({ referralCode });
    if (!existingUser) {
      isUnique = true;
    }
  }

  return referralCode;
};

// Generate referral code based on name (alternative method)
const generateReferralCodeFromName = async (name, length = 8) => {
  // Clean and format name
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  
  let baseCode = '';
  if (cleanName.length >= 4) {
    baseCode = cleanName.substring(0, 4);
  } else {
    baseCode = cleanName.padEnd(4, 'X');
  }

  // Add random numbers
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
  let referralCode = baseCode + randomPart;

  // Ensure uniqueness
  let isUnique = false;
  let counter = 1;

  while (!isUnique) {
    const existingUser = await User.findOne({ referralCode });
    if (!existingUser) {
      isUnique = true;
    } else {
      // Modify the code if it exists
      referralCode = baseCode + (parseInt(randomPart) + counter).toString();
      counter++;
    }
  }

  return referralCode.substring(0, length);
};

// Generate referral link
const generateReferralLink = (referralCode, baseUrl = 'https://yourapp.com') => {
  return `${baseUrl}/register?ref=${referralCode}`;
};

module.exports = {
  generateReferralCode,
  generateReferralCodeFromName,
  generateReferralLink
};