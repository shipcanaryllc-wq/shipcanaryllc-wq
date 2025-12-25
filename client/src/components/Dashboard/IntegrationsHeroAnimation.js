import React from 'react';
import IntegrationLogo from './IntegrationLogo';
import './IntegrationsHeroAnimation.css';

const IntegrationsHeroAnimation = ({ integrations = [] }) => {
  // Create platform positions in a circle
  const platforms = integrations.slice(0, 6).map((integration, index) => {
    const angle = (index * 60) * (Math.PI / 180); // 60 degrees apart
    return {
      ...integration,
      angle: index * 60,
      angleRad: angle
    };
  });

  return (
    <div className="hero-animation-container">
      <div className="hero-animation-wrapper">
        {/* SVG Container for Connection Lines */}
        <svg className="connections-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ff6b35" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {platforms.map((platform, index) => {
            const angleRad = platform.angleRad;
            const radius = 35;
            const centerX = 50;
            const centerY = 50;
            const x = centerX + radius * Math.cos(angleRad);
            const y = centerY + radius * Math.sin(angleRad);

            return (
              <line
                key={`line-${platform.id}`}
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke="url(#lineGradient)"
                strokeWidth="0.5"
                strokeDasharray="1 1"
                className="connection-line"
                style={{
                  '--delay': `${index * 0.1}s`
                }}
              />
            );
          })}
        </svg>

        {/* Central ShipCanary Node */}
        <div className="central-node">
          <div className="central-node-glow"></div>
          <div className="central-node-content">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="#ff6b35"/>
              <path d="M8 10h8v1H8v-1zm0 2.5h8v1H8v-1.5z" fill="white"/>
            </svg>
            <span className="central-node-text">ShipCanary</span>
          </div>
        </div>

        {/* Platform Nodes */}
        {platforms.map((platform, index) => {
          const angleRad = platform.angleRad;
          const radius = 35;
          const centerX = 50;
          const centerY = 50;
          const x = centerX + radius * Math.cos(angleRad);
          const y = centerY + radius * Math.sin(angleRad);

          return (
            <div
              key={platform.id}
              className="platform-node"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                '--delay': `${index * 0.15}s`
              }}
            >
              <div className="platform-node-content">
                <IntegrationLogo
                  logoSrc={platform.logoSrc}
                  name={platform.name}
                  size={36}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IntegrationsHeroAnimation;
