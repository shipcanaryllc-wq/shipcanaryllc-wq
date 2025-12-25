import React from 'react';

/**
 * Integration Logo Component
 * Loads logo from /public/integrations/
 * No fallback - logos must exist
 */
const IntegrationLogo = ({ logoSrc, name, size = 32, className = '' }) => {
  return (
    <img
      src={logoSrc}
      alt={`${name} logo`}
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: 'contain',
        display: 'block',
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    />
  );
};

export default IntegrationLogo;

