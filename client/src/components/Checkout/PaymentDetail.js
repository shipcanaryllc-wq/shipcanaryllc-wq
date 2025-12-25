import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import OnRampWidget from './OnRampWidget';
import './PaymentDetail.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const PaymentDetail = () => {
  const { paymentId } = useParams();
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOnRamp, setShowOnRamp] = useState(false);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchPayment();
    
    // Set up polling if payment is pending
    let pollInterval;
    if (polling) {
      pollInterval = setInterval(() => {
        fetchPayment(true); // Silent fetch
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [paymentId, user, polling]);

  const fetchPayment = async (silent = false) => {
    try {
      const response = await axios.get(
        `${API_URL}/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const paymentData = response.data;
      setPayment(paymentData);
      setLoading(false);

      // Stop polling if payment is complete
      if (paymentData.status === 'CONFIRMED' || paymentData.status === 'PAID' || 
          paymentData.status === 'EXPIRED' || paymentData.status === 'FAILED') {
        setPolling(false);
        
        // If confirmed, refresh user balance and redirect
        if (paymentData.status === 'CONFIRMED') {
          await fetchUser();
          setTimeout(() => {
            navigate('/dashboard?payment=success');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Fetch payment error:', error);
      if (!silent) {
        setError(error.response?.data?.message || 'Failed to load payment');
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { label: 'Pending', class: 'status-pending' },
      PAID: { label: 'Paid', class: 'status-paid' },
      CONFIRMED: { label: 'Confirmed', class: 'status-confirmed' },
      EXPIRED: { label: 'Expired', class: 'status-expired' },
      FAILED: { label: 'Failed', class: 'status-failed' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span className={`status-badge ${config.class}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="payment-detail-page">
        <div className="payment-container">
          <div className="loading">Loading payment details...</div>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="payment-detail-page">
        <div className="payment-container">
          <div className="error-message">
            {error || 'Payment not found'}
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-detail-page">
      <div className="payment-container">
        <div className="payment-header-section">
          <h1>Complete Your Payment</h1>
          <p className="payment-subtitle">Secure cryptocurrency payment via BTCPay Server</p>
        </div>
        
        <div className="payment-info-card">
          <div className="payment-summary">
            <div className="payment-amount-large">
              <span className="currency-symbol">$</span>
              <span className="amount-value">{payment.amount.toFixed(2)}</span>
              <span className="currency-code">{payment.currency}</span>
            </div>
            <div className="payment-status-section">
              <span className="status-label">Payment Status</span>
              {getStatusBadge(payment.status)}
            </div>
          </div>

          <div className="payment-content">
            {payment.status === 'PENDING' && (
              <>
                <div className="payment-method-card crypto-payment">
                  <div className="method-header">
                    <div className="method-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="method-info">
                      <h3>Pay with Cryptocurrency</h3>
                      <p>Bitcoin, Lightning Network, and other supported cryptocurrencies</p>
                    </div>
                  </div>
                  <div className="method-features">
                    <div className="feature-item">
                      <span className="feature-icon">✓</span>
                      <span>No KYC required</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">✓</span>
                      <span>Blockchain confirmation</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">✓</span>
                      <span>Secure and private</span>
                    </div>
                  </div>
                  <a
                    href={payment.btcpayCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary btn-large"
                  >
                    <span>Open Payment Portal</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                </div>

                <div className="divider">
                  <span>OR</span>
                </div>

                <div className="payment-method-card card-payment">
                  <div className="method-header">
                    <div className="method-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="method-info">
                      <h3>Buy Cryptocurrency with Card</h3>
                      <p>Purchase crypto instantly with your credit or debit card</p>
                    </div>
                  </div>
                  <div className="method-features">
                    <div className="feature-item">
                      <span className="feature-icon">✓</span>
                      <span>Credit and debit cards accepted</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">✓</span>
                      <span>Trusted exchange partners</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">✓</span>
                      <span>Competitive fees</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOnRamp(true)}
                    className="btn-secondary btn-large"
                  >
                    <span>Buy Crypto with Card</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <p className="method-note">
                    After purchasing, send the crypto to your BTCPay invoice address to complete payment
                  </p>
                </div>
              </>
            )}

            {payment.status === 'CONFIRMED' && (
              <div className="status-message success">
                <div className="status-icon success-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Payment Confirmed!</h3>
                <p>Your payment has been successfully confirmed and your account balance has been updated.</p>
                <p className="redirect-note">Redirecting to dashboard...</p>
              </div>
            )}

            {payment.status === 'PAID' && (
              <div className="status-message info">
                <div className="status-icon info-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3>Payment Received</h3>
                <p>Your payment has been received and is waiting for blockchain confirmation.</p>
                <p className="info-note">This usually takes a few minutes. We'll update you automatically when confirmed.</p>
              </div>
            )}

            {payment.status === 'EXPIRED' && (
              <div className="status-message error">
                <div className="status-icon error-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3>Payment Expired</h3>
                <p>This payment invoice has expired. Please create a new payment to continue.</p>
                <button onClick={() => navigate('/checkout')} className="btn-primary">
                  Create New Payment
                </button>
              </div>
            )}

            {payment.status === 'FAILED' && (
              <div className="status-message error">
                <div className="status-icon error-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3>Payment Failed</h3>
                <p>This payment could not be processed. Please try again or contact support if the issue persists.</p>
                <button onClick={() => navigate('/checkout')} className="btn-primary">
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        {showOnRamp && (
          <OnRampWidget
            onClose={() => setShowOnRamp(false)}
            amount={payment.amount}
            currency={payment.currency}
          />
        )}
      </div>
    </div>
  );
};

export default PaymentDetail;

