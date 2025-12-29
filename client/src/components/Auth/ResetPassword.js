import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import './ResetPassword.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    console.log('[RESET-PASSWORD] Component loaded', { 
      hasToken: !!token, 
      tokenLength: token?.length,
      url: window.location.href 
    });
    
    if (!token) {
      console.error('[RESET-PASSWORD] No token in URL');
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError('Password must contain uppercase, lowercase, and a number');
      return;
    }

    setLoading(true);

    try {
      console.log('[RESET-PASSWORD] Submitting reset', {
        url: `${API_BASE_URL}/auth/reset-password`,
        hasToken: !!token,
        tokenLength: token?.length
      });

      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token,
        password: formData.password
      });

      console.log('[RESET-PASSWORD] Reset successful', response.data);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('[RESET-PASSWORD] Reset failed', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(error.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <h1>Invalid Reset Link</h1>
          <p>The password reset link is invalid or missing.</p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="success-icon">✓</div>
          <h1>Password Reset Successful</h1>
          <p>Your password has been reset. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <h1>Reset Your Password</h1>
        <p>Enter your new password below.</p>

        {error && <div className="reset-error">{error}</div>}

        <form onSubmit={handleSubmit} className="reset-form">
          <div className="form-field">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter new password"
            />
            <p className="field-hint">Must be at least 8 characters with uppercase, lowercase, and a number</p>
          </div>

          <div className="form-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm new password"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;



