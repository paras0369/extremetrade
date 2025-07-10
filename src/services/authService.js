import api from './api';
import toast from 'react-hot-toast';

export const authService = {
  // Register new user
  async register(userData) {
    try {
      // Prepare payload to match backend expectations
      const payload = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        sponsorReferralCode: userData.referralCode // Backend expects sponsorReferralCode
      };

      const response = await api.post('/auth/register', payload);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Store token and user data
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        toast.success('Account created successfully!');
        return { success: true, data: response.data.data };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  },

  // Login user
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Store token and user data
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        toast.success(`Welcome back, ${user.name}!`);
        return { success: true, data: response.data.data };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  },

  // Logout user
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all stored data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      toast.success('Logged out successfully');
    }
  },

  // Get user profile
  async getProfile(showErrorToast = false) {
    try {
      console.log('authService.getProfile: Making API call...');
      const response = await api.get('/auth/profile');
      console.log('authService.getProfile: Response received:', response);
      console.log('authService.getProfile: Response data:', response.data);
      console.log('authService.getProfile: Response status:', response.data?.status);
      
      if (response.data.success) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        console.log('authService.getProfile: Profile retrieved successfully');
        return { success: true, data: response.data.data };
      }
      
      console.log('authService.getProfile: Response status not success, returning error');
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Get profile error:', error);
      
      // Only show error toast if requested (not for dashboard background loads)
      if (showErrorToast && error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'Failed to get profile');
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to get profile' 
      };
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      if (response.data.status === 'success') {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        toast.success('Profile updated successfully!');
        return { success: true, data: response.data.data };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Update profile error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update profile' 
      };
    }
  },

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      
      if (response.data.status === 'success') {
        toast.success('Password changed successfully!');
        return { success: true };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Change password error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to change password' 
      };
    }
  },

  // Request password reset
  async requestPasswordReset(email) {
    try {
      const response = await api.post('/auth/request-password-reset', { email });
      
      if (response.data.status === 'success') {
        toast.success('Password reset instructions sent to your email');
        return { success: true };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to request password reset' 
      };
    }
  },

  // Reset password
  async resetPassword(resetData) {
    try {
      const response = await api.post('/auth/reset-password', resetData);
      
      if (response.data.status === 'success') {
        toast.success('Password reset successfully!');
        return { success: true };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Password reset error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to reset password' 
      };
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get current user data from localStorage
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Get access token
  getAccessToken() {
    return localStorage.getItem('accessToken');
  },

  // Get refresh token
  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  },

  // Verify referral code
  async verifyReferralCode(referralCode) {
    try {
      const response = await api.get(`/auth/verify-referral/${referralCode}`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Verify referral code error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to verify referral code' 
      };
    }
  },
};

export default authService; 