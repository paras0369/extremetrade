import api from './api';

class MLMApiService {
  // Authentication APIs
  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async verifyReferralCode(code) {
    try {
      const response = await api.get(`/auth/verify-referral/${code}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  // Dashboard APIs
  async getDashboardOverview() {
    try {
      const response = await api.get('/dashboard');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async getEarningsChart() {
    try {
      const response = await api.get('/dashboard/earnings-chart');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async getTeamGrowthChart() {
    try {
      const response = await api.get('/dashboard/team-growth');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async getIncomeAnalytics() {
    try {
      const response = await api.get('/dashboard/income-analytics');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  // Wallet APIs
  async getWalletInfo() {
    try {
      const response = await api.get('/wallet');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async getWalletTransactions(page = 1, limit = 10) {
    try {
      const response = await api.get(`/wallet/transactions?page=${page}&limit=${limit}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async getIncomeSummary() {
    try {
      const response = await api.get('/wallet/income-summary');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async getCommissions() {
    try {
      const response = await api.get('/wallet/commissions');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  // Team APIs
  async getDirectTeam() {
    try {
      const response = await api.get('/team/direct');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async getTeamByLevel(level) {
    try {
      const response = await api.get(`/team/level/${level}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async getCompleteTeam() {
    try {
      const response = await api.get('/team/complete');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async getTeamStats() {
    try {
      const response = await api.get('/team/stats');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async getGenealogy() {
    try {
      const response = await api.get('/team/genealogy');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  // Withdrawal APIs
  async createWithdrawal(data) {
    try {
      const response = await api.post('/withdrawal', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async getWithdrawalHistory() {
    try {
      const response = await api.get('/withdrawal');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async getWithdrawalStats() {
    try {
      const response = await api.get('/withdrawal/stats');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async cancelWithdrawal(withdrawalId) {
    try {
      const response = await api.put(`/withdrawal/${withdrawalId}/cancel`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  // Investment APIs
  async createInvestment(data) {
    try {
      const response = await api.post('/investment', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async getInvestments() {
    try {
      const response = await api.get('/investment');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async getInvestmentStats() {
    try {
      const response = await api.get('/investment/stats');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  // User APIs
  async updateProfile(data) {
    try {
      const response = await api.put('/user/profile', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async updateBankAccount(data) {
    try {
      const response = await api.put('/user/bank-account', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async updateUsdtAddress(data) {
    try {
      const response = await api.put('/user/usdt-address', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async getUserStats() {
    try {
      const response = await api.get('/user/stats');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  // Utility method to handle multiple API calls
  async loadDashboardData() {
    try {
      const [
        overview,
        wallet,
        team,
        income,
        withdrawals,
        investments
      ] = await Promise.allSettled([
        this.getDashboardOverview(),
        this.getWalletInfo(),
        this.getDirectTeam(),
        this.getIncomeSummary(),
        this.getWithdrawalHistory(),
        this.getInvestments()
      ]);

      return {
        overview: overview.status === 'fulfilled' ? overview.value : { success: false, error: 'Failed to load overview' },
        wallet: wallet.status === 'fulfilled' ? wallet.value : { success: false, error: 'Failed to load wallet' },
        team: team.status === 'fulfilled' ? team.value : { success: false, error: 'Failed to load team' },
        income: income.status === 'fulfilled' ? income.value : { success: false, error: 'Failed to load income' },
        withdrawals: withdrawals.status === 'fulfilled' ? withdrawals.value : { success: false, error: 'Failed to load withdrawals' },
        investments: investments.status === 'fulfilled' ? investments.value : { success: false, error: 'Failed to load investments' }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new MLMApiService();