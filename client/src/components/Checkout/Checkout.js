import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import './Checkout.css';
import API_BASE_URL from '../../config/api';

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(10.00);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post(
        '/payments/create',
        {
          amount: parseFloat(amount),
          currency: 'USD',
          metadata: {
            source: 'checkout_page',
            timestamp: new Date().toISOString()
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
      
      // Open Bitcoin Payment page in a new tab
      window.open(url, '_blank', 'noopener,noreferrer');
      
      // Reset form
      setAmount(10.00);
      setLoading(false);
    } catch (error) {
      console.error('Create payment error:', error);
      setError(error.response?.data?.message || 'Failed to create payment. Please try again.');
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1>Add Balance to Your Account</h1>
        <p className="checkout-subtitle">
          Add funds to your ShipCanary account using cryptocurrency via BTCPay Server
        </p>

        <form onSubmit={handleContinue} className="checkout-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="amount">Amount (USD)</label>
            <input
              type="number"
              id="amount"
              min="1.00"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={loading}
            />
            <small>Minimum: $1.00</small>
          </div>

          <div className="payment-info">
            <h3>Payment Method</h3>
            <p>
              You'll be redirected to BTCPay Server to complete your payment with cryptocurrency.
              Supported cryptocurrencies include Bitcoin, Lightning Network, and more.
            </p>
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading || amount < 1.00}
          >
            {loading ? 'Creating Payment...' : 'Continue to Crypto Checkout'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;

