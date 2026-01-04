import React, { useEffect, useRef, useState } from 'react';
import './HeroAnimation.css';

const HeroAnimation = () => {
  const containerRef = useRef(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="hero-animation-container" ref={containerRef}>
      <svg
        className="hero-animation-svg"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Globe gradient */}
          <radialGradient id="globeGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#f8f9fa" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#e9ecef" stopOpacity="0.3" />
          </radialGradient>

          {/* Orange accent gradient */}
          <radialGradient id="orangeGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
          </radialGradient>

          {/* Node glow */}
          <radialGradient id="nodeGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
          </radialGradient>

          {/* Subtle shadow filter */}
          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background subtle glow */}
        <circle
          cx="200"
          cy="200"
          r="180"
          fill="url(#orangeGlow)"
          className={prefersReducedMotion ? '' : 'glow-pulse'}
        />

        {/* Orbital arcs */}
        <g className={prefersReducedMotion ? '' : 'orbital-arcs'}>
          <path
            d="M 200 200 m -120 0 a 120 120 0 1 1 240 0"
            fill="none"
            stroke="rgba(255, 107, 53, 0.15)"
            strokeWidth="1"
            strokeDasharray="2 4"
            className="arc-1"
          />
          <path
            d="M 200 200 m -140 0 a 140 140 0 1 1 280 0"
            fill="none"
            stroke="rgba(255, 107, 53, 0.12)"
            strokeWidth="0.8"
            strokeDasharray="1.5 3"
            className="arc-2"
          />
          <path
            d="M 200 200 m -100 0 a 100 100 0 1 1 200 0"
            fill="none"
            stroke="rgba(255, 107, 53, 0.1)"
            strokeWidth="0.6"
            strokeDasharray="1 2"
            className="arc-3"
          />
        </g>

        {/* Globe container with parallax */}
        <g className={prefersReducedMotion ? '' : 'globe-parallax'}>
          {/* Globe sphere */}
          <circle
            cx="200"
            cy="200"
            r="80"
            fill="url(#globeGradient)"
            stroke="rgba(255, 107, 53, 0.2)"
            strokeWidth="0.5"
            filter="url(#softShadow)"
            className="globe-sphere"
          />

          {/* Latitude lines */}
          <ellipse
            cx="200"
            cy="200"
            rx="80"
            ry="25"
            fill="none"
            stroke="rgba(255, 107, 53, 0.15)"
            strokeWidth="0.5"
            className="lat-line lat-1"
          />
          <ellipse
            cx="200"
            cy="200"
            rx="80"
            ry="45"
            fill="none"
            stroke="rgba(255, 107, 53, 0.12)"
            strokeWidth="0.4"
            className="lat-line lat-2"
          />
          <ellipse
            cx="200"
            cy="200"
            rx="80"
            ry="65"
            fill="none"
            stroke="rgba(255, 107, 53, 0.1)"
            strokeWidth="0.3"
            className="lat-line lat-3"
          />

          {/* Longitude lines */}
          <line
            x1="200"
            y1="120"
            x2="200"
            y2="280"
            stroke="rgba(255, 107, 53, 0.15)"
            strokeWidth="0.5"
            className="long-line long-1"
          />
          <line
            x1="120"
            y1="200"
            x2="280"
            y2="200"
            stroke="rgba(255, 107, 53, 0.15)"
            strokeWidth="0.5"
            className="long-line long-2"
          />

          {/* Dot grid overlay */}
          <g className="dot-grid">
            {[...Array(8)].map((_, i) => {
              const angle = (i * Math.PI * 2) / 8;
              const radius = 70;
              const x = 200 + Math.cos(angle) * radius;
              const y = 200 + Math.sin(angle) * radius;
              return (
                <circle
                  key={`dot-${i}`}
                  cx={x}
                  cy={y}
                  r="1.5"
                  fill="rgba(255, 107, 53, 0.2)"
                  className="grid-dot"
                />
              );
            })}
          </g>
        </g>

        {/* Orbital nodes with pulsing glow */}
        <g className={prefersReducedMotion ? '' : 'orbital-nodes'}>
          {[0, 1, 2, 3].map((i) => {
            const angle = (i * Math.PI * 2) / 4;
            const radius = 110;
            const x = 200 + Math.cos(angle) * radius;
            const y = 200 + Math.sin(angle) * radius;
            return (
              <g key={`node-${i}`} className={`node-group node-${i}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="url(#nodeGlow)"
                  className="node-glow"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#ff6b35"
                  className="node-core"
                />
              </g>
            );
          })}
        </g>

          {/* Canary orbiting */}
          <g className={prefersReducedMotion ? '' : 'canary-orbit'}>
            <g className="canary-group">
              {/* Canary silhouette - simplified premium style */}
              <g className="canary-shape">
                {/* Canary body */}
                <ellipse
                  cx="0"
                  cy="0"
                  rx="10"
                  ry="7"
                  fill="#fbbf24"
                  className="canary-body"
                />
                {/* Canary head */}
                <circle cx="-3" cy="-5" r="5" fill="#fbbf24" className="canary-head" />
                {/* Canary wing - subtle */}
                <ellipse
                  cx="2"
                  cy="1"
                  rx="7"
                  ry="4"
                  fill="#f59e0b"
                  fillOpacity="0.8"
                  className="canary-wing"
                />
                {/* Canary tail - minimal */}
                <path
                  d="M 7 0 L 12 -3 L 12 3 Z"
                  fill="#f59e0b"
                  fillOpacity="0.9"
                  className="canary-tail"
                />
                {/* Canary beak - small */}
                <path
                  d="M -7 -5 L -10 -3.5 L -7 -2 Z"
                  fill="#f59e0b"
                  className="canary-beak"
                />
                {/* Canary eye - minimal */}
                <circle cx="-1.5" cy="-5" r="1" fill="#000" fillOpacity="0.8" className="canary-eye" />
              </g>
            </g>
          </g>
      </svg>
    </div>
  );
};

export default HeroAnimation;

