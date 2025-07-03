import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import authService from '../services/authService';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [formState, setFormState] = useState({
    isLoading: false,
    showPassword: false,
    rememberMe: false
  });

  const [errors, setErrors] = useState({});

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setFormState(prev => ({ ...prev, rememberMe: true }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCheckboxChange = (e) => {
    setFormState(prev => ({
      ...prev,
      rememberMe: e.target.checked
    }));
  };

  const togglePasswordVisibility = () => {
    setFormState(prev => ({
      ...prev,
      showPassword: !prev.showPassword
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setFormState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await authService.login({
        email: formData.email.trim(),
        password: formData.password
      });

      if (result.success) {
        // Handle remember me
        if (formState.rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email.trim());
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        // Redirect to intended page or dashboard
        navigate(from, { replace: true });
      } else {
        setErrors({ general: result.error || 'Login failed' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="background-gradient"></div>
        <div className="background-pattern"></div>
      </div>

      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-logo">
              <div className="logo-icon">
                <span>ET</span>
              </div>
              <h1>ExtremeTrader</h1>
            </div>
            <div className="auth-welcome">
              <h2>Welcome Back</h2>
              <p>Sign in to your account to continue trading</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {errors.general && (
              <div className="error-banner">
                <span>{errors.general}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={formState.isLoading}
                />
              </div>
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  type={formState.showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={formState.isLoading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="password-toggle"
                  disabled={formState.isLoading}
                >
                  {formState.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-options">
              <label className="checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={formState.rememberMe}
                  onChange={handleCheckboxChange}
                  disabled={formState.isLoading}
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-label">Remember me</span>
              </label>
              
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="auth-button primary"
              disabled={formState.isLoading}
            >
              {formState.isLoading ? (
                <div className="button-loading">
                  <Loader2 className="spin" size={18} />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="button-content">
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </div>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="auth-link">
                Create one now
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-features">
          <div className="feature-card">
            <div className="feature-icon">
              <div className="icon-bg">🔒</div>
            </div>
            <h3>Secure Trading</h3>
            <p>Advanced security measures to protect your investments</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <div className="icon-bg">📈</div>
            </div>
            <h3>Real-time Analytics</h3>
            <p>Live market data and comprehensive trading insights</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <div className="icon-bg">🎯</div>
            </div>
            <h3>Expert Support</h3>
            <p>24/7 customer support and trading guidance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 