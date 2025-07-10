import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Users, ArrowRight, Loader2, CheckCircle, Phone } from 'lucide-react';
import authService from '../services/authService';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    referralCode: searchParams.get('ref') || '',
    agreeTerms: false,
    agreePrivacy: false
  });

  const [formState, setFormState] = useState({
    isLoading: false,
    showPassword: false,
    showConfirmPassword: false,
    passwordStrength: 0
  });

  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [referrerInfo, setReferrerInfo] = useState(null);
  const [verifyingReferral, setVerifyingReferral] = useState(false);

  // Load referral code from URL on component mount
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }));
      verifyReferralCode(refCode);
    }
  }, [searchParams]);

  // Verify referral code and get referrer info
  const verifyReferralCode = async (code) => {
    if (!code || code.length !== 8) {
      setReferrerInfo(null);
      return;
    }

    setVerifyingReferral(true);
    try {
      const result = await authService.verifyReferralCode(code);
      if (result.success) {
        setReferrerInfo(result.data.sponsor);
        setErrors(prev => ({ ...prev, referralCode: '' }));
      } else {
        setReferrerInfo(null);
        setErrors(prev => ({ ...prev, referralCode: result.error }));
      }
    } catch (error) {
      setReferrerInfo(null);
      setErrors(prev => ({ ...prev, referralCode: 'Failed to verify referral code' }));
    } finally {
      setVerifyingReferral(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value;
    
    // Convert referral code to uppercase
    if (name === 'referralCode') {
      processedValue = value.toUpperCase();
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }));

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Calculate password strength
    if (name === 'password') {
      calculatePasswordStrength(value);
    }

    // Verify referral code when it changes
    if (name === 'referralCode' && processedValue.length === 8) {
      verifyReferralCode(processedValue);
    } else if (name === 'referralCode' && processedValue.length !== 8) {
      setReferrerInfo(null);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    
    setFormState(prev => ({
      ...prev,
      passwordStrength: Math.min(strength, 100)
    }));
  };

  const togglePasswordVisibility = (field) => {
    setFormState(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      newErrors.name = 'Name can only contain letters and spaces';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[0-9\s\-()]{10,}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number (minimum 10 digits)';
    }

    // Validate referral code if provided
    if (formData.referralCode.trim() && !/^[A-Z0-9]{8}$/.test(formData.referralCode.trim())) {
      newErrors.referralCode = 'Referral code must be 8 characters (letters and numbers)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions';
    }

    if (!formData.agreePrivacy) {
      newErrors.agreePrivacy = 'You must agree to the privacy policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handlePreviousStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }

    setFormState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await authService.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        referralCode: formData.referralCode.trim() || undefined
      });

      if (result.success) {
        navigate('/dashboard');
      } else {
        // Handle validation errors from backend
        if (result.error && typeof result.error === 'object' && result.error.errors) {
          const backendErrors = {};
          result.error.errors.forEach(error => {
            if (error.field === 'sponsorCode') {
              backendErrors.referralCode = error.message;
            } else {
              backendErrors[error.field] = error.message;
            }
          });
          setErrors(backendErrors);
        } else {
          setErrors({ general: result.error || 'Registration failed' });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle axios error response
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          if (err.field === 'sponsorCode') {
            backendErrors.referralCode = err.message;
          } else {
            backendErrors[err.field] = err.message;
          }
        });
        setErrors(backendErrors);
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getPasswordStrengthColor = () => {
    if (formState.passwordStrength < 25) return '#ef4444';
    if (formState.passwordStrength < 50) return '#f59e0b';
    if (formState.passwordStrength < 75) return '#10b981';
    return '#00f5cc';
  };

  const getPasswordStrengthText = () => {
    if (formState.passwordStrength < 25) return 'Weak';
    if (formState.passwordStrength < 50) return 'Fair';
    if (formState.passwordStrength < 75) return 'Good';
    return 'Strong';
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
              <h2>Create Account</h2>
              <p>Join thousands of traders and start your journey</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="signup-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(step / 2) * 100}%` }}
              ></div>
            </div>
            <div className="progress-steps">
              <div className={`step ${step >= 1 ? 'active' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-label">Personal Info</span>
              </div>
              <div className={`step ${step >= 2 ? 'active' : ''}`}>
                <span className="step-number">2</span>
                <span className="step-label">Security</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {errors.general && (
              <div className="error-banner">
                <span>{errors.general}</span>
              </div>
            )}

            {step === 1 && (
              <div className="form-step">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Full Name
                  </label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={18} />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      placeholder="Enter your full name"
                      autoComplete="name"
                    />
                  </div>
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

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
                    />
                  </div>
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Phone Number
                  </label>
                  <div className="input-wrapper">
                    <Phone className="input-icon" size={18} />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`form-input ${errors.phone ? 'error' : ''}`}
                      placeholder="Enter your phone number"
                      autoComplete="tel"
                    />
                  </div>
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="referralCode" className="form-label">
                    Referral Code (Optional)
                  </label>
                  <div className="input-wrapper">
                    <Users className="input-icon" size={18} />
                    <input
                      type="text"
                      id="referralCode"
                      name="referralCode"
                      value={formData.referralCode}
                      onChange={handleInputChange}
                      className={`form-input ${errors.referralCode ? 'error' : ''}`}
                      placeholder="Enter referral code (8 characters)"
                      maxLength="8"
                    />
                    {verifyingReferral && (
                      <div className="input-loading">
                        <Loader2 className="spin" size={16} />
                      </div>
                    )}
                  </div>
                  {errors.referralCode && <span className="error-text">{errors.referralCode}</span>}
                  {referrerInfo && (
                    <div className="referrer-info">
                      <div className="referrer-badge">
                        <CheckCircle size={16} />
                        <span>Valid referral code</span>
                      </div>
                      <div className="referrer-details">
                        <div className="referrer-name">
                          <User size={14} />
                          <span>Referred by: <strong>{referrerInfo.name}</strong></span>
                        </div>
                        <div className="referrer-email">
                          <Mail size={14} />
                          <span>{referrerInfo.email}</span>
                        </div>
                        <div className="referrer-bonus">
                          <span>💰 You'll both receive signup bonuses!</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="auth-button primary"
                >
                  <div className="button-content">
                    <span>Continue</span>
                    <ArrowRight size={18} />
                  </div>
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="form-step">
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
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('showPassword')}
                      className="password-toggle"
                    >
                      {formState.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div 
                          className="strength-fill"
                          style={{ 
                            width: `${formState.passwordStrength}%`,
                            backgroundColor: getPasswordStrengthColor()
                          }}
                        ></div>
                      </div>
                      <span 
                        className="strength-text"
                        style={{ color: getPasswordStrengthColor() }}
                      >
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                  )}
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password
                  </label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={18} />
                    <input
                      type={formState.showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('showConfirmPassword')}
                      className="password-toggle"
                    >
                      {formState.showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>

                <div className="form-agreements">
                  <label className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleInputChange}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-label">
                      I agree to the{' '}
                      <Link to="/terms" className="agreement-link">
                        Terms and Conditions
                      </Link>
                    </span>
                  </label>
                  {errors.agreeTerms && <span className="error-text">{errors.agreeTerms}</span>}

                  <label className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      name="agreePrivacy"
                      checked={formData.agreePrivacy}
                      onChange={handleInputChange}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-label">
                      I agree to the{' '}
                      <Link to="/privacy" className="agreement-link">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {errors.agreePrivacy && <span className="error-text">{errors.agreePrivacy}</span>}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="auth-button secondary"
                  >
                    Back
                  </button>
                  
                  <button
                    type="submit"
                    className="auth-button primary"
                    disabled={formState.isLoading}
                  >
                    {formState.isLoading ? (
                      <div className="button-loading">
                        <Loader2 className="spin" size={18} />
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      <div className="button-content">
                        <span>Create Account</span>
                        <ArrowRight size={18} />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup; 