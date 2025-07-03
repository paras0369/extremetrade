import api from './api';
import toast from 'react-hot-toast';

export const teamService = {
  // Get team statistics
  async getTeamStats() {
    try {
      const response = await api.get('/team/stats');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get team stats error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch team stats' 
      };
    }
  },

  // Get team members
  async getTeamMembers(params = {}) {
    try {
      const response = await api.get('/team/members', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get team members error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch team members' 
      };
    }
  },

  // Get team genealogy
  async getTeamGenealogy(params = {}) {
    try {
      const response = await api.get('/team/genealogy', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get team genealogy error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch team genealogy' 
      };
    }
  },

  // Get referral statistics
  async getReferralStats() {
    try {
      const response = await api.get('/team/referral-stats');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get referral stats error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch referral stats' 
      };
    }
  },

  // Generate referral link
  generateReferralLink(referralCode) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?ref=${referralCode}`;
  },

  // Copy referral link to clipboard
  async copyReferralLink(referralCode) {
    try {
      const referralLink = this.generateReferralLink(referralCode);
      await navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard!');
      return { success: true };
    } catch (error) {
      console.error('Copy referral link error:', error);
      toast.error('Failed to copy referral link');
      return { success: false, error: 'Failed to copy referral link' };
    }
  },

  // Share referral link using Web Share API
  async shareReferralLink(referralCode, userName = 'ExtremeTrader') {
    try {
      const referralLink = this.generateReferralLink(referralCode);
      const shareText = `Join ExtremeTrader and start earning! Use my referral code: ${referralCode}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Join ExtremeTrader',
          text: shareText,
          url: referralLink
        });
        return { success: true };
      } else {
        // Fallback to copy
        return await this.copyReferralLink(referralCode);
      }
    } catch (error) {
      console.error('Share referral link error:', error);
      // Fallback to copy if sharing is cancelled
      return await this.copyReferralLink(referralCode);
    }
  },

  // Get team performance
  async getTeamPerformance(params = {}) {
    try {
      const response = await api.get('/team/performance', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get team performance error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch team performance' 
      };
    }
  },

  // Get team bonuses
  async getTeamBonuses(params = {}) {
    try {
      const response = await api.get('/team/bonuses', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get team bonuses error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch team bonuses' 
      };
    }
  }
};

export default teamService; 