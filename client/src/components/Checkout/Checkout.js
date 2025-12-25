import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './Checkout.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

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
      const response = await axios.post(
        `${API_URL}/payments/create`,
        {
          amount: parseFloat(amount),
          currency: 'USD',
          metadata: {
            source: 'checkout_page',
            timestamp: new Date().toISOString()
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Redirect to payment detail page
      navigate(`/checkout/${response.data.paymentId}`);
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
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={loading}
            />
            <small>Minimum: $0.01</small>
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
            disabled={loading || amount < 0.01}
          >
            {loading ? 'Creating Payment...' : 'Continue to Crypto Checkout'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;

