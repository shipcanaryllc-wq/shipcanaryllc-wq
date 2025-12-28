import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import OnRampWidget from './OnRampWidget';
import './PaymentDetail.css';
import API_BASE_URL from '../../config/api';
import { Shield, Lock, Code, Eye } from 'lucide-react';

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
        `${API_BASE_URL}/payments/${paymentId}`,
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
        {/* Header Section */}
        <div className="payment-header-section">
          <h1>Complete Bitcoin Payment</h1>
          <p className="payment-subtitle">Secure Bitcoin payment processed via BTCPay Server</p>
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
              {(payment.status === 'PENDING' || payment.status === 'PAID') && (
                <p className="status-helper-text">
                  Bitcoin payments typically take 5–10 minutes to confirm.
                  Your ShipCanary balance will update automatically once the network confirmation is received.
                </p>
              )}
            </div>
          </div>

          <div className="payment-content">
            {payment.status === 'PENDING' && (
              <>
                {/* Primary Payment Option - Bitcoin */}
                <div className="payment-method-card bitcoin-payment">
                  <div className="method-header">
                    <div className="method-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M9.5 8.5C9.5 7.67 10.17 7 11 7H13C13.83 7 14.5 7.67 14.5 8.5C14.5 9.33 13.83 10 13 10H11C10.17 10 9.5 9.33 9.5 8.5Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <path d="M9.5 15.5C9.5 14.67 10.17 14 11 14H13C13.83 14 14.5 14.67 14.5 15.5C14.5 16.33 13.83 17 13 17H11C10.17 17 9.5 16.33 9.5 15.5Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <path d="M12 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="method-info">
                      <h3>Pay with Bitcoin</h3>
                      <p>Send Bitcoin directly to the invoice address using your wallet or exchange.</p>
                    </div>
                  </div>
                  <div className="method-features">
                    <div className="feature-item">
                      <span className="feature-icon">✓</span>
                      <span>Bitcoin-only</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">✓</span>
                      <span>On-chain confirmation</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">✓</span>
                      <span>Non-custodial, secure settlement</span>
                    </div>
                  </div>
                  <a
                    href={payment.btcpayCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary btn-bitcoin"
                  >
                    <span>Open Bitcoin Payment Portal</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                </div>

                <div className="divider">
                  <span>OR</span>
                </div>

                {/* Secondary Option - Buy Bitcoin with Card */}
                <div className="payment-method-card card-payment">
                  <div className="method-header">
                    <div className="method-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="method-info">
                      <h3>Buy Bitcoin with Card (External Exchanges)</h3>
                      <p>If you don't already have Bitcoin, you can purchase it through a trusted exchange and send it to the invoice address.</p>
                    </div>
                  </div>
                  <div className="method-features">
                    <div className="feature-item">
                      <span className="feature-icon">✓</span>
                      <span>Trusted exchange partners</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">✓</span>
                      <span>Credit and debit cards accepted</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">✓</span>
                      <span>Secure identity verification</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOnRamp(true)}
                    className="btn-secondary btn-large"
                  >
                    <span>Select Exchange</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <p className="method-note">
                    After purchasing Bitcoin, return here and send it to the BTCPay invoice address to complete payment.
                  </p>
                </div>

                {/* Security & Transparency Section */}
                <div className="security-section">
                  <h3 className="security-title">Security & Transparency</h3>
                  <div className="security-grid">
                    <div className="security-item">
                      <Shield size={20} className="security-icon" />
                      <div className="security-content">
                        <h4>Non-Custodial Payments</h4>
                        <p>Bitcoin payments are non-custodial. ShipCanary never holds your Bitcoin.</p>
                      </div>
                    </div>
                    <div className="security-item">
                      <Code size={20} className="security-icon" />
                      <div className="security-content">
                        <h4>Open-Source Infrastructure</h4>
                        <p>BTCPay Server is open-source and self-hosted. No third-party payment processors.</p>
                      </div>
                    </div>
                    <div className="security-item">
                      <Lock size={20} className="security-icon" />
                      <div className="security-content">
                        <h4>No Stored Credentials</h4>
                        <p>We do not store payment credentials or sensitive financial information.</p>
                      </div>
                    </div>
                    <div className="security-item">
                      <Eye size={20} className="security-icon" />
                      <div className="security-content">
                        <h4>No KYC Required</h4>
                        <p>ShipCanary does not perform KYC verification. Payments are processed directly via BTCPay.</p>
                      </div>
                    </div>
                  </div>
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
                <p className="info-note">Bitcoin payments typically take 5–10 minutes to confirm. We'll update you automatically when confirmed.</p>
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
