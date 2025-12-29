import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown } from 'lucide-react';
import { getDisplayName } from '../../utils/userDisplay';
import Logo from '../Logo/Logo';
import { DashboardIcon, PackageIcon, HistoryIcon, BulkOrdersIcon, BatchesListIcon, LocationIcon, RulerIcon, WalletIcon, IntegrationsIcon } from '../Icons/Icons';
import './DashboardLayout.css';

/**
 * DashboardLayout - Unified layout shell for all authenticated pages
 * Provides consistent sidebar, header, and content structure
 */
const DashboardLayout = ({ children, activeTab: externalActiveTab, onTabChange = null }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const profileMenuRef = useRef(null);
  const sidebarRef = useRef(null);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile nav on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && mobileNavOpen) {
        setMobileNavOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileNavOpen]);

  // Reset avatar error when user changes
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl]);

  // Navigation sections
  const navigationSections = [
    {
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, path: '/dashboard' }
      ]
    },
    {
      heading: 'LABELS',
      items: [
        { id: 'create-label', label: 'Create Label', icon: PackageIcon, path: '/dashboard' },
        { id: 'orders-history', label: 'Orders History', icon: HistoryIcon, path: '/dashboard' }
      ]
    },
    {
      heading: 'BULK',
      items: [
        { id: 'bulk-orders', label: 'Bulk Orders', icon: BulkOrdersIcon, path: '/dashboard' },
        { id: 'batches-list', label: 'Batches List', icon: BatchesListIcon, path: '/dashboard' }
      ]
    },
    {
      heading: 'SAVED',
      items: [
        { id: 'addresses', label: 'Saved Addresses', icon: LocationIcon, path: '/dashboard' },
        { id: 'packages', label: 'Saved Packages', icon: RulerIcon, path: '/dashboard' }
      ]
    },
    {
      heading: 'ACCOUNT',
      items: [
        { id: 'balance', label: 'Add Balance', icon: WalletIcon, path: '/dashboard' },
        { id: 'integrations', label: 'Integrations', icon: IntegrationsIcon, path: '/dashboard' }
      ]
    }
  ];

  const handleNavClick = (tab) => {
    // If onTabChange callback is provided, use it
    if (onTabChange) {
      onTabChange(tab);
    } else {
      // Otherwise, navigate using the tab's path
      const navItem = navigationSections
        .flatMap(section => section.items)
        .find(item => item.id === tab);
      if (navItem && navItem.path) {
        navigate(navItem.path);
      }
    }
    setMobileNavOpen(false);
    setSidebarCollapsed(false);
  };

  return (
    <div className="dashboard-layout" data-sidebar-collapsed={sidebarCollapsed}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button 
            className="hamburger-menu"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="logo-section" onClick={() => navigate('/')}>
            <Logo size="medium" />
          </div>
        </div>
        <div className="header-right">
          <div className="balance-display">
            <span className="balance-label">Balance:</span>
            <span className="balance-amount">${user?.balance?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="user-profile-wrapper" ref={profileMenuRef}>
            <div 
              className="user-profile"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              title={getDisplayName(user)}
            >
              <div className="user-avatar-small">
                {user?.avatarUrl && !avatarError ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={getDisplayName(user)} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      display: 'block'
                    }}
                    onError={() => {
                      setAvatarError(true);
                    }}
                  />
                ) : (
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '100%', 
                    height: '100%',
                    background: '#e5e7eb',
                    borderRadius: '50%'
                  }}>
                    {/* Default avatar icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.6 }}>
                      <circle cx="12" cy="8" r="4" fill="#9ca3af"/>
                      <path d="M6 21c0-3.314 2.686-6 6-6s6 2.686 6 6" fill="#9ca3af"/>
                    </svg>
                  </span>
                )}
              </div>
              <div className="user-info-small">
                <div className="user-name-small" title={getDisplayName(user)}>
                  {getDisplayName(user)}
                </div>
              </div>
              <ChevronDown size={16} className="user-chevron" />
            </div>
            {profileMenuOpen && (
              <div className="profile-dropdown">
                <button 
                  className="profile-menu-item"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/profile');
                  }}
                >
                  Profile
                </button>
                <button 
                  className="profile-menu-item"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    if (logout) {
                      logout();
                    }
                    navigate('/');
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      {mobileNavOpen && (
        <div 
          className="mobile-nav-overlay"
          onClick={() => {
            setMobileNavOpen(false);
            setSidebarCollapsed(false);
          }}
        />
      )}

      <div className="dashboard-content-wrapper">
        {/* Sidebar */}
        <nav 
          ref={sidebarRef}
          className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileNavOpen ? 'mobile-open' : ''}`}
        >
          {navigationSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="nav-section">
              {section.heading && (
                <div className="nav-section-heading">{section.heading}</div>
              )}
              <div className="nav-section-items">
                {section.items.map(item => {
                  const isActive = externalActiveTab === item.id;
                  return (
                    <button
                      key={item.id}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavClick(item.id)}
                    >
                      <span className="nav-item-icon">
                        {React.createElement(item.icon, { size: 20 })}
                      </span>
                      <span className="nav-item-label">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Content Area */}
        <main className="dashboard-main-content">
          <div className="dashboard-content-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

