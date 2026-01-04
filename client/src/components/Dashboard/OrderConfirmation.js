import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../config/axios';
import { Download, Plus, Eye } from 'lucide-react';
import './OrderConfirmation.css';
import API_BASE_URL from '../../config/api';

const normalizeAddressField = (value) => {
  if (!value || typeof value !== 'string') return value;
  return value.trim().toUpperCase();
};

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
    zip: address.zip,
    phone: address.phone,
    email: address.email,
    country: address.country
  };
};

const OrderConfirmation = ({ order, onClose }) => {
  const navigate = useNavigate();
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadingLabel, setDownloadingLabel] = useState(false);
  const [checkmarkAnimated, setCheckmarkAnimated] = useState(false);
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    // Trigger checkmark animation on mount
    setTimeout(() => setCheckmarkAnimated(true), 100);
    
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  if (!order) return null;

  const handleCopyTracking = async () => {
    const trackingNumber = order.trackingNumber || order.tracking_id || '';
    if (!trackingNumber) return;

    try {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(trackingNumber);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = trackingNumber;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopySuccess(true);
      copyTimeoutRef.current = setTimeout(() => {
        setCopySuccess(false);
        copyTimeoutRef.current = null;
      }, 1750);
    } catch (error) {
      console.error('Failed to copy tracking number:', error);
    }
  };

  const handleDownloadLabel = async (orderId) => {
    if (!orderId) return;
    
    setDownloadingLabel(true);
    try {
      const response = await apiClient.get(`/orders/${orderId}/label`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `label-${orderId}.pdf`;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error downloading label:', error);
      if (error.response?.status === 401) {
        alert('Session expired. Please log in again.');
      } else if (error.response?.status === 404) {
        alert('Label not found. The label may not be available yet.');
      } else {
        alert('Failed to download label. Please check your internet connection and try again.');
      }
    } finally {
      setDownloadingLabel(false);
    }
  };

  const formatServiceName = (serviceName) => {
    if (!serviceName) return 'USPS Shipping';
    
    const serviceMap = {
      'USPS Ground': 'USPS Ground Shipping',
      'USPS Ground Advantage': 'USPS Ground Advantage',
      'Priority Mail': 'USPS Priority Mail',
      'Priority Mail Express': 'USPS Priority Mail Express',
      'First-Class Package': 'USPS First-Class Package',
      'Parcel Select': 'USPS Parcel Select',
      'Media Mail': 'USPS Media Mail'
    };
    
    return serviceMap[serviceName] || serviceName;
  };

  const fromAddr = normalizeAddressForDisplay(order.fromAddress || order.fromAddressData || {});
  const toAddr = normalizeAddressForDisplay(order.toAddress || order.toAddressData || {});
  const pkg = order.package || order.packageData || {};

  const confirmationNumber = order._id || order.id || order.confirmationNumber || 'N/A';
  const serviceDisplay = formatServiceName(order.uspsService);
  const length = pkg.length || order.length || 0;
  const width = pkg.width || order.width || 0;
  const height = pkg.height || order.height || 0;
  const weight = pkg.weight || order.weight || 0;
  const price = order.cost || order.price || 0;
  const trackingNumber = order.trackingNumber || order.tracking_id || '';
  
  // Professional fallback for SKU/Description (never show "N/A")
  const getSkuDescription = () => {
    const desc = pkg.description || order.description || order.packageData?.description;
    if (desc && desc.trim() && desc.trim() !== 'N/A') {
      return desc.trim();
    }
    return 'Custom package'; // Professional fallback
  };
  const skuDescription = getSkuDescription();
  
  // Format date/time if available
  const createdAt = order.createdAt ? new Date(order.createdAt) : null;
  const formattedDate = createdAt ? createdAt.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }) : null;
  const formattedTime = createdAt ? createdAt.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  }) : null;

  const trackPackageUrl = trackingNumber 
    ? `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`
    : '#';

  const handleCreateAnother = () => {
    if (onClose) {
      onClose();
    }
    // Reset form state handled by parent component
  };

  const handleViewDetails = () => {
    navigate(`/dashboard?tab=orders-history`);
  };

  return (
    <div className="confirmation-wrapper">
      <div className="confirmation-container">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon-wrapper">
            <div className="success-icon-container">
              {/* Professional success checkmark */}
              <svg 
                className={`success-icon ${checkmarkAnimated ? 'animated' : ''}`} 
                viewBox="0 0 64 64" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Subtle background circle */}
                <circle 
                  cx="32" 
                  cy="32" 
                  r="30" 
                  fill="#10b981"
                  className="success-circle-bg"
                  opacity={checkmarkAnimated ? 1 : 0}
                  style={{
                    transition: 'opacity 0.3s ease-out'
                  }}
                />
                {/* Checkmark path */}
                <path 
                  d="M20 32 L28 40 L44 24" 
                  stroke="white" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="success-checkmark"
                  style={{
                    strokeDasharray: checkmarkAnimated ? '30' : '0',
                    strokeDashoffset: checkmarkAnimated ? '0' : '30',
                    transition: 'stroke-dashoffset 0.4s ease-out 0.2s',
                    opacity: checkmarkAnimated ? 1 : 0
                  }}
                />
              </svg>
            </div>
          </div>
          <h1 className="success-title">Label created</h1>
          <p className="success-subtitle">Your shipment is ready to download.</p>
        </div>

        {/* Summary Card with 2-column grid */}
        <div className="summary-card">
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Order #</span>
              <span className="summary-value">{confirmationNumber}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Service</span>
              <span className="summary-value">{serviceDisplay}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Label Cost</span>
              <span className="summary-value price-value">${price.toFixed(2)}</span>
            </div>
            {formattedDate && (
              <div className="summary-item">
                <span className="summary-label">Date</span>
                <span className="summary-value">{formattedDate} {formattedTime}</span>
              </div>
            )}
            {trackingNumber && (
              <div className="summary-item full-width">
                <span className="summary-label">Tracking Number</span>
                <div className="summary-tracking-wrapper">
                  <span className="summary-tracking-value">{trackingNumber}</span>
                  <button
                    onClick={handleCopyTracking}
                    className={`summary-copy-button ${copySuccess ? 'copied' : ''}`}
                  >
                    {copySuccess ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Primary CTA */}
          <div className="summary-actions">
            <button
              onClick={() => handleDownloadLabel(order._id || order.id)}
              disabled={downloadingLabel}
              className="download-button-primary"
            >
              <Download size={18} />
              {downloadingLabel ? 'Downloading...' : 'Download Label'}
            </button>
            
            {/* Secondary Actions */}
            <div className="secondary-actions">
              <button
                onClick={handleCreateAnother}
                className="secondary-button"
              >
                <Plus size={16} />
                Create another label
              </button>
              <button
                onClick={handleViewDetails}
                className="secondary-button"
              >
                <Eye size={16} />
                View order details
              </button>
            </div>
          </div>
        </div>

        {/* Package Details */}
        <div className="details-card">
          <h2 className="card-title">Package Details</h2>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Dimensions</span>
              <span className="detail-value">{length}" × {width}" × {height}"</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Weight</span>
              <span className="detail-value">{weight} lbs</span>
            </div>
            <div className="detail-item full-width">
              <span className="detail-label">SKU / Description</span>
              <span className="detail-value">{skuDescription}</span>
            </div>
          </div>
        </div>

        {/* Address Cards Grid */}
        <div className="addresses-grid">
          {/* Sender Card */}
          <div className="address-card">
            <h3 className="address-card-title">From</h3>
            <div className="address-content">
              {fromAddr.name && (
                <div className="address-line name-line">{fromAddr.name}</div>
              )}
              {fromAddr.company && (
                <div className="address-line">{fromAddr.company}</div>
              )}
              {fromAddr.street1 && (
                <div className="address-line">{fromAddr.street1}</div>
              )}
              {fromAddr.street2 && (
                <div className="address-line">{fromAddr.street2}</div>
              )}
              {(fromAddr.city || fromAddr.state || fromAddr.zip) && (
                <div className="address-line">
                  {[fromAddr.city, fromAddr.state, fromAddr.zip].filter(Boolean).join(', ')}
                </div>
              )}
              {fromAddr.country && fromAddr.country !== 'US' && (
                <div className="address-line">{fromAddr.country}</div>
              )}
            </div>
          </div>

          {/* Recipient Card */}
          <div className="address-card">
            <h3 className="address-card-title">To</h3>
            <div className="address-content">
              {toAddr.name && (
                <div className="address-line name-line">{toAddr.name}</div>
              )}
              {toAddr.company && (
                <div className="address-line">{toAddr.company}</div>
              )}
              {toAddr.street1 && (
                <div className="address-line">{toAddr.street1}</div>
              )}
              {toAddr.street2 && (
                <div className="address-line">{toAddr.street2}</div>
              )}
              {(toAddr.city || toAddr.state || toAddr.zip) && (
                <div className="address-line">
                  {[toAddr.city, toAddr.state, toAddr.zip].filter(Boolean).join(', ')}
                </div>
              )}
              {toAddr.country && toAddr.country !== 'US' && (
                <div className="address-line">{toAddr.country}</div>
              )}
            </div>
          </div>
        </div>

        {/* Tracking Link Section */}
        {trackingNumber && (
          <div className="tracking-link-section">
            <a
              href={trackPackageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="track-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Track Package
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderConfirmation;
