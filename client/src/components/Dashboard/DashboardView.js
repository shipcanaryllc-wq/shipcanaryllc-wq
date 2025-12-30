import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import BitcoinLogo from '../BitcoinLogo/BitcoinLogo';
import DailyOrdersChart from './DailyOrdersChart';
import { useAuth } from '../../context/AuthContext';
import './DashboardView.css';
import './DashboardCard.css';
import API_BASE_URL from '../../config/api';

// Helper function to normalize address fields to uppercase for display
const normalizeAddressField = (value) => {
  if (!value || typeof value !== 'string') return value;
  return value.trim().toUpperCase();
};

const DashboardView = () => {
  const { user, fetchUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [errorDeposits, setErrorDeposits] = useState(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchDeposits();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Refetch orders and deposits when page becomes visible (user navigates back to dashboard)
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchOrders();
        fetchDeposits();
      }
    };

    const handleFocus = () => {
      fetchOrders();
      fetchDeposits();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  // Check for topup success query param and refresh deposits
  useEffect(() => {
    if (!user) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const topupSuccess = urlParams.get('topup') === 'success' || urlParams.get('payment') === 'success';
    
    if (topupSuccess) {
      // Refresh user balance and deposits
      fetchUser();
      fetchDeposits();
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, fetchUser]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch all orders for dashboard metrics (use high per_page to get all orders)
      const response = await axios.get(`${API_BASE_URL}/orders`, {
        params: {
          page: 1,
          per_page: 1000 // Get all orders for accurate metrics calculation
        }
      });
      
      // Handle API response format - always use real backend data
      if (response.data.orders && Array.isArray(response.data.orders)) {
        setOrders(response.data.orders);
      } else if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        console.warn('Unexpected API response format:', response.data);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeposits = async () => {
    try {
      setLoadingDeposits(true);
      setErrorDeposits(null);
      
      const response = await axios.get(`${API_BASE_URL}/deposits/recent`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.deposits && Array.isArray(response.data.deposits)) {
        setDeposits(response.data.deposits);
        console.log('[DASHBOARD] Recent deposits loaded:', response.data.deposits.length);
      } else {
        console.warn('[DASHBOARD] Unexpected deposits API response format:', response.data);
        setDeposits([]);
      }
    } catch (error) {
      console.error('[DASHBOARD] Failed to load recent deposits', error);
      setErrorDeposits('Failed to load recent deposits');
      setDeposits([]);
    } finally {
      setLoadingDeposits(false);
    }
  };

  // Calculate metrics from orders
  const getOrdersToday = () => {
    if (!orders || orders.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    }).length;
  };

  const getOrdersThisWeek = () => {
    if (!orders || orders.length === 0) return 0;
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return orders.filter(order => {
      if (!order.createdAt) return false;
      return new Date(order.createdAt) >= startOfWeek;
    }).length;
  };

  const getOrdersThisMonth = () => {
    if (!orders || orders.length === 0) return 0;
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return orders.filter(order => {
      if (!order.createdAt) return false;
      return new Date(order.createdAt) >= startOfMonth;
    }).length;
  };

  const getOrdersAllTime = () => {
    return orders ? orders.length : 0;
  };

  // Get recent orders (most recent 5-10)
  const getRecentOrders = () => {
    if (!orders || orders.length === 0) return [];
    // Sort by createdAt descending (most recent first) and take first 10
    const sorted = [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      return dateB - dateA;
    });
    return sorted.slice(0, 10);
  };

  // Format order status for display
  const getOrderStatusDisplay = (order) => {
    if (order.status === 'failed' || order.trackingStatus === 'Exception') {
      return { text: 'Failed', color: '#dc3545', tone: 'danger' };
    }
    if (order.status === 'completed') {
      return { 
        text: 'Success', 
        color: '#28a745',
        tone: 'success'
      };
    }
    return { text: order.trackingStatus || 'Pending', color: '#666', tone: 'neutral' };
  };

  // Calculate 30-day metrics for Shipping Summary
  const getOrdersLast30Days = () => {
    if (!orders || orders.length === 0) return [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return orders.filter(order => {
      if (!order.createdAt) return false;
      return new Date(order.createdAt) >= thirtyDaysAgo;
    });
  };

  const getSpendLast30Days = () => {
    const recentOrders = getOrdersLast30Days();
    const total = recentOrders.reduce((sum, order) => sum + (order.cost || 0), 0);
    return total;
  };

  const getLabelsLast30Days = () => {
    return getOrdersLast30Days().length;
  };

  const getAvgCost = () => {
    const recentOrders = getOrdersLast30Days();
    if (recentOrders.length === 0) return 0;
    const total = recentOrders.reduce((sum, order) => sum + (order.cost || 0), 0);
    return total / recentOrders.length;
  };

  // Format date as "Dec 24, 2025"
  const formatJoinDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return '—';
    }
  };


  if (loading) {
    return <div className="dashboard-view-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-view-content">
        {/* Breadcrumb */}
        <div className="dashboard-breadcrumb">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span>Dashboard</span>
        </div>

        {/* Metrics Cards */}
        <div className="stats-grid page-section">
        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-label">Orders Today</div>
            <div className="metric-value">{getOrdersToday()}</div>
          </div>
          <div className="metric-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-label">Orders This Week</div>
            <div className="metric-value">{getOrdersThisWeek()}</div>
          </div>
          <div className="metric-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-label">Orders This Month</div>
            <div className="metric-value">{getOrdersThisMonth()}</div>
          </div>
          <div className="metric-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-label">Orders All Time</div>
            <div className="metric-value">{getOrdersAllTime()}</div>
          </div>
          <div className="metric-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
        </div>
      </div>

        {/* Main Dashboard Grid - 12 column system */}
        <div className="dashboard-main-grid page-section">
          {/* My Account Card - col-span-3 */}
          <div className="dashboard-card account-card col-span-3">
            <h3 className="card-title">My Account</h3>
            <div className="account-info">
              <div className="info-row">
                <span className="info-label">NAME</span>
                <span className="info-value">
                  {user?.fullName || user?.name || user?.email?.split('@')[0] || 'User'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">ROLE</span>
                <span className="info-value">{user?.role || 'User'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">BALANCE</span>
                <span className="info-value">${user?.balance?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">JOINED</span>
                <span className="info-value">
                  {(() => {
                    if (!user?.createdAt) {
                      console.warn('[Dashboard] User createdAt missing for user:', user?.id || user?.email);
                      return '—';
                    }
                    return formatJoinDate(user.createdAt);
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Orders Card - col-span-6 */}
          <div className="dashboard-card orders-card col-span-6">
            <h3 className="card-title">Recent Orders</h3>
            <div className="orders-list">
              {getRecentOrders().length === 0 ? (
                <div className="empty-state">No orders yet</div>
              ) : (
                getRecentOrders().map(order => {
                  const statusDisplay = getOrderStatusDisplay(order);
                  const fromName = normalizeAddressField(order.fromAddress?.name || order.fromAddress?.company || order.fromAddressData?.name || order.fromAddressData?.company || '—');
                  const toName = normalizeAddressField(order.toAddress?.name || order.toAddress?.company || order.toAddressData?.name || order.toAddressData?.company || '—');
                  
                  const isSuccess = order.status === 'completed' && order.trackingStatus !== 'Exception';
                  const isFailed = order.status === 'failed' || order.trackingStatus === 'Exception';
                  
                  // Format service name to ensure "USPS" prefix
                  const formatServiceName = (service) => {
                    if (!service) return 'USPS Service';
                    // If it already starts with USPS, return as is
                    if (service.toLowerCase().startsWith('usps')) return service;
                    // Otherwise, add USPS prefix
                    return `USPS ${service}`;
                  };
                  
                  return (
                    <div key={order._id || order.id} className="order-item">
                      <div className="order-item-content">
                        <div className="order-item-left">
                          <div className="order-service">{formatServiceName(order.uspsService)}</div>
                          <div className="order-addresses">
                            From: {fromName} → To: {toName}
                          </div>
                          {order.createdAt && (
                            <div className="order-date">
                              {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                            </div>
                          )}
                        </div>
                        <div className="order-item-right">
                          <div className={`order-status-pill order-status-pill--${statusDisplay.tone}`}>
                            {statusDisplay.text}
                          </div>
                          <div className="order-cost-pill">
                            ${order.cost?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Deposits Card - col-span-3 */}
          <div className="dashboard-card deposits-card col-span-3">
            <div className="card-header-with-link">
              <h3 className="card-title">Recent Deposits</h3>
            </div>
            <div className="deposits-list-container">
              {loadingDeposits ? (
                <div className="deposits-empty-state">
                  <div className="empty-state-text">Loading deposits...</div>
                </div>
              ) : errorDeposits ? (
                <div className="deposits-empty-state">
                  <div className="empty-state-text" style={{ color: '#dc3545' }}>
                    {errorDeposits}
                  </div>
                </div>
              ) : deposits.length === 0 ? (
                <div className="deposits-empty-state">
                  <BitcoinLogo size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <div className="empty-state-text">No deposits yet</div>
                </div>
              ) : (
                <div className="deposits-list">
                  {deposits.map((deposit) => {
                    // Determine payment method icon and label
                    const isBTCPay = deposit.paymentMethod?.toLowerCase().includes('btcpay') || 
                                    deposit.paymentMethod?.toLowerCase().includes('bitcoin') ||
                                    !deposit.paymentMethod;
                    const methodLabel = isBTCPay ? 'BTCPay' : (deposit.paymentMethod || 'Payment');
                    const depositDate = deposit.createdAt 
                      ? format(new Date(deposit.createdAt), 'MMM dd, yyyy • h:mm a')
                      : 'N/A';
                    
                    return (
                      <div key={deposit.id} className="deposit-row">
                        {/* LEFT: Icon */}
                        <div className="deposit-icon-column">
                          <div className="deposit-icon-badge">
                            {isBTCPay ? (
                              <BitcoinLogo size={24} />
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                            )}
                          </div>
                        </div>
                        
                        {/* CENTER: Amount, Method, Date */}
                        <div className="deposit-content-column">
                          <div className="deposit-amount">${deposit.amountUsd?.toFixed(2) || '0.00'}</div>
                          <div className="deposit-method">{methodLabel}</div>
                          <div className="deposit-date">{depositDate}</div>
                        </div>
                        
                        {/* RIGHT: Status */}
                        <div className="deposit-status-column">
                          <div className={`deposit-status-pill status-${deposit.status}`}>
                            {deposit.status === 'completed' ? 'Completed' : deposit.status === 'pending' ? 'Pending' : 'Failed'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shipping Summary Section */}
        <div className="shipping-summary-section page-section">
          <div className="dashboard-card shipping-summary-card">
            <h3 className="card-title">Shipping Summary</h3>
            <div className="summary-tiles">
              <div className="summary-tile">
                <div className="summary-tile-label">Spend (30d)</div>
                <div className="summary-tile-value">
                  ${getSpendLast30Days().toFixed(2)}
                </div>
              </div>
              <div className="summary-tile">
                <div className="summary-tile-label">Labels (30d)</div>
                <div className="summary-tile-value">
                  {getLabelsLast30Days()}
                </div>
              </div>
              <div className="summary-tile">
                <div className="summary-tile-label">Avg Cost</div>
                <div className="summary-tile-value">
                  ${getAvgCost().toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Orders Chart Section */}
        <div className="orders-chart-section page-section">
          <DailyOrdersChart orders={orders} />
        </div>
    </div>
  );
};

export default DashboardView;

