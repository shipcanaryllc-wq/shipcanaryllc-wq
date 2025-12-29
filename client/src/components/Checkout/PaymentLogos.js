import React from 'react';
import './PaymentLogos.css';

/**
 * PaymentLogos - Displays supported payment method logos
 * Shows Mastercard, Visa, American Express, and Discover
 */
const PaymentLogos = () => {
  return (
    <div className="payment-logos-container">
      <div className="payment-logos-row">
        {/* Visa Logo */}
        <div className="payment-logo-wrapper" title="Visa" aria-label="Visa">
          <svg 
            viewBox="0 0 90 28" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="payment-logo-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Orange-yellow accent chevron on the V */}
            <path 
              d="M 8 4 L 8 10 L 14 20 L 18 20 L 12 10 L 12 4 Z" 
              fill="#F7B600"
            />
            <text 
              x="45" 
              y="20" 
              fontFamily="Arial, sans-serif" 
              fontSize="18" 
              fontWeight="700" 
              fill="#1434CB" 
              textAnchor="middle" 
              letterSpacing="2"
              style={{ fontStyle: 'italic' }}
            >
              VISA
            </text>
          </svg>
        </div>

        {/* Mastercard Logo - Old version */}
        <div className="payment-logo-wrapper" title="Mastercard" aria-label="Mastercard">
          <svg 
            viewBox="0 0 75 28" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="payment-logo-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <circle cx="25" cy="14" r="11" fill="#EB001B"/>
            <circle cx="50" cy="14" r="11" fill="#F79E1B"/>
            <circle cx="37.5" cy="14" r="10" fill="#FF5F00"/>
            <text x="37.5" y="11" fontFamily="Arial, sans-serif" fontSize="6" fontWeight="600" fill="white" textAnchor="middle" letterSpacing="0.3">Master</text>
            <text x="37.5" y="19" fontFamily="Arial, sans-serif" fontSize="6" fontWeight="600" fill="white" textAnchor="middle" letterSpacing="0.3">Card</text>
          </svg>
        </div>

        {/* American Express Logo */}
        <div className="payment-logo-wrapper" title="American Express" aria-label="American Express">
          <svg 
            viewBox="0 0 85 28" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="payment-logo-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <rect width="85" height="28" rx="3" fill="#006FCF"/>
            <text x="42.5" y="11" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="700" fill="white" textAnchor="middle" letterSpacing="1">AMERICAN</text>
            <text x="42.5" y="20" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="700" fill="white" textAnchor="middle" letterSpacing="1">EXPRESS</text>
          </svg>
        </div>

        {/* Generic Credit Card Icon */}
        <div className="payment-logo-wrapper" title="Credit Card" aria-label="Credit Card">
          <svg 
            viewBox="0 0 60 28" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="payment-logo-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <rect width="60" height="28" rx="3" fill="#4A5568"/>
            <rect x="0" y="4" width="60" height="6" fill="white"/>
            <rect x="8" y="16" width="12" height="2" fill="white"/>
            <rect x="24" y="16" width="12" height="2" fill="white"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default PaymentLogos;

