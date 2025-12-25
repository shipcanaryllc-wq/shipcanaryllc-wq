import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../Logo/Logo';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="marketing-navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <Logo size="medium" />
        </div>
        <nav className="navbar-nav">
          <a 
            href="/pricing" 
            className={`nav-link ${isActive('/pricing') ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/pricing');
            }}
          >
            Pricing
          </a>
          <a 
            href="/support" 
            className={`nav-link ${isActive('/support') ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/support');
            }}
          >
            Support
          </a>
          <a 
            href="/careers" 
            className={`nav-link ${isActive('/careers') ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/careers');
            }}
          >
            Careers
          </a>
        </nav>
        <div className="navbar-actions">
          {user ? (
            <button className="nav-button" onClick={() => navigate('/dashboard')}>
              Dashboard
            </button>
          ) : (
            <>
              <button className="nav-button secondary" onClick={() => navigate('/login')}>
                Login
              </button>
              <button className="nav-button primary" onClick={() => navigate('/register')}>
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

