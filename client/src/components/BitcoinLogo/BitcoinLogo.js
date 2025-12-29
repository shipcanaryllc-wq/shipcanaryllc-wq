import React from 'react';
import './BitcoinLogo.css';

/**
 * Bitcoin Logo Component
 * Displays the official Bitcoin logo (orange circle with white B symbol)
 */
const BitcoinLogo = ({ size = 24, className = '', style = {} }) => {
  const sizeStyles = {
    width: `${size}px`,
    height: `${size}px`,
    ...style
  };

  return (
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg"
      alt="Bitcoin"
      className={`bitcoin-logo ${className}`}
      style={sizeStyles}
    />
  );
};

export default BitcoinLogo;

