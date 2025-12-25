import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './UserMenu.css';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const getInitials = (email) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  if (!user) {
    return (
      <div className="auth-buttons">
        <button onClick={() => navigate('/login')} className="nav-button secondary">
          Sign In
        </button>
        <button onClick={() => navigate('/register')} className="nav-button primary">
          Get Started
        </button>
      </div>
    );
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <div className="balance-display-header">
        <span className="balance-label-header">Balance:</span>
        <span className="balance-amount-header">${user?.balance?.toFixed(2) || '0.00'}</span>
      </div>
      <button 
        className="user-menu-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        <div className="user-avatar">
          {getInitials(user.email)}
        </div>
        <span className="user-email">{user.email}</span>
        <svg 
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none"
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-info">
            <div className="user-avatar-large">
              {getInitials(user.email)}
            </div>
            <div className="user-details">
              <div className="user-name">{user.email}</div>
              <div className="user-balance">
                Balance: <span className="balance-highlight">${user?.balance?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
          
          <div className="menu-divider"></div>

          <button 
            className="menu-item"
            onClick={() => {
              navigate('/dashboard');
              setIsOpen(false);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4H14V14H2V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 4L8 1L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 14V8H10V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Dashboard
          </button>

          <button 
            className="menu-item"
            onClick={() => {
              navigate('/dashboard?tab=balance');
              setIsOpen(false);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1V15M8 1C6.34315 1 5 2.34315 5 4C5 5.65685 6.34315 7 8 7M8 1C9.65685 1 11 2.34315 11 4C11 5.65685 9.65685 7 8 7M8 7C9.65685 7 11 8.34315 11 10C11 11.6569 9.65685 13 8 13M8 7C6.34315 7 5 8.34315 5 10C5 11.6569 6.34315 13 8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Add Balance
          </button>

          <div className="menu-divider"></div>

          <button 
            className="menu-item logout"
            onClick={handleLogout}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 11L14 8L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;

