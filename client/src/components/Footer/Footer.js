import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo/Logo';
import './Footer.css';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="marketing-footer">
      <div className="footer-container">
        <div className="footer-logo" onClick={() => navigate('/')}>
          <Logo size="medium" />
        </div>
        <p className="footer-tagline">Small business shipping simplified</p>
        <div className="footer-links">
          <a 
            href="/privacy" 
            className="footer-link"
            onClick={(e) => {
              e.preventDefault();
              // Navigate to privacy page when implemented
            }}
          >
            Privacy Policy
          </a>
          <span className="footer-separator">•</span>
          <a 
            href="/terms" 
            className="footer-link"
            onClick={(e) => {
              e.preventDefault();
              // Navigate to terms page when implemented
            }}
          >
            Terms of Use
          </a>
        </div>
        <p className="footer-copyright">
          © {new Date().getFullYear()} ShipCanary. All rights reserved. shipcanary.com
        </p>
      </div>
    </footer>
  );
};

export default Footer;












