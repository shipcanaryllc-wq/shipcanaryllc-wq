import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../Logo/Logo';
import { DashboardIcon, PackageIcon, HistoryIcon, BulkOrdersIcon, BatchesListIcon, LocationIcon, RulerIcon, WalletIcon, IntegrationsIcon } from '../Icons/Icons';
import CreateLabel from './CreateLabel';
import SavedAddresses from './SavedAddresses';
import SavedPackages from './SavedPackages';
import OrderHistory from './OrderHistory';
import OrdersHistoryHorizontal from '../orders/OrdersHistoryHorizontal';
import AddBalance from './AddBalance';
import BulkOrders from './BulkOrders';
import DashboardView from './DashboardView';
import Integrations from './Integrations';
import BatchesList from './BatchesList';
import './Dashboard.css';

const Dashboard = () => {
  const { user, fetchUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('create-label');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    // Handle payment success
    const payment = searchParams.get('payment');
    const tab = searchParams.get('tab');
    if (payment === 'success' && user) {
      fetchUser(); // Refresh user balance
      setActiveTab('balance');
      // Remove query params
      navigate('/dashboard', { replace: true });
    }
    if (tab === 'balance') {
      setActiveTab('balance');
      navigate('/dashboard', { replace: true });
    }
  }, [searchParams, user, fetchUser, navigate]);

  useEffect(() => {
    // Close profile menu when clicking outside
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

  const navigationSections = [
    {
      heading: '',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon }
      ]
    },
    {
      heading: 'Labels',
      items: [
        { id: 'create-label', label: 'Create Label', icon: PackageIcon },
        { id: 'history', label: 'Order History', icon: HistoryIcon },
        { id: 'history-horizontal', label: 'Orders History (Horizontal)', icon: HistoryIcon }
      ]
    },
    {
      heading: 'Bulk',
      items: [
        { id: 'bulk-orders', label: 'Bulk Orders', icon: BulkOrdersIcon },
        { id: 'batches-list', label: 'Batches List', icon: BatchesListIcon }
      ]
    },
    {
      heading: 'Saved',
      items: [
        { id: 'addresses', label: 'Saved Addresses', icon: LocationIcon },
        { id: 'packages', label: 'Saved Packages', icon: RulerIcon }
      ]
    },
    {
      heading: 'Account',
      items: [
        { id: 'balance', label: 'Add Balance', icon: WalletIcon },
        { id: 'integrations', label: 'Integrations', icon: IntegrationsIcon }
      ]
    }
  ];

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button 
            className="hamburger-menu"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="17" y2="6"/>
              <line x1="3" y1="10" x2="17" y2="10"/>
              <line x1="3" y1="14" x2="17" y2="14"/>
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
            >
              <div className="user-avatar-small">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-info-small">
                <div className="user-name-small">{user?.email?.split('@')[0] || 'User'}</div>
                <div className="user-username-small">{user?.email?.split('@')[0] || 'user'}</div>
              </div>
            </div>
            {profileMenuOpen && (
              <div className="profile-dropdown">
                <button 
                  className="profile-menu-item"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    // Profile action - UI only placeholder
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

      <div className="dashboard-content">
        {/* Sidebar */}
        <nav className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          {navigationSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="nav-section">
              {section.heading && (
                <div className="nav-section-heading">{section.heading}</div>
              )}
              <div className="nav-section-items">
                {section.items.map(tab => (
                  <button
                    key={tab.id}
                    className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="nav-item-icon">
                      {React.createElement(tab.icon, { size: 20 })}
                    </span>
                    <span className="nav-item-label">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Content Area */}
        <div className="tab-content-wrapper">
          <div className="content-card">
            <div className="tab-content">
              {activeTab === 'dashboard' && <DashboardView />}
              {activeTab === 'create-label' && <CreateLabel />}
              {activeTab === 'bulk-orders' && <BulkOrders />}
              {activeTab === 'batches-list' && <BatchesList />}
              {activeTab === 'addresses' && <SavedAddresses />}
              {activeTab === 'packages' && <SavedPackages />}
              {activeTab === 'history' && <OrderHistory />}
              {activeTab === 'history-horizontal' && <OrdersHistoryHorizontal />}
              {activeTab === 'balance' && <AddBalance />}
              {activeTab === 'integrations' && <Integrations />}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>Copyright © ShipCanary {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default Dashboard;
