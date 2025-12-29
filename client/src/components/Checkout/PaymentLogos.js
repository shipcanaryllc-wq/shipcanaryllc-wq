import React from 'react';
import './PaymentLogos.css';

/**
 * PaymentLogos - Clean, neutral, monochrome payment card logos
 * All logos share the same height and preserve aspect ratio
 */
const PaymentLogos = () => {
  return (
    <div className="payment-logos-container">
      <div className="payment-logos-row">
        {/* Visa-style text mark */}
        <div className="payment-logo-wrapper" title="Visa" aria-label="Visa">
          <svg 
            viewBox="0 0 80 30" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="payment-logo-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <text 
              x="40" 
              y="22" 
              fontFamily="Arial, sans-serif" 
              fontSize="20" 
              fontWeight="700" 
              fill="#333333" 
              textAnchor="middle" 
              letterSpacing="2"
            >
              VISA
            </text>
          </svg>
        </div>

        {/* Mastercard-style: two overlapping circles */}
        <div className="payment-logo-wrapper" title="Mastercard" aria-label="Mastercard">
          <svg 
            viewBox="0 0 60 40" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="payment-logo-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <circle cx="20" cy="20" r="15" fill="#666666" opacity="0.6"/>
            <circle cx="40" cy="20" r="15" fill="#666666" opacity="0.6"/>
            <circle cx="30" cy="20" r="14" fill="#333333"/>
          </svg>
        </div>

        {/* AMEX-style: credit card shape with text */}
        <div className="payment-logo-wrapper" title="American Express" aria-label="American Express">
          <svg 
            viewBox="0 0 64 40" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="payment-logo-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <rect width="64" height="40" rx="3" fill="#333333"/>
            <text x="32" y="16" fontFamily="Arial, sans-serif" fontSize="6" fontWeight="700" fill="#ffffff" textAnchor="middle" letterSpacing="0.4">AMERICAN</text>
            <text x="32" y="28" fontFamily="Arial, sans-serif" fontSize="6" fontWeight="700" fill="#ffffff" textAnchor="middle" letterSpacing="0.4">EXPRESS</text>
          </svg>
        </div>

        {/* Generic credit card icon - credit card shape */}
        <div className="payment-logo-wrapper" title="Credit Card" aria-label="Credit Card">
          <svg 
            viewBox="0 0 64 40" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="payment-logo-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <rect width="64" height="40" rx="3" stroke="#333333" strokeWidth="1.5" fill="none"/>
            <rect x="8" y="10" width="48" height="4" fill="#666666"/>
            <rect x="8" y="24" width="18" height="2.5" fill="#666666"/>
            <rect x="30" y="24" width="18" height="2.5" fill="#666666"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default PaymentLogos;

