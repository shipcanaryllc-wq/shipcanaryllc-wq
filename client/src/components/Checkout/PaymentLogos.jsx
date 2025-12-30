import React from 'react';
import PaymentLogo from './PaymentLogo';
import './PaymentLogos.css';

/**
 * PaymentLogos - Professional payment method logos
 * Consistent sizing, no distortion, grayscale with color on hover
 */
const PaymentLogos = () => {
  return (
    <div className="payment-logos-container">
      <div className="payment-logos-row">
        {/* Mastercard Logo */}
        <PaymentLogo name="Mastercard" title="Mastercard" ariaLabel="Mastercard">
          <svg 
            viewBox="0 0 90 35" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="payment-logo-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Red circle */}
            <circle cx="30" cy="12" r="11" fill="#EB001B" className="mastercard-red"/>
            {/* Orange circle */}
            <circle cx="50" cy="12" r="11" fill="#F79E1B" className="mastercard-orange"/>
            {/* Overlapping area */}
            <path d="M40 1c-3.3 2.5-5.5 6.4-5.5 10.9s2.2 8.4 5.5 10.9c3.3-2.5 5.5-6.4 5.5-10.9S43.3 3.5 40 1z" fill="#FF5F00" className="mastercard-overlap"/>
            {/* MasterCard text below in white */}
            <text 
              x="45" 
              y="30" 
              fontFamily="Arial, sans-serif" 
              fontSize="7" 
              fontWeight="600" 
              fill="#FFFFFF" 
              textAnchor="middle" 
              className="mastercard-text"
            >
              MasterCard
            </text>
            {/* Registered trademark symbol */}
            <circle cx="68" cy="26" r="2.5" fill="#FFFFFF" className="mastercard-tm-circle"/>
            <text 
              x="68" 
              y="27.5" 
              fontFamily="Arial, sans-serif" 
              fontSize="3.5" 
              fill="#000000" 
              textAnchor="middle"
              className="mastercard-tm"
            >
              ®
            </text>
          </svg>
        </PaymentLogo>

        {/* Visa Logo */}
        <PaymentLogo name="Visa" title="Visa" ariaLabel="Visa">
          <svg 
            viewBox="0 0 90 28" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="payment-logo-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Gold stripe */}
            <rect x="0" y="10" width="90" height="8" fill="#F7B600" className="visa-gold-stripe"/>
            {/* Dark blue top stripe */}
            <rect x="0" y="0" width="90" height="3" fill="#1434CB" className="visa-blue-top"/>
            {/* Dark blue bottom stripe */}
            <rect x="0" y="25" width="90" height="3" fill="#1434CB" className="visa-blue-bottom"/>
            {/* VISA text */}
            <text 
              x="45" 
              y="20" 
              fontFamily="Arial, sans-serif" 
              fontSize="22" 
              fontWeight="700" 
              fill="#1434CB" 
              textAnchor="middle" 
              letterSpacing="2"
              className="visa-text"
            >
              VISA
            </text>
          </svg>
        </PaymentLogo>

        {/* American Express Logo */}
        <PaymentLogo name="American Express" title="American Express" ariaLabel="American Express">
          <svg 
            viewBox="0 0 90 28" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="payment-logo-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <rect width="90" height="28" rx="3" fill="#006FCF" className="amex-bg"/>
            <text 
              x="45" 
              y="11" 
              fontFamily="Arial, sans-serif" 
              fontSize="6.5" 
              fontWeight="700" 
              fill="#FFFFFF" 
              textAnchor="middle" 
              letterSpacing="1.2"
              className="amex-text"
            >
              AMERICAN
            </text>
            <text 
              x="45" 
              y="21" 
              fontFamily="Arial, sans-serif" 
              fontSize="6.5" 
              fontWeight="700" 
              fill="#FFFFFF" 
              textAnchor="middle" 
              letterSpacing="1.2"
              className="amex-text"
            >
              EXPRESS
            </text>
          </svg>
        </PaymentLogo>
      </div>
    </div>
  );
};

export default PaymentLogos;
