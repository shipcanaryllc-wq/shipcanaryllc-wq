import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import OnRampWidget from './OnRampWidget';
import PaymentLogos from '../PaymentLogos/PaymentLogos';
import './PaymentDetail.css';
import API_BASE_URL from '../../config/api';
import { Shield, Lock, Code, FileText } from 'lucide-react';
import BitcoinLogo from '../BitcoinLogo/BitcoinLogo';

const PaymentDetail = () => {
  const [searchParams] = useSearchParams();
  // Read invoiceId from URL query params (paymentId is stored as invoiceId in URL)
  const invoiceId = searchParams.get('invoiceId');
  const { user, loading: authLoading, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOnRamp, setShowOnRamp] = useState(false);
  const [polling, setPolling] = useState(true);

  const fetchPayment = useCallback(async (silent = false) => {
    if (!invoiceId) {
      if (!silent) {
        setError('Payment ID is required');
        setLoading(false);
      }
      return;
    }

    try {
      // Fetch payment details from server using invoiceId (which is actually paymentId)
      const response = await axios.get(
        `${API_BASE_URL}/payments/${invoiceId}`,
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
        if (error.response?.status === 401) {
          // Auth error - redirect to login
          navigate('/login');
        } else {
        setError(error.response?.data?.message || 'Failed to load payment');
        setLoading(false);
      }
    }
    }
  }, [invoiceId, navigate, fetchUser]);

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) {
      return;
    }

    // Check auth - redirect to login if not authenticated
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if invoiceId exists in URL
    if (!invoiceId) {
      setError('Payment ID is required. Please create a payment from the Add Balance page.');
      setLoading(false);
      return;
    }

    fetchPayment();
    
    // Set up polling if payment is pending
    let pollInterval;
    if (polling && invoiceId) {
      pollInterval = setInterval(() => {
        fetchPayment(true); // Silent fetch
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [invoiceId, user, authLoading, polling, fetchPayment, navigate]);

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

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <div className="payment-detail-page">
        <div className="payment-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  // Check if invoiceId is missing
  if (!invoiceId) {
    return (
      <div className="payment-detail-page">
        <div className="payment-container">
          <div className="error-message">
            Payment ID is required. Please create a payment from the Add Balance page.
          </div>
          <button onClick={() => navigate('/dashboard?tab=balance')} className="btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

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
          <button onClick={() => navigate('/dashboard?tab=balance')} className="btn-secondary">
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
          <div className="header-icon-wrapper">
            <BitcoinLogo size={32} className="bitcoin-logo-header" />
          </div>
          <h1>Bitcoin Payment</h1>
          <p className="payment-subtitle">Secure payment processing</p>
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
                  Confirmations usually take 5–10 minutes.
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
                      <BitcoinLogo size={24} />
                    </div>
                    <div className="method-info">
                      <h3>Pay with Bitcoin</h3>
                      <p>If you already have Bitcoin, send it directly to complete your payment using your wallet or exchange.</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (payment.btcpayCheckoutUrl) {
                        window.open(payment.btcpayCheckoutUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="btn-primary btn-bitcoin"
                  >
                    <span>Open Bitcoin Payment Portal</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                <div className="divider">
                  <span>OR</span>
                </div>

                {/* Secondary Option - Buy Bitcoin with Card */}
                <div className="payment-method-card card-payment">
                  <div className="method-header">
                    <div className="method-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="method-info">
                      <h3>Buy Bitcoin with Credit or Debit Card</h3>
                      <p>Don't already have Bitcoin? You can instantly purchase it using your credit or debit card through a trusted exchange.</p>
                      <PaymentLogos />
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
                  
                  {/* How payment works - directly below exchange button */}
                  <div className="payment-instructions">
                    <h4>How payment works</h4>
                    <ol className="instructions-list">
                      <li>Choose a trusted exchange to buy Bitcoin using your credit or debit card.</li>
                      <li>Complete your purchase on the exchange.</li>
                      <li>Return here and open the Bitcoin Payment Portal above.</li>
                      <li>Complete your payment with Bitcoin.</li>
                    </ol>
                  </div>
                </div>

                {/* Secure & Encrypted Payments Section */}
                <div className="security-section">
                  <h3 className="security-title">Secure & Encrypted Payments</h3>
                  <div className="security-grid">
                    <div className="security-item">
                      <Code size={20} className="security-icon" />
                      <div className="security-content">
                        <h4>BTCPay Server</h4>
                        <p>Open-source payment processor hosted on our infrastructure.</p>
                      </div>
                    </div>
                    <div className="security-item">
                      <Shield size={20} className="security-icon" />
                      <div className="security-content">
                        <h4>Payments verified on-chain</h4>
                        <p>All transactions are confirmed on the Bitcoin blockchain.</p>
                      </div>
                    </div>
                    <div className="security-item">
                      <FileText size={20} className="security-icon" />
                      <div className="security-content">
                        <h4>Invoice-based checkout</h4>
                        <p>Each payment uses a unique, time-limited invoice address.</p>
                      </div>
                    </div>
                    <div className="security-item">
                      <Lock size={20} className="security-icon" />
                      <div className="security-content">
                        <h4>No stored payment credentials</h4>
                        <p>We do not store payment credentials or sensitive financial information.</p>
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
