import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './OrderConfirmation.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

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
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadingLabel, setDownloadingLabel] = useState(false);
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
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
      const response = await axios.get(`${API_URL}/orders/${orderId}/label`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error downloading label:', error);
      alert('Failed to download label. Please try again.');
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
  const skuDescription = pkg.description || order.description || 'N/A';

  const trackPackageUrl = trackingNumber 
    ? `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`
    : '#';

  return (
    <div className="confirmation-wrapper">
      <div className="confirmation-container">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon-wrapper">
            <svg className="success-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#10B981" />
              <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="success-title">Shipping Label Created Successfully</h1>
          <p className="success-subtitle">Your shipment is now ready.</p>
        </div>

        {/* Summary Card */}
        <div className="summary-card">
          <div className="summary-content">
            <div className="summary-left">
              <div className="summary-row">
                <span className="summary-label">Order #</span>
                <span className="summary-value">{confirmationNumber}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Service</span>
                <span className="summary-value">{serviceDisplay}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Label Cost</span>
                <span className="summary-value price-value">${price.toFixed(2)}</span>
              </div>
            </div>
            <div className="summary-right">
              <button
                onClick={() => handleDownloadLabel(order._id || order.id)}
                disabled={downloadingLabel}
                className="download-button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                {downloadingLabel ? 'Loading...' : 'Download Label PDF'}
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

        {/* Tracking Section */}
        {trackingNumber && (
          <div className="tracking-card">
            <h2 className="card-title">Tracking Information</h2>
            <div className="tracking-content">
              <div className="tracking-number-wrapper">
                <span className="tracking-label">Tracking Number</span>
                <div className="tracking-number-display">
                  <span className="tracking-number-value">{trackingNumber}</span>
                  <button
                    onClick={handleCopyTracking}
                    className={`copy-button ${copySuccess ? 'copied' : ''}`}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderConfirmation;
