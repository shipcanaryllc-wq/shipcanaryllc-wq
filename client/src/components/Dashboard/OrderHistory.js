import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../config/axios';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import './OrderHistory.css';
import API_BASE_URL from '../../config/api';

// Helper function to normalize address fields to uppercase for display
const normalizeAddressField = (value) => {
  if (!value || typeof value !== 'string') return value;
  return value.trim().toUpperCase();
};

// Helper function to normalize an address object for display
const normalizeAddressForDisplay = (address) => {
  if (!address) return address;
  return {
    ...address,
    name: normalizeAddressField(address.name),
    company: normalizeAddressField(address.company),
    street1: normalizeAddressField(address.street1),
    street2: normalizeAddressField(address.street2),
    city: normalizeAddressField(address.city),
    state: normalizeAddressField(address.state),
    // Keep zip, phone, email as-is (not uppercase)
    zip: address.zip,
    phone: address.phone,
    email: address.email,
    country: address.country
  };
};

const OrderHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [downloadingLabel, setDownloadingLabel] = useState(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState(null);
  const copyTimeoutRef = useRef(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Refetch orders when page becomes visible (user navigates back to this page)
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchOrders();
      }
    };

    const handleFocus = () => {
      fetchOrders();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch all orders - use high per_page limit to get all orders
      const response = await apiClient.get('/orders', {
        params: {
          page: 1,
          per_page: 1000 // Get all orders for history view
        }
      });
      
      // Handle API response format
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

  const handleDownloadLabel = async (orderId) => {
    if (!orderId) return;
    
    setDownloadingLabel(orderId);
    try {
      const response = await apiClient.get(`/orders/${orderId}/label`, {
        responseType: 'blob', // Important: get binary data
      });
      
      // Create a blob URL from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new tab
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error downloading label:', error);
      alert('Failed to download label. Please try again.');
    } finally {
      setDownloadingLabel(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Label Created': '#333',
      'In Transit': '#ffc107',
      'Out for Delivery': '#17a2b8',
      'Delivered': '#28a745',
      'Exception': '#dc3545'
    };
    return colors[status] || '#666';
  };

  if (!user) {
    return (
      <div className="order-history">
        <div className="login-prompt">
          <h3>🔒 Sign Up Required</h3>
          <p>Create an account to view your order history and tracking information.</p>
          <button onClick={() => navigate('/register')} className="signup-prompt-button">
            Sign Up Free
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div>Loading order history...</div>;
  }

  const handleCopyTracking = async (trackingNumber, orderId) => {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      
      // Clear any existing timeout
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      
      // Set copied state
      setCopiedTrackingId(orderId);
      
      // Auto-revert after 1.75 seconds
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedTrackingId(null);
        copyTimeoutRef.current = null;
      }, 1750);
    } catch (err) {
      console.error('Failed to copy tracking number:', err);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'Label Created': 'status-created',
      'In Transit': 'status-transit',
      'Out for Delivery': 'status-delivery',
      'Delivered': 'status-delivered',
      'Exception': 'status-exception'
    };
    return statusMap[status] || 'status-default';
  };

  return (
    <div className="order-history">
      <div className="order-history-container">
        <h2>Order History</h2>
        <p className="subtitle">View all your shipping labels in chronological order</p>

        {orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders yet. Create your first shipping label to get started!</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order._id || order.id} className="order-card">
                {/* Header Row: Service Type + Status Badge */}
                <div className="order-header">
                  <div className="service-header">
                    <div className="carrier-icon">
                      <img 
                        src="https://1000logos.net/wp-content/uploads/2020/09/USPS-Logo.png"
                        alt="USPS"
                        className="carrier-logo"
                        onError={(e) => {
                          if (!e.target.src.includes('.svg')) {
                            e.target.src = 'https://assets.usps.com/images/logo_usps_eagle.svg';
                          }
                        }}
                      />
                    </div>
                    <div className="service-info">
                      <h3 className="service-name">{order.uspsService || 'USPS Service'}</h3>
                      <span className="order-date">
                        {format(new Date(order.createdAt), 'MMM dd, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                  <div className={`status-badge ${getStatusBadgeClass(order.trackingStatus)}`}>
                    {order.trackingStatus || 'Label Created'}
                  </div>
                </div>

                {/* Metadata: 2-Column Layout */}
                <div className="order-metadata">
                  <div className="metadata-column">
                    <div className="metadata-item">
                      <span className="metadata-label">Tracking Number</span>
                      <div className="metadata-value-group">
                        <a
                          href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.trackingNumber || order.tracking_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tracking-number-link"
                        >
                          {order.trackingNumber || order.tracking_id}
                        </a>
                        <button
                          onClick={() => handleCopyTracking(order.trackingNumber || order.tracking_id, order._id || order.id)}
                          className={`copy-tracking-btn ${copiedTrackingId === (order._id || order.id) ? 'copied' : ''}`}
                          title={copiedTrackingId === (order._id || order.id) ? 'Copied!' : 'Copy tracking number'}
                        >
                          {copiedTrackingId === (order._id || order.id) ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">Cost</span>
                      <span className="metadata-value cost">${(order.cost || parseFloat(order.price?.replace('$', '') || 0)).toFixed(2)}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">From</span>
                      <span className="metadata-value">
                        {normalizeAddressField(order.fromAddress?.city || order.fromAddressData?.city || order.from_city)}, {normalizeAddressField(order.fromAddress?.state || order.fromAddressData?.state || order.from_state)}
                      </span>
                    </div>
                  </div>
                  <div className="metadata-column">
                    <div className="metadata-item">
                      <span className="metadata-label">Status</span>
                      <span className="metadata-value status-text">Label Created</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">To</span>
                      <span className="metadata-value">
                        {normalizeAddressField(order.toAddress?.city || order.toAddressData?.city || order.to_city)}, {normalizeAddressField(order.toAddress?.state || order.toAddressData?.state || order.to_state)}
                      </span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">Package</span>
                      <span className="metadata-value">
                        {order.package?.length || order.length}" × {order.package?.width || order.width}" × {order.package?.height || order.height}" 
                        ({order.package?.weight || order.weight} lbs)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="order-actions">
                  {(order._id || order.id) && (
                    <button
                      onClick={() => handleDownloadLabel(order._id || order.id)}
                      disabled={downloadingLabel === (order._id || order.id)}
                      className="action-button primary-button"
                    >
                      {downloadingLabel === (order._id || order.id) ? 'Downloading...' : 'Download Label PDF'}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedOrder(selectedOrder === (order._id || order.id) ? null : (order._id || order.id))}
                    className="action-button secondary-button"
                  >
                    {selectedOrder === (order._id || order.id) ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>

              {selectedOrder === (order._id || order.id) && (() => {
                // Normalize addresses for display
                const fromAddr = normalizeAddressForDisplay(order.fromAddress || order.fromAddressData || {
                  name: order.from_name,
                  company: order.from_company,
                  street1: order.from_street,
                  street2: order.from_street2,
                  city: order.from_city,
                  state: order.from_state,
                  zip: order.from_zip
                });
                const toAddr = normalizeAddressForDisplay(order.toAddress || order.toAddressData || {
                  name: order.to_name,
                  company: order.to_company,
                  street1: order.to_street,
                  street2: order.to_street2,
                  city: order.to_city,
                  state: order.to_state,
                  zip: order.to_zip
                });
                
                return (
                  <div className="order-expanded">
                    <div className="expanded-section">
                      <h4>From Address</h4>
                      <p>{fromAddr?.name || ''}</p>
                      {fromAddr?.company && <p>{fromAddr.company}</p>}
                      <p>{fromAddr?.street1 || ''}</p>
                      {fromAddr?.street2 && <p>{fromAddr.street2}</p>}
                      <p>
                        {fromAddr?.city || ''}, {fromAddr?.state || ''} {fromAddr?.zip || ''}
                      </p>
                    </div>
                    <div className="expanded-section">
                      <h4>To Address</h4>
                      <p>{toAddr?.name || ''}</p>
                      {toAddr?.company && <p>{toAddr.company}</p>}
                      <p>{toAddr?.street1 || ''}</p>
                      {toAddr?.street2 && <p>{toAddr.street2}</p>}
                      <p>
                        {toAddr?.city || ''}, {toAddr?.state || ''} {toAddr?.zip || ''}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default OrderHistory;

