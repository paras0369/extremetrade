import api from './api';
import toast from 'react-hot-toast';

export const tradingService = {
  // Get all trading packages
  async getPackages() {
    try {
      const response = await api.get('/packages');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get packages error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch packages' 
      };
    }
  },

  // Purchase a trading package
  async purchasePackage(packageData) {
    try {
      const response = await api.post('/transactions/purchase', packageData);
      
      if (response.data.status === 'success') {
        toast.success('Package purchase initiated successfully!');
        return { success: true, data: response.data.data };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Purchase package error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to purchase package' 
      };
    }
  },

  // Get user's active packages
  async getActivePackages() {
    try {
      const response = await api.get('/trading/active-packages');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get active packages error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch active packages' 
      };
    }
  },

  // Get trading history
  async getTradingHistory(params = {}) {
    try {
      const response = await api.get('/trading/history', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get trading history error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch trading history' 
      };
    }
  },

  // Get trading statistics
  async getTradingStats() {
    try {
      const response = await api.get('/trading/stats');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get trading stats error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch trading stats' 
      };
    }
  }
};

export default tradingService; 