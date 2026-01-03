import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './AddBalance.css';
import API_BASE_URL from '../../config/api';

const AddBalance = () => {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Refresh balance when component mounts to ensure we have the latest balance
  useEffect(() => {
    if (user) {
      fetchUser();
    }
  }, [user, fetchUser]);

  if (!user) {
    return (
      <div className="add-balance">
        <div className="login-prompt">
          <h3>🔒 Sign Up Required</h3>
          <p>Create an account to add balance to your account.</p>
          <button onClick={() => navigate('/register')} className="signup-prompt-button">
            Sign Up Free
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to add balance.');
        setLoading(false);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/payments/create`,
        {
          amount: parseFloat(amount),
          currency: 'USD',
          metadata: {
            source: 'add_balance_page',
            timestamp: new Date().toISOString()
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Validate paymentId exists before opening tab
      const paymentId = response.data.paymentId;
      if (!paymentId) {
        setError('Failed to create payment: Payment ID not received');
        setLoading(false);
        return;
      }

      // Build absolute URL for Bitcoin Payment page
      const origin = window.location.origin;
      const url = `${origin}/bitcoin-payment?invoiceId=${encodeURIComponent(paymentId)}`;
      
      // Log the URL before opening
      console.log('Opening payment tab:', url);
      
      // Open Bitcoin Payment page in a new tab (intermediate page)
      window.open(url, '_blank', 'noopener,noreferrer');

      // Reset form and show success message
      setAmount('');
      setLoading(false);
      // Optionally show a success message that the payment page opened in a new tab
    } catch (error) {
      console.error('Create payment error:', error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(error.response?.data?.message || 'Failed to create payment. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="add-balance">
      <div className="add-balance-container">
        {/* Header Section */}
        <div className="balance-header">
          <div className="header-content">
            <h2>Add Balance</h2>
            <p className="header-description">
              Top up your ShipCanary account to generate shipping labels.
            </p>
          </div>
          <div className="balance-badge">
            Current Balance: <strong>${user?.balance?.toFixed(2) || '0.00'}</strong>
          </div>
        </div>

        {/* Payment Card */}
        <div className="payment-card">
          <form onSubmit={handleSubmit} className="payment-form">
            {error && <div className="error-message">{error}</div>}

            {/* Amount Section */}
            <div className="form-group">
              <label>Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                min="1.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="10.00"
                disabled={loading}
              />
              <small className="helper-text">Minimum: $1.00</small>
            </div>

            {/* Payment Method Section */}
            <div className="payment-method-section">
              <h3 className="payment-method-title">Payment Method</h3>
              <div className="payment-method-content">
                <h4 className="payment-method-heading">Bitcoin via BTCPay Server</h4>
                <p className="payment-method-description">
                  We currently accept Bitcoin payments using BTCPay Server, an open-source, self-hosted payment processor. 
                  After clicking the button below, you'll be redirected to a secure checkout page to complete your payment.
                </p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="payment-actions">
              <button 
                type="submit" 
                disabled={loading || !amount || parseFloat(amount) < 1.00} 
                className="pay-button"
              >
                {loading ? 'Creating Payment...' : 'Continue to Bitcoin Checkout'}
              </button>
              <p className="security-note">
                You'll be redirected to our BTCPay-powered checkout to complete your Bitcoin payment.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBalance;

