import React, { useEffect, useState } from 'react';
import './HeroLogisticsAnimation.css';

const HeroLogisticsAnimation = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Define routing paths (start, end, control points)
  const routes = [
    { id: 'route-1', path: 'M 100 200 Q 150 150 200 120 Q 250 150 300 200', duration: 8 },
    { id: 'route-2', path: 'M 100 200 Q 150 250 200 280 Q 250 250 300 200', duration: 9 },
    { id: 'route-3', path: 'M 200 100 Q 250 150 300 200 Q 250 250 200 300 Q 150 250 100 200 Q 150 150 200 100', duration: 10 },
  ];

  // Node positions along routes
  const nodes = [
    { id: 'node-1', x: 150, y: 175, route: 'route-1', position: 0.3 },
    { id: 'node-2', x: 200, y: 120, route: 'route-1', position: 0.5 },
    { id: 'node-3', x: 250, y: 175, route: 'route-1', position: 0.7 },
    { id: 'node-4', x: 150, y: 225, route: 'route-2', position: 0.3 },
    { id: 'node-5', x: 200, y: 280, route: 'route-2', position: 0.5 },
    { id: 'node-6', x: 250, y: 225, route: 'route-2', position: 0.7 },
  ];

  return (
    <div className="hero-logistics-container">
      <svg
        className="hero-logistics-svg"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle shadow for boxes */}
          <filter id="boxShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="1" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.15" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Node activation glow */}
          <radialGradient id="nodeActive" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#ff6b35" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
          </radialGradient>

          {/* Node inactive */}
          <radialGradient id="nodeInactive" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#9ca3af" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#9ca3af" stopOpacity="0" />
          </radialGradient>

          {/* Route path gradient */}
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6b35" stopOpacity="0" />
            <stop offset="50%" stopColor="#ff6b35" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
          </linearGradient>

          {/* Canary trail */}
          <linearGradient id="canaryTrail" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Central Hub/Globe - minimal glassy sphere */}
        <g className="network-hub">
          <circle
            cx="200"
            cy="200"
            r="60"
            fill="none"
            stroke="rgba(156, 163, 175, 0.2)"
            strokeWidth="0.5"
            className="hub-outline"
          />
          <circle
            cx="200"
            cy="200"
            r="50"
            fill="rgba(249, 250, 251, 0.6)"
            stroke="rgba(156, 163, 175, 0.15)"
            strokeWidth="0.5"
            className="hub-core"
          />
          {/* Subtle grid lines */}
          <line x1="200" y1="150" x2="200" y2="250" stroke="rgba(156, 163, 175, 0.1)" strokeWidth="0.5" />
          <line x1="150" y1="200" x2="250" y2="200" stroke="rgba(156, 163, 175, 0.1)" strokeWidth="0.5" />
          <ellipse cx="200" cy="200" rx="50" ry="20" fill="none" stroke="rgba(156, 163, 175, 0.08)" strokeWidth="0.5" />
        </g>

        {/* Routing Paths */}
        <g className="routing-paths">
          {routes.map((route) => (
            <g key={route.id} className="route-group">
              {/* Base path (dashed) */}
              <path
                d={route.path}
                fill="none"
                stroke="rgba(156, 163, 175, 0.15)"
                strokeWidth="1"
                strokeDasharray="3 3"
                className="route-base"
              />
              {/* Active path indicator (animated gradient) */}
              <path
                d={route.path}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="1.5"
                className={`route-active ${prefersReducedMotion ? '' : 'route-pulse'}`}
                style={{ '--duration': `${route.duration}s` }}
              />
            </g>
          ))}
        </g>

        {/* Network Nodes */}
        <g className="network-nodes">
          {nodes.map((node, index) => (
            <g key={node.id} className={`node-wrapper node-${index + 1}`}>
              {/* Node glow (activates when box passes) */}
              <circle
                cx={node.x}
                cy={node.y}
                r="12"
                fill="url(#nodeInactive)"
                className={`node-glow ${prefersReducedMotion ? '' : 'node-pulse'}`}
                style={{ '--delay': `${index * 0.5}s` }}
              />
              {/* Node core */}
              <circle
                cx={node.x}
                cy={node.y}
                r="3"
                fill="#9ca3af"
                className="node-core"
              />
            </g>
          ))}
        </g>

        {/* Delivery Boxes - Isometric style */}
        <g className="delivery-boxes">
          {/* Box 1 - Route 1 */}
          <g className={`box-container box-1 ${prefersReducedMotion ? '' : 'box-move-1'}`}>
            <g className="isometric-box">
              {/* Box shadow */}
              <path
                d="M 0 0 L 8 4 L 8 24 L 0 20 Z"
                fill="rgba(0, 0, 0, 0.08)"
                className="box-shadow"
              />
              {/* Box top */}
              <path
                d="M 0 0 L 8 4 L 16 0 L 8 -4 Z"
                fill="#f3f4f6"
                stroke="rgba(156, 163, 175, 0.2)"
                strokeWidth="0.5"
                className="box-top"
              />
              {/* Box front */}
              <path
                d="M 0 0 L 0 20 L 8 24 L 8 4 Z"
                fill="#ffffff"
                stroke="rgba(156, 163, 175, 0.25)"
                strokeWidth="0.5"
                className="box-front"
                filter="url(#boxShadow)"
              />
              {/* Box side */}
              <path
                d="M 8 4 L 16 0 L 16 20 L 8 24 Z"
                fill="#f9fafb"
                stroke="rgba(156, 163, 175, 0.2)"
                strokeWidth="0.5"
                className="box-side"
              />
              {/* Shipping label indicator */}
              <rect x="2" y="6" width="4" height="3" fill="rgba(255, 107, 53, 0.3)" className="label-indicator" />
            </g>
          </g>

          {/* Box 2 - Route 2 */}
          <g className={`box-container box-2 ${prefersReducedMotion ? '' : 'box-move-2'}`}>
            <g className="isometric-box">
              <path d="M 0 0 L 8 4 L 8 24 L 0 20 Z" fill="rgba(0, 0, 0, 0.08)" className="box-shadow" />
              <path d="M 0 0 L 8 4 L 16 0 L 8 -4 Z" fill="#f3f4f6" stroke="rgba(156, 163, 175, 0.2)" strokeWidth="0.5" className="box-top" />
              <path d="M 0 0 L 0 20 L 8 24 L 8 4 Z" fill="#ffffff" stroke="rgba(156, 163, 175, 0.25)" strokeWidth="0.5" className="box-front" filter="url(#boxShadow)" />
              <path d="M 8 4 L 16 0 L 16 20 L 8 24 Z" fill="#f9fafb" stroke="rgba(156, 163, 175, 0.2)" strokeWidth="0.5" className="box-side" />
              <rect x="2" y="6" width="4" height="3" fill="rgba(255, 107, 53, 0.3)" className="label-indicator" />
            </g>
          </g>

          {/* Box 3 - Route 3 */}
          <g className={`box-container box-3 ${prefersReducedMotion ? '' : 'box-move-3'}`}>
            <g className="isometric-box">
              <path d="M 0 0 L 8 4 L 8 24 L 0 20 Z" fill="rgba(0, 0, 0, 0.08)" className="box-shadow" />
              <path d="M 0 0 L 8 4 L 16 0 L 8 -4 Z" fill="#f3f4f6" stroke="rgba(156, 163, 175, 0.2)" strokeWidth="0.5" className="box-top" />
              <path d="M 0 0 L 0 20 L 8 24 L 8 4 Z" fill="#ffffff" stroke="rgba(156, 163, 175, 0.25)" strokeWidth="0.5" className="box-front" filter="url(#boxShadow)" />
              <path d="M 8 4 L 16 0 L 16 20 L 8 24 Z" fill="#f9fafb" stroke="rgba(156, 163, 175, 0.2)" strokeWidth="0.5" className="box-side" />
              <rect x="2" y="6" width="4" height="3" fill="rgba(255, 107, 53, 0.3)" className="label-indicator" />
            </g>
          </g>
        </g>

        {/* Canary Orchestrator - leads the flow */}
        <g className={`canary-orchestrator ${prefersReducedMotion ? '' : 'canary-path'}`}>
          <g className="canary-group">
            {/* Canary trail */}
            <path
              d="M 200 100 Q 250 150 300 200 Q 250 250 200 300 Q 150 250 100 200 Q 150 150 200 100"
              fill="none"
              stroke="url(#canaryTrail)"
              strokeWidth="2"
              strokeDasharray="4 2"
              className="canary-trail"
            />
            {/* Canary silhouette - premium minimal */}
            <g className="canary-body">
              {/* Body */}
              <ellipse cx="0" cy="0" rx="8" ry="6" fill="#fbbf24" className="canary-body-shape" />
              {/* Head */}
              <circle cx="-2" cy="-4" r="4" fill="#fbbf24" className="canary-head-shape" />
              {/* Wing - subtle */}
              <ellipse cx="1" cy="1" rx="6" ry="3" fill="#f59e0b" fillOpacity="0.7" className="canary-wing-shape" />
              {/* Tail */}
              <path d="M 6 0 L 10 -2 L 10 2 Z" fill="#f59e0b" fillOpacity="0.8" className="canary-tail-shape" />
              {/* Beak */}
              <path d="M -5 -4 L -7 -2.5 L -5 -1 Z" fill="#f59e0b" className="canary-beak-shape" />
              {/* Eye */}
              <circle cx="-0.5" cy="-4" r="0.8" fill="#000" fillOpacity="0.7" className="canary-eye-shape" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default HeroLogisticsAnimation;

