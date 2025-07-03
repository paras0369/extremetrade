import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Wallet, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Eye, 
  EyeOff,
  LogOut,
  Settings,
  Bell,
  Copy,
  Share2,
  Award,
  PieChart,
  BarChart3,
  Plus,
  Minus,
  RefreshCw,
  Gift,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import authService from '../services/authService';
import Loading from './Loading';
import './Dashboard.css';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState('overview');
  const [showBalances, setShowBalances] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalBalance: 0,
      tradingBalance: 0,
      totalIncome: 0,
      totalReferrals: 0,
      directReferrals: 0,
      teamSize: 0,
      totalWithdrawn: 0,
      pendingWithdrawals: 0,
      todayIncome: 0,
      weeklyIncome: 0,
      monthlyIncome: 0,
      rankProgress: 0,
      currentRank: 'Bronze',
      nextRank: 'Silver'
    },
    recentTransactions: [],
    recentIncomes: [],
    teamMembers: [],
    notifications: [],
    tradingPackages: [],
    analytics: {
      incomeChart: [],
      teamGrowth: [],
      tradingPerformance: []
    }
  });

  // Check authentication and load data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          console.log('Dashboard: User not authenticated, redirecting to login...');
          navigate('/login');
          return;
        }
        
        console.log('Dashboard: Starting to load data...');
        setIsLoading(true);
        
        // Get fresh user profile
        const profileResult = await authService.getProfile();
        let currentUser = user;
        
        if (profileResult.success) {
          currentUser = profileResult.data.user;
          setUser(currentUser);
          console.log('Dashboard: Profile loaded successfully', currentUser);
        } else {
          console.error('Dashboard: Failed to get profile:', profileResult.error);
          // Use cached user data
          currentUser = user || {
            name: 'User',
            userId: 'N/A',
            email: 'user@example.com',
            referralCode: 'N/A',
            balance: { available: 0, locked: 0 },
            createdAt: new Date().toISOString(),
            status: 'active'
          };
        }

        // Mock dashboard data
        const mockData = {
          stats: {
            totalBalance: currentUser?.balances?.totalBalance || 0,
            tradingBalance: currentUser?.balances?.tradingBalance || 0,
            totalIncome: currentUser?.income?.totalIncome || 0,
            totalReferrals: currentUser?.team?.directReferrals || 0,
            directReferrals: currentUser?.team?.directReferrals || 0,
            teamSize: currentUser?.team?.totalTeamSize || 0,
            totalWithdrawn: currentUser?.balances?.totalWithdrawn || 0,
            pendingWithdrawals: currentUser?.balances?.pendingWithdrawals || 0,
            todayIncome: currentUser?.income?.todayIncome || 0,
            weeklyIncome: currentUser?.income?.weeklyIncome || 0,
            monthlyIncome: currentUser?.income?.monthlyIncome || 0,
            rankProgress: currentUser?.rank?.progress || 0,
            currentRank: currentUser?.rank?.currentRank || 'Bronze',
            nextRank: currentUser?.rank?.nextRank || 'Silver'
          },
          recentTransactions: [
            {
              id: 1,
              type: 'deposit',
              amount: 1000,
              status: 'completed',
              date: '2024-01-15',
              description: 'Package Purchase - Premium Pro'
            },
            {
              id: 2,
              type: 'withdrawal',
              amount: 250,
              status: 'pending',
              date: '2024-01-14',
              description: 'Profit Withdrawal'
            },
            {
              id: 3,
              type: 'bonus',
              amount: 50,
              status: 'completed',
              date: '2024-01-13',
              description: 'Referral Bonus'
            }
          ],
          recentIncomes: [
            {
              id: 1,
              type: 'Trading Profit',
              amount: 125.50,
              date: '2024-01-15',
              status: 'completed',
              source: 'Premium Pro Package'
            },
            {
              id: 2,
              type: 'Referral Bonus',
              amount: 50.00,
              date: '2024-01-14',
              status: 'completed',
              source: 'Direct Referral'
            },
            {
              id: 3,
              type: 'Team Bonus',
              amount: 25.00,
              date: '2024-01-13',
              status: 'completed',
              source: 'Level 2 Team'
            }
          ],
          teamMembers: [
            {
              id: 1,
              name: 'John Smith',
              level: 1,
              joinDate: '2024-01-10',
              status: 'active',
              totalInvestment: 1500,
              teamSize: 5
            },
            {
              id: 2,
              name: 'Sarah Johnson',
              level: 1,
              joinDate: '2024-01-08',
              status: 'active',
              totalInvestment: 2000,
              teamSize: 8
            }
          ],
          notifications: [
            {
              id: 1,
              type: 'success',
              title: 'Withdrawal Processed',
              message: 'Your withdrawal of $250 has been processed successfully',
              date: '2024-01-15',
              read: false
            },
            {
              id: 2,
              type: 'info',
              title: 'New Team Member',
              message: 'A new member has joined your team',
              date: '2024-01-14',
              read: false
            }
          ],
          tradingPackages: [
            {
              id: 1,
              name: 'Starter',
              price: 100,
              dailyReturn: 1.5,
              duration: 30,
              features: ['Basic Trading', 'Email Support', 'Monthly Reports']
            },
            {
              id: 2,
              name: 'Professional',
              price: 500,
              dailyReturn: 2.0,
              duration: 60,
              features: ['Advanced Trading', 'Priority Support', 'Weekly Reports', 'Risk Management']
            },
            {
              id: 3,
              name: 'Premium Pro',
              price: 1000,
              dailyReturn: 2.5,
              duration: 90,
              features: ['Expert Trading', '24/7 Support', 'Daily Reports', 'Advanced Analytics', 'Personal Manager']
            }
          ]
        };

        setDashboardData(mockData);
        console.log('Dashboard: Data loaded successfully');
      } catch (error) {
        console.error('Dashboard: Error loading data:', error);
      } finally {
        setIsLoading(false);
        console.log('Dashboard: Loading complete');
      }
    };

    // Add timeout to prevent endless loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.error('Dashboard: Loading timeout reached, forcing completion');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    loadData();

    return () => {
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/signup?ref=${user?.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  const shareReferralLink = () => {
    const referralLink = `${window.location.origin}/signup?ref=${user?.referralCode}`;
    const shareText = `Join ExtremeTrader and start earning! Use my referral code: ${user?.referralCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join ExtremeTrader',
        text: shareText,
        url: referralLink
      });
    } else {
      // Fallback to copy
      copyReferralLink();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'failed': return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const handleDeposit = () => {
    setShowDepositModal(true);
  };

  const handleWithdraw = () => {
    setShowWithdrawModal(true);
  };

  const handleReferFriend = () => {
    setShowReferralModal(true);
  };

  const handleAnalytics = () => {
    setShowAnalyticsModal(true);
  };

  const handleDepositSubmit = async (depositData) => {
    try {
      console.log('Processing deposit:', depositData);
      // TODO: Implement actual deposit API call
      // await api.post('/transactions/deposit', depositData);
      toast.success('Deposit request submitted successfully!');
      setShowDepositModal(false);
      // Refresh dashboard data if needed
    } catch (error) {
      console.error('Deposit error:', error);
      toast.error('Failed to process deposit');
    }
  };

  const handleWithdrawSubmit = async (withdrawData) => {
    try {
      console.log('Processing withdrawal:', withdrawData);
      // TODO: Implement actual withdrawal API call
      // await api.post('/transactions/withdraw', withdrawData);
      toast.success('Withdrawal request submitted successfully!');
      setShowWithdrawModal(false);
      // Refresh dashboard data if needed
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to process withdrawal');
    }
  };

  if (isLoading) {
    return <Loading message="Loading your dashboard..." />;
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="brand-section">
            <div className="brand-logo">
              <div className="logo-icon">
                <span>ET</span>
              </div>
              <h1>ExtremeTrader</h1>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="notification-btn">
              <Bell size={20} />
              {dashboardData.notifications.filter(n => !n.read).length > 0 && (
                <span className="notification-badge">
                  {dashboardData.notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            
            <div className="user-menu">
              <div className="user-avatar">
                <User size={20} />
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-id">ID: {user?.userId}</span>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="dashboard-nav">
        <div className="nav-tabs">
          {[
            { id: 'overview', label: 'Overview', icon: <PieChart size={18} /> },
            { id: 'trading', label: 'Trading', icon: <TrendingUp size={18} /> },
            { id: 'team', label: 'Team', icon: <Users size={18} /> },
            { id: 'income', label: 'Income', icon: <DollarSign size={18} /> },
            { id: 'profile', label: 'Profile', icon: <Settings size={18} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-header">
                  <div className="stat-icon">
                    <Wallet size={24} />
                  </div>
                  <button
                    onClick={() => setShowBalances(!showBalances)}
                    className="balance-toggle"
                  >
                    {showBalances ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="stat-content">
                  <h3>Total Balance</h3>
                  <p className="stat-value">
                    {showBalances ? formatCurrency(dashboardData.stats.totalBalance) : '****'}
                  </p>
                  <div className="stat-change positive">
                    <ArrowUpRight size={16} />
                    <span>+12.5% this week</span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon">
                    <TrendingUp size={24} />
                  </div>
                </div>
                <div className="stat-content">
                  <h3>Trading Balance</h3>
                  <p className="stat-value">
                    {showBalances ? formatCurrency(dashboardData.stats.tradingBalance) : '****'}
                  </p>
                  <div className="stat-change positive">
                    <ArrowUpRight size={16} />
                    <span>+8.3% today</span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon">
                    <DollarSign size={24} />
                  </div>
                </div>
                <div className="stat-content">
                  <h3>Total Income</h3>
                  <p className="stat-value">
                    {showBalances ? formatCurrency(dashboardData.stats.totalIncome) : '****'}
                  </p>
                  <div className="stat-change positive">
                    <ArrowUpRight size={16} />
                    <span>+15.2% this month</span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon">
                    <Users size={24} />
                  </div>
                </div>
                <div className="stat-content">
                  <h3>Team Size</h3>
                  <p className="stat-value">{dashboardData.stats.teamSize}</p>
                  <div className="stat-change positive">
                    <ArrowUpRight size={16} />
                    <span>+3 this week</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-grid">
                <button className="action-card" onClick={handleDeposit}>
                  <Plus size={20} />
                  <span>Deposit</span>
                </button>
                <button className="action-card" onClick={handleWithdraw}>
                  <Minus size={20} />
                  <span>Withdraw</span>
                </button>
                <button className="action-card" onClick={handleReferFriend}>
                  <Share2 size={20} />
                  <span>Refer Friend</span>
                </button>
                <button className="action-card" onClick={handleAnalytics}>
                  <BarChart3 size={20} />
                  <span>Analytics</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="dashboard-section">
              <div className="section-header">
                <h3>Recent Activity</h3>
                <button className="refresh-btn">
                  <RefreshCw size={16} />
                </button>
              </div>
              <div className="activity-list">
                {dashboardData.recentTransactions.map(transaction => (
                  <div key={transaction.id} className="activity-item">
                    <div className="activity-icon" style={{ color: getStatusColor(transaction.status) }}>
                      {getStatusIcon(transaction.status)}
                    </div>
                    <div className="activity-content">
                      <h4>{transaction.description}</h4>
                      <p>{formatDate(transaction.date)}</p>
                    </div>
                    <div className="activity-amount">
                      <span className={transaction.type === 'deposit' ? 'positive' : 'negative'}>
                        {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trading' && (
          <div className="trading-section">
            <div className="section-header">
              <h3>Trading Packages</h3>
              <p>Choose a package to start trading</p>
            </div>
            
            <div className="packages-grid">
              {dashboardData.tradingPackages.map(pkg => (
                <div key={pkg.id} className="package-card">
                  <div className="package-header">
                    <h4>{pkg.name}</h4>
                    <div className="package-price">{formatCurrency(pkg.price)}</div>
                  </div>
                  <div className="package-returns">
                    <div className="return-item">
                      <span>Daily Return</span>
                      <span className="return-value">{pkg.dailyReturn}%</span>
                    </div>
                    <div className="return-item">
                      <span>Duration</span>
                      <span className="return-value">{pkg.duration} days</span>
                    </div>
                  </div>
                  <div className="package-features">
                    {pkg.features.map((feature, index) => (
                      <div key={index} className="feature-item">
                        <CheckCircle size={16} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <button className="package-btn">
                    Choose Package
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="team-section">
            <div className="referral-card">
              <div className="referral-header">
                <div className="referral-icon">
                  <Gift size={24} />
                </div>
                <h3>Referral Program</h3>
                <p>Share your referral code and earn rewards</p>
              </div>
              
              <div className="referral-code">
                <div className="code-display">
                  <span>Your Referral Code</span>
                  <div className="code-value">
                    <strong>{user?.referralCode}</strong>
                    <button onClick={copyReferralLink} className="copy-btn">
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="referral-stats">
                  <div className="stat-item">
                    <span>Direct Referrals</span>
                    <strong>{dashboardData.stats.directReferrals}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Total Team</span>
                    <strong>{dashboardData.stats.teamSize}</strong>
                  </div>
                </div>
                
                <button onClick={shareReferralLink} className="share-btn">
                  <Share2 size={16} />
                  Share Referral Link
                </button>
              </div>
            </div>

            <div className="team-members">
              <div className="section-header">
                <h3>Team Members</h3>
                <span className="member-count">{dashboardData.teamMembers.length} members</span>
              </div>
              
              <div className="members-list">
                {dashboardData.teamMembers.map(member => (
                  <div key={member.id} className="member-item">
                    <div className="member-avatar">
                      <User size={20} />
                    </div>
                    <div className="member-info">
                      <h4>{member.name}</h4>
                      <p>Level {member.level} • Joined {formatDate(member.joinDate)}</p>
                    </div>
                    <div className="member-stats">
                      <div className="stat">
                        <span>Investment</span>
                        <strong>{formatCurrency(member.totalInvestment)}</strong>
                      </div>
                      <div className="stat">
                        <span>Team</span>
                        <strong>{member.teamSize}</strong>
                      </div>
                    </div>
                    <div className={`member-status ${member.status}`}>
                      {member.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'income' && (
          <div className="income-section">
            <div className="income-summary">
              <div className="summary-card">
                <h3>Today's Income</h3>
                <div className="income-amount">
                  {formatCurrency(dashboardData.stats.todayIncome)}
                </div>
                <div className="income-change positive">
                  <ArrowUpRight size={16} />
                  <span>+{((dashboardData.stats.todayIncome / dashboardData.stats.weeklyIncome) * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="summary-card">
                <h3>Weekly Income</h3>
                <div className="income-amount">
                  {formatCurrency(dashboardData.stats.weeklyIncome)}
                </div>
                <div className="income-change positive">
                  <ArrowUpRight size={16} />
                  <span>+{((dashboardData.stats.weeklyIncome / dashboardData.stats.monthlyIncome) * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="summary-card">
                <h3>Monthly Income</h3>
                <div className="income-amount">
                  {formatCurrency(dashboardData.stats.monthlyIncome)}
                </div>
                <div className="income-change positive">
                  <ArrowUpRight size={16} />
                  <span>+15.8%</span>
                </div>
              </div>
            </div>

            <div className="income-history">
              <div className="section-header">
                <h3>Income History</h3>
                <button className="filter-btn">
                  <Calendar size={16} />
                  Filter
                </button>
              </div>
              
              <div className="income-list">
                {dashboardData.recentIncomes.map(income => (
                  <div key={income.id} className="income-item">
                    <div className="income-type">
                      <div className="type-icon">
                        <Award size={16} />
                      </div>
                      <div className="type-info">
                        <h4>{income.type}</h4>
                        <p>{income.source}</p>
                      </div>
                    </div>
                    <div className="income-details">
                      <div className="income-amount positive">
                        +{formatCurrency(income.amount)}
                      </div>
                      <div className="income-date">
                        {formatDate(income.date)}
                      </div>
                    </div>
                    <div className="income-status">
                      {getStatusIcon(income.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-section">
            <div className="profile-header">
              <div className="profile-avatar">
                <User size={40} />
              </div>
              <div className="profile-info">
                <h2>{user?.name}</h2>
                <p>Member since {formatDate(user?.createdAt)}</p>
                <div className="profile-badges">
                  <span className="badge">{dashboardData.stats.currentRank}</span>
                  <span className="badge">Verified</span>
                </div>
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-section">
                <h3>Personal Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span>Full Name</span>
                    <strong>{user?.name}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Email</span>
                    <strong>{user?.email}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Phone</span>
                    <strong>{user?.phone || 'Not provided'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>User ID</span>
                    <strong>{user?.userId}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Referral Code</span>
                    <strong>{user?.referralCode}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Status</span>
                    <strong className={user?.status}>{user?.status}</strong>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Account Security</h3>
                <div className="security-actions">
                  <button className="security-btn">
                    Change Password
                  </button>
                  <button className="security-btn">
                    Enable 2FA
                  </button>
                  <button className="security-btn">
                    Update Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Make a Deposit</h3>
              <button onClick={() => setShowDepositModal(false)} className="modal-close">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleDepositSubmit({
                amount: parseFloat(formData.get('amount')),
                method: formData.get('method'),
                package: formData.get('package')
              });
            }}>
              <div className="form-group">
                <label>Package</label>
                <select name="package" required>
                  <option value="">Select a package</option>
                  {dashboardData.tradingPackages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - {formatCurrency(pkg.price)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount (USD)</label>
                <input type="number" name="amount" min="100" step="0.01" required />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select name="method" required>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="card">Credit/Debit Card</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowDepositModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Proceed to Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Withdraw Funds</h3>
              <button onClick={() => setShowWithdrawModal(false)} className="modal-close">
                <XCircle size={20} />
              </button>
            </div>
            <div className="withdraw-info">
              <div className="balance-info">
                <span>Available Balance:</span>
                <strong>{formatCurrency(dashboardData.stats.totalBalance)}</strong>
              </div>
              <div className="withdraw-limits">
                <p>Minimum withdrawal: $10.00</p>
                <p>Processing time: 1-3 business days</p>
              </div>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleWithdrawSubmit({
                amount: parseFloat(formData.get('amount')),
                method: formData.get('method'),
                address: formData.get('address')
              });
            }}>
              <div className="form-group">
                <label>Amount (USD)</label>
                <input 
                  type="number" 
                  name="amount" 
                  min="10" 
                  max={dashboardData.stats.totalBalance}
                  step="0.01" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Withdrawal Method</label>
                <select name="method" required>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              <div className="form-group">
                <label>Wallet Address / Account Details</label>
                <textarea 
                  name="address" 
                  placeholder="Enter your wallet address or account details"
                  required
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowWithdrawModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Request Withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Referral Modal */}
      {showReferralModal && (
        <div className="modal-overlay" onClick={() => setShowReferralModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Refer Friends & Earn</h3>
              <button onClick={() => setShowReferralModal(false)} className="modal-close">
                <XCircle size={20} />
              </button>
            </div>
            <div className="referral-content">
              <div className="referral-benefits">
                <h4>Referral Benefits</h4>
                <ul>
                  <li>Earn $5 for each friend who signs up</li>
                  <li>Get 5% commission on their trading profits</li>
                  <li>Build your team and unlock higher ranks</li>
                  <li>Unlimited earning potential</li>
                </ul>
              </div>
              
              <div className="referral-share">
                <div className="share-code">
                  <label>Your Referral Code</label>
                  <div className="code-input">
                    <input 
                      type="text" 
                      value={user?.referralCode} 
                      readOnly 
                    />
                    <button onClick={copyReferralLink} className="copy-btn">
                      <Copy size={16} />
                      Copy
                    </button>
                  </div>
                </div>
                
                <div className="share-link">
                  <label>Referral Link</label>
                  <div className="code-input">
                    <input 
                      type="text" 
                      value={`${window.location.origin}/signup?ref=${user?.referralCode}`}
                      readOnly 
                    />
                    <button onClick={copyReferralLink} className="copy-btn">
                      <Copy size={16} />
                      Copy
                    </button>
                  </div>
                </div>
                
                <div className="social-share">
                  <h4>Share on Social Media</h4>
                  <div className="social-buttons">
                    <button onClick={shareReferralLink} className="social-btn whatsapp">
                      <Share2 size={16} />
                      WhatsApp
                    </button>
                    <button onClick={shareReferralLink} className="social-btn telegram">
                      <Share2 size={16} />
                      Telegram
                    </button>
                    <button onClick={shareReferralLink} className="social-btn facebook">
                      <Share2 size={16} />
                      Facebook
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div className="modal-overlay" onClick={() => setShowAnalyticsModal(false)}>
          <div className="modal-content analytics-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Analytics Dashboard</h3>
              <button onClick={() => setShowAnalyticsModal(false)} className="modal-close">
                <XCircle size={20} />
              </button>
            </div>
            <div className="analytics-content">
              <div className="analytics-stats">
                <div className="analytics-card">
                  <h4>Total Earnings</h4>
                  <div className="analytics-value">
                    {formatCurrency(dashboardData.stats.totalIncome)}
                  </div>
                  <div className="analytics-change positive">+15.2% this month</div>
                </div>
                
                <div className="analytics-card">
                  <h4>Active Investments</h4>
                  <div className="analytics-value">
                    {formatCurrency(dashboardData.stats.tradingBalance)}
                  </div>
                  <div className="analytics-change positive">+8.3% this week</div>
                </div>
                
                <div className="analytics-card">
                  <h4>Team Performance</h4>
                  <div className="analytics-value">
                    {dashboardData.stats.teamSize} members
                  </div>
                  <div className="analytics-change positive">+3 new this week</div>
                </div>
                
                <div className="analytics-card">
                  <h4>ROI</h4>
                  <div className="analytics-value">
                    {((dashboardData.stats.totalIncome / dashboardData.stats.tradingBalance) * 100).toFixed(1)}%
                  </div>
                  <div className="analytics-change positive">+2.1% this month</div>
                </div>
              </div>
              
              <div className="analytics-charts">
                <div className="chart-section">
                  <h4>Income Trend (Last 7 Days)</h4>
                  <div className="chart-placeholder">
                    <BarChart3 size={48} />
                    <p>Chart visualization would go here</p>
                    <p>Daily income: $25, $30, $28, $35, $40, $38, $45</p>
                  </div>
                </div>
                
                <div className="chart-section">
                  <h4>Team Growth</h4>
                  <div className="chart-placeholder">
                    <TrendingUp size={48} />
                    <p>Team growth visualization</p>
                    <p>New members this month: {dashboardData.stats.directReferrals}</p>
                  </div>
                </div>
              </div>
              
              <div className="performance-metrics">
                <h4>Performance Metrics</h4>
                <div className="metrics-grid">
                  <div className="metric">
                    <span>Best Performing Day</span>
                    <strong>Monday (+$45)</strong>
                  </div>
                  <div className="metric">
                    <span>Average Daily Return</span>
                    <strong>2.3%</strong>
                  </div>
                  <div className="metric">
                    <span>Win Rate</span>
                    <strong>87.5%</strong>
                  </div>
                  <div className="metric">
                    <span>Risk Score</span>
                    <strong>Low</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 