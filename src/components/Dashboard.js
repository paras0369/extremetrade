import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Wallet,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  EyeOff,
  LogOut,
  Bell,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  Shield,
  Settings,
  CreditCard,
  UserPlus,
  TrendingDown,
  Activity,
  Calendar,
  FileText,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Home,
  Database,
  GitBranch,
  Layers,
  Zap,
  Copy,
} from "lucide-react";
import authService from "../services/authService";
import mlmApi from "../services/mlmApi";
import "./Dashboard.css";
import { toast } from "react-hot-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showBalances, setShowBalances] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [dashboardData, setDashboardData] = useState({
    overview: null,
    wallet: null,
    team: null,
    income: null,
    withdrawals: null,
    investments: null,
  });
  const [showNotifications, setShowNotifications] = useState(false);

  // Navigation structure based on backend APIs
  const navigationItems = [
    {
      category: "Main",
      icon: <Home size={16} />,
      items: [
        { id: "dashboard", label: "Dashboard", icon: <PieChart size={18} /> },
        { id: "wallet", label: "Wallet", icon: <Wallet size={18} /> },
        { id: "team", label: "Team", icon: <Users size={18} /> },
        { id: "income", label: "Income", icon: <DollarSign size={18} /> },
        {
          id: "withdrawals",
          label: "Withdrawals",
          icon: <CreditCard size={18} />,
        },
        {
          id: "investments",
          label: "Investments",
          icon: <TrendingUp size={18} />,
        },
      ],
    },
    {
      category: "User Management",
      icon: <User size={16} />,
      items: [
        { id: "profile", label: "Profile", icon: <Settings size={18} /> },
        { id: "security", label: "Security", icon: <Shield size={18} /> },
        { id: "referrals", label: "Referrals", icon: <UserPlus size={18} /> },
      ],
    },
    {
      category: "Analytics",
      icon: <BarChart3 size={16} />,
      items: [
        { id: "analytics", label: "Analytics", icon: <Activity size={18} /> },
        { id: "reports", label: "Reports", icon: <FileText size={18} /> },
        { id: "genealogy", label: "Genealogy", icon: <GitBranch size={18} /> },
      ],
    },
  ];

  // Handle mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          navigate("/login");
          return;
        }

        setIsLoading(true);

        // Get fresh user profile
        const profileResult = await authService.getProfile();
        if (profileResult.success) {
          setUser(profileResult.data.user);
        }

        // Load all dashboard data
        const data = await mlmApi.loadDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error("Dashboard: Error loading data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      // Force a page reload to ensure clean state
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy");
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      COMPLETED: {
        class: "success",
        label: "Completed",
        icon: <CheckCircle size={14} />,
      },
      PENDING: {
        class: "warning",
        label: "Pending",
        icon: <Clock size={14} />,
      },
      PROCESSING: {
        class: "info",
        label: "Processing",
        icon: <RefreshCw size={14} />,
      },
      REJECTED: {
        class: "error",
        label: "Rejected",
        icon: <XCircle size={14} />,
      },
      APPROVED: {
        class: "success",
        label: "Approved",
        icon: <CheckCircle size={14} />,
      },
      FAILED: {
        class: "error",
        label: "Failed",
        icon: <AlertTriangle size={14} />,
      },
    };

    const statusInfo = statusMap[status] || {
      class: "info",
      label: status,
      icon: <Activity size={14} />,
    };

    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.icon}
        {statusInfo.label}
      </span>
    );
  };

  const renderDashboardOverview = () => {
    const stats = dashboardData.overview?.success
      ? (dashboardData.overview.data?.data || dashboardData.overview.data)
      : {};
    const walletData = dashboardData.wallet?.success
      ? (dashboardData.wallet.data?.data?.wallet || dashboardData.wallet.data?.wallet || dashboardData.wallet.data)
      : {};
    const teamData = dashboardData.team?.success 
      ? (dashboardData.team.data?.data || dashboardData.team.data) 
      : {};

    // Debug data structures
    console.log('Dashboard wallet data:', dashboardData.wallet);
    console.log('Processed wallet data:', walletData);
    console.log('Dashboard overview data:', dashboardData.overview);
    console.log('Processed stats data:', stats);
    console.log('Dashboard team data:', dashboardData.team);
    console.log('Processed team data:', teamData);

    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.name}!</p>
          </div>
          <div className="page-actions">
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

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
                {showBalances
                  ? formatCurrency(walletData.totalBalance)
                  : "****"}
              </p>
              <div className="stat-change positive">
                <ArrowUpRight size={16} />
                <span>
                  Available:{" "}
                  {showBalances
                    ? formatCurrency(walletData.availableBalance)
                    : "****"}
                </span>
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
              <h3>Total Earnings</h3>
              <p className="stat-value">
                {showBalances
                  ? formatCurrency(walletData.totalEarnings)
                  : "****"}
              </p>
              <div className="stat-change positive">
                <ArrowUpRight size={16} />
                <span>This month</span>
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
              <p className="stat-value">{teamData.totalMembers || 0}</p>
              <div className="stat-change positive">
                <ArrowUpRight size={16} />
                <span>Direct: {teamData.directMembers || 0}</span>
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
              <h3>Monthly Income</h3>
              <p className="stat-value">
                {showBalances ? formatCurrency(stats.monthlyIncome) : "****"}
              </p>
              <div className="stat-change positive">
                <ArrowUpRight size={16} />
                <span>+15.2%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="data-table">
          <div className="table-header">
            <h3>Recent Transactions</h3>
            <div className="table-actions">
              <button className="btn btn-secondary">
                <Calendar size={16} />
                Filter
              </button>
            </div>
          </div>
          <div className="table-content">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.wallet?.success &&
                  (dashboardData.wallet.data?.data?.wallet?.recentTransactions || dashboardData.wallet.data?.recentTransactions)?.map(
                    (transaction) => (
                      <tr key={transaction.id}>
                        <td>{transaction.type}</td>
                        <td
                          className={`amount ${
                            transaction.amount >= 0 ? "positive" : "negative"
                          }`}
                        >
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td>{getStatusBadge(transaction.status)}</td>
                        <td>{formatDate(transaction.createdAt)}</td>
                        <td>{transaction.description}</td>
                      </tr>
                    )
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderWalletTab = () => {
    const walletData = dashboardData.wallet?.success
      ? (dashboardData.wallet.data?.data?.wallet || dashboardData.wallet.data?.wallet || dashboardData.wallet.data)
      : {};

    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Wallet</h1>
            <p className="page-subtitle">
              Manage your balance and transactions
            </p>
          </div>
          <div className="page-actions"></div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <Wallet size={24} />
              </div>
            </div>
            <div className="stat-content">
              <h3>Available Balance</h3>
              <p className="stat-value">
                {formatCurrency(walletData.availableBalance)}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <Database size={24} />
              </div>
            </div>
            <div className="stat-content">
              <h3>Locked Balance</h3>
              <p className="stat-value">
                {formatCurrency(walletData.lockedBalance)}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <ArrowUpRight size={24} />
              </div>
            </div>
            <div className="stat-content">
              <h3>Total Earnings</h3>
              <p className="stat-value">
                {formatCurrency(walletData.totalEarnings)}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <ArrowDownRight size={24} />
              </div>
            </div>
            <div className="stat-content">
              <h3>Total Withdrawals</h3>
              <p className="stat-value">
                {formatCurrency(walletData.totalWithdrawals)}
              </p>
            </div>
          </div>
        </div>

        <div className="data-table">
          <div className="table-header">
            <h3>Transaction History</h3>
            <div className="table-actions">
              <button className="btn btn-secondary">
                <Calendar size={16} />
                Filter
              </button>
            </div>
          </div>
          <div className="table-content">
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {walletData.transactions?.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>#{transaction.id}</td>
                    <td>{transaction.type}</td>
                    <td
                      className={`amount ${
                        transaction.amount >= 0 ? "positive" : "negative"
                      }`}
                    >
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td>{getStatusBadge(transaction.status)}</td>
                    <td>{formatDate(transaction.createdAt)}</td>
                    <td>{transaction.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTeamTab = () => {
    const teamData = dashboardData.team?.success 
      ? (dashboardData.team.data?.data || dashboardData.team.data) 
      : {};

    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Team Management</h1>
            <p className="page-subtitle">View and manage your team members</p>
          </div>
          <div className="page-actions">
            <button className="btn btn-primary">
              <UserPlus size={16} />
              Invite Member
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <Users size={24} />
              </div>
            </div>
            <div className="stat-content">
              <h3>Total Team</h3>
              <p className="stat-value">{teamData.totalMembers || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <UserPlus size={24} />
              </div>
            </div>
            <div className="stat-content">
              <h3>Direct Members</h3>
              <p className="stat-value">{teamData.directMembers || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <Layers size={24} />
              </div>
            </div>
            <div className="stat-content">
              <h3>Team Levels</h3>
              <p className="stat-value">{teamData.maxLevel || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="stat-content">
              <h3>Team Business</h3>
              <p className="stat-value">
                {formatCurrency(teamData.totalBusiness)}
              </p>
            </div>
          </div>
        </div>

        <div className="data-table">
          <div className="table-header">
            <h3>Team Members</h3>
            <div className="table-actions">
              <button className="btn btn-secondary">
                <Calendar size={16} />
                Filter
              </button>
            </div>
          </div>
          <div className="table-content">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Level</th>
                  <th>Join Date</th>
                  <th>Status</th>
                  <th>Business</th>
                  <th>Team Size</th>
                </tr>
              </thead>
              <tbody>
                {teamData.members?.map((member) => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td>Level {member.level}</td>
                    <td>{formatDate(member.joinedAt)}</td>
                    <td>{getStatusBadge(member.status)}</td>
                    <td className="amount">
                      {formatCurrency(member.totalBusiness)}
                    </td>
                    <td>{member.teamSize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading dashboard data...</p>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return renderDashboardOverview();
      case "wallet":
        return renderWalletTab();
      case "team":
        return renderTeamTab();
      case "income":
        return (
          <div className="empty-state">
            <h3>Income Analytics</h3>
            <p>Coming soon...</p>
          </div>
        );
      case "withdrawals":
        return (
          <div className="empty-state">
            <h3>Withdrawal Management</h3>
            <p>Coming soon...</p>
          </div>
        );
      case "investments":
        return (
          <div className="empty-state">
            <h3>Investment Portfolio</h3>
            <p>Coming soon...</p>
          </div>
        );
      case "profile":
        return (
          <div className="empty-state">
            <h3>Profile Settings</h3>
            <p>Coming soon...</p>
          </div>
        );
      case "security":
        return (
          <div className="empty-state">
            <h3>Security Settings</h3>
            <p>Coming soon...</p>
          </div>
        );
      case "referrals":
        return (
          <div className="empty-state">
            <h3>Referral Program</h3>
            <p>Coming soon...</p>
          </div>
        );
      case "analytics":
        return (
          <div className="empty-state">
            <h3>Analytics Dashboard</h3>
            <p>Coming soon...</p>
          </div>
        );
      case "reports":
        return (
          <div className="empty-state">
            <h3>Reports</h3>
            <p>Coming soon...</p>
          </div>
        );
      case "genealogy":
        return (
          <div className="empty-state">
            <h3>Team Genealogy</h3>
            <p>Coming soon...</p>
          </div>
        );
      default:
        return renderDashboardOverview();
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="brand-section">
            {isMobile && (
              <button onClick={toggleSidebar} className="sidebar-toggle">
                <div className="hamburger">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>
            )}
            <div className="brand-logo">
              <div className="logo-icon">
                <span>ET</span>
              </div>
              <h1>ExtremeTrader</h1>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="notification-btn"
              onClick={() => setShowNotifications(true)}
            >
              <Bell size={20} />
              <span className="notification-badge">3</span>
            </button>

            <div className="user-menu">
              <div className="user-avatar">
                <User size={20} />
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-id">
                  ID: {user?.referralCode || "N/A"}
                </span>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <div className="mobile-bottom-nav">
            <div className="mobile-nav-items">
              {navigationItems
                .map((category) =>
                  category.items.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`mobile-nav-item ${
                        activeTab === item.id ? "active" : ""
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))
                )
                .flat()
                .slice(0, 4)}
              <button
                onClick={toggleSidebar}
                className="mobile-nav-item mobile-menu-btn"
              >
                <User size={18} />
                <span>Menu</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Menu Modal */}
        {isMobile && sidebarOpen && (
          <>
            <div className="mobile-menu-overlay" onClick={toggleSidebar}></div>
            <div className="mobile-menu-modal">
              <div className="mobile-menu-header">
                <h3>Menu</h3>
                <button onClick={toggleSidebar} className="mobile-menu-close">
                  <XCircle size={24} />
                </button>
              </div>

              {/* User Info in Mobile Menu */}
              <div className="mobile-user-info">
                <div className="mobile-user-header">
                  <div className="user-avatar-mobile">
                    <User size={20} />
                  </div>
                  <div className="mobile-user-details">
                    <h4>{user?.name}</h4>
                    <p>ID: {user?.referralCode || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="mobile-menu-nav">
                {navigationItems.map((category) => (
                  <div key={category.category} className="mobile-nav-category">
                    <h5>{category.category}</h5>
                    {category.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          toggleSidebar();
                        }}
                        className={`mobile-menu-item ${
                          activeTab === item.id ? "active" : ""
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Desktop Sidebar */}
        <div className={`dashboard-sidebar ${isMobile ? "mobile-hidden" : ""}`}>
          <div>
            <div className="sidebar-header">
              <h3>Navigation</h3>
              {isMobile && (
                <button onClick={toggleSidebar} className="sidebar-close">
                  <XCircle size={20} />
                </button>
              )}
            </div>

            {/* User Information Section */}
            <div className="sidebar-user-info">
              <div className="user-info-header">
                <div className="user-avatar-large">
                  <User size={24} />
                </div>
                <div className="user-details">
                  <h4 className="user-name-sidebar">{user?.name}</h4>
                  <p className="user-id-sidebar" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ID: {user?.referralCode || "N/A"}
                    <button 
                      className="copy-btn-inline"
                      onClick={() => copyToClipboard(user?.referralCode || "")}
                      title="Copy referral code"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#007bff',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#0056b3'}
                      onMouseLeave={(e) => e.target.style.color = '#007bff'}
                    >
                      <Copy size={18} />
                    </button>
                  </p>
                </div>
              </div>
              <div className="user-info-grid">
                <div className="user-info-item">
                  <span className="info-label">Status</span>
                  <span className="info-value">{user?.status || "Active"}</span>
                </div>
                <div className="user-info-item">
                  <span className="info-label">Joining Date</span>
                  <span className="info-value">
                    {user?.joinedAt ? formatDate(user.joinedAt) : "N/A"}
                  </span>
                </div>
                <div className="user-info-item">
                  <span className="info-label">Package</span>
                  <span className="info-value">{user?.package || "Basic"}</span>
                </div>
              </div>
            </div>

            <div className="sidebar-nav">
              {navigationItems.map((category) => (
                <div key={category.category} className="nav-category">
                  <div className="nav-category-header">
                    <span className="nav-category-icon">{category.icon}</span>
                    <span>{category.category}</span>
                  </div>
                  {category.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (isMobile) setSidebarOpen(false);
                      }}
                      className={`sidebar-nav-item ${
                        activeTab === item.id ? "active" : ""
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          <div className="dashboard-content">{renderContent()}</div>
        </div>
      </div>

      {/* Notification Modal */}
      {showNotifications && (
        <>
          <div
            className="notification-overlay"
            onClick={() => setShowNotifications(false)}
          ></div>
          <div className="notification-modal" style={{ backgroundColor: '#fff', color: '#333' }}>
            <div className="notification-header">
              <h3 style={{ color: '#333' }}>Notifications</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="notification-close"
                style={{ color: '#666' }}
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="notification-list">
              <div className="notification-item unread">
                <div className="notification-icon">
                  <Bell size={16} />
                </div>
                <div className="notification-content">
                  <h4 style={{ color: '#333', margin: '0 0 8px 0' }}>Welcome to ExtremeTrader</h4>
                  <p style={{ color: '#666', margin: '0 0 8px 0' }}>
                    Your account has been successfully created. Start trading
                    now!
                  </p>
                  <span className="notification-time" style={{ color: '#999', fontSize: '12px' }}>2 hours ago</span>
                </div>
              </div>
              <div className="notification-item">
                <div className="notification-icon">
                  <DollarSign size={16} />
                </div>
                <div className="notification-content">
                  <h4 style={{ color: '#333', margin: '0 0 8px 0' }}>Deposit Confirmed</h4>
                  <p style={{ color: '#666', margin: '0 0 8px 0' }}>Your deposit of $500 has been successfully processed.</p>
                  <span className="notification-time" style={{ color: '#999', fontSize: '12px' }}>1 day ago</span>
                </div>
              </div>
              <div className="notification-item">
                <div className="notification-icon">
                  <Users size={16} />
                </div>
                <div className="notification-content">
                  <h4 style={{ color: '#333', margin: '0 0 8px 0' }}>New Team Member</h4>
                  <p style={{ color: '#666', margin: '0 0 8px 0' }}>John Doe has joined your team under your referral.</p>
                  <span className="notification-time" style={{ color: '#999', fontSize: '12px' }}>2 days ago</span>
                </div>
              </div>
              <div className="notification-item">
                <div className="notification-icon">
                  <TrendingUp size={16} />
                </div>
                <div className="notification-content">
                  <h4 style={{ color: '#333', margin: '0 0 8px 0' }}>Profit Alert</h4>
                  <p style={{ color: '#666', margin: '0 0 8px 0' }}>Your investment has generated $25.50 in profits today.</p>
                  <span className="notification-time" style={{ color: '#999', fontSize: '12px' }}>3 days ago</span>
                </div>
              </div>
              <div className="notification-item">
                <div className="notification-icon">
                  <CheckCircle size={16} />
                </div>
                <div className="notification-content">
                  <h4 style={{ color: '#333', margin: '0 0 8px 0' }}>Withdrawal Completed</h4>
                  <p style={{ color: '#666', margin: '0 0 8px 0' }}>Your withdrawal request of $200 has been processed.</p>
                  <span className="notification-time" style={{ color: '#999', fontSize: '12px' }}>1 week ago</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
