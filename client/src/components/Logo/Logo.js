import React from 'react';
import './Logo.css';

const Logo = ({ size = 'medium', showText = false, className = '' }) => {
  const sizeClasses = {
    small: 'logo-small',
    medium: 'logo-medium',
    large: 'logo-large'
  };

  return (
    <div className={`logo-container ${sizeClasses[size]} ${className}`}>
      <div className="logo-icon">
        <img 
          src="/logo.png" 
          alt="ShipCanary Logo" 
          className="logo-image"
        />
      </div>
      {showText && (
        <span className="logo-text">CANARY</span>
      )}
    </div>
  );
};

export default Logo;
