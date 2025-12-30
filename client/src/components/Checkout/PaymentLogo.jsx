import React from 'react';
import './PaymentLogos.css';

/**
 * PaymentLogo - Reusable payment logo component
 * Ensures consistent sizing, no distortion, and professional styling
 * 
 * @param {string} name - Logo name (e.g., "Visa", "Mastercard")
 * @param {ReactNode} children - SVG or image content
 * @param {string} title - Tooltip text
 * @param {string} ariaLabel - Accessibility label
 */
const PaymentLogo = ({ name, children, title, ariaLabel }) => {
  return (
    <div 
      className="payment-logo-wrapper" 
      title={title || name}
      aria-label={ariaLabel || name}
      role="img"
    >
      <div className="payment-logo-inner">
        {children}
      </div>
    </div>
  );
};

export default PaymentLogo;
