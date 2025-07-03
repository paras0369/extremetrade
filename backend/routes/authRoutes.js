const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken, authenticateRefreshToken } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validatePasswordReset,
  validatePasswordResetConfirm,
  validateEmailVerification,
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateUserLogin, authController.login);
router.post('/refresh-token', authenticateRefreshToken, authController.refreshToken);
router.post('/request-password-reset', validatePasswordReset, authController.requestPasswordReset);
router.post('/reset-password', validatePasswordResetConfirm, authController.resetPassword);
router.post('/verify-email', validateEmailVerification, authController.verifyEmail);

// Protected routes (require authentication)
router.use(authenticateToken); // Apply authentication middleware to all routes below

router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.put('/profile', validateProfileUpdate, authController.updateProfile);
router.put('/change-password', validatePasswordChange, authController.changePassword);
router.post('/send-email-verification', authController.sendEmailVerification);

module.exports = router; 