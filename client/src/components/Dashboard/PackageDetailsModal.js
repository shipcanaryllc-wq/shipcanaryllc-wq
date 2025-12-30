import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PackageDetailsModal.css';

const PackageDetailsModal = ({ isOpen, onClose, onPurchase, packageData, fromAddress, toAddress, service, price, userBalance = 0, loading = false }) => {
  const navigate = useNavigate();
  
  if (!isOpen) return null;

  // Compute balance check
  const priceNum = Number(price) || 0;
  const balanceNum = Number(userBalance) || 0;
  const hasEnough = balanceNum >= priceNum;
  const shortfall = priceNum - balanceNum;

  // Map service name to display label
  const getServiceDisplayName = () => {
    if (!service) return 'USPS Service';
    
    // Check apiId to determine service family
    if (service.apiId === 373) {
      return 'USPS Priority Mail';
    } else if (service.apiId === 126) {
      return 'USPS Ground Advantage';
    }
    
    // Fallback to service.name if apiId doesn't match
    return service.name || 'USPS Service';
  };

  const serviceDisplayName = getServiceDisplayName();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Review Package Details</h2>
          <button className="modal-close-button" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Service Badge */}
        <div className="service-badge">
          <svg className="service-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
          <span className="service-badge-text">{serviceDisplayName}</span>
        </div>

        {/* Package Specs Grid */}
        <div className="package-specs-grid">
          <div className="spec-card">
            <div className="spec-label">Dimensions</div>
            <div className="spec-value">{packageData.length}" × {packageData.width}" × {packageData.height}"</div>
          </div>
          <div className="spec-card">
            <div className="spec-label">Weight</div>
            <div className="spec-value">{packageData.weight} lbs</div>
          </div>
          {packageData.description && (
            <div className="spec-card spec-card-full">
              <div className="spec-label">SKU / Description</div>
              <div className="spec-value">{packageData.description}</div>
            </div>
          )}
        </div>

        {/* Addresses Grid */}
        <div className="addresses-grid">
          <div className="address-card">
            <div className="address-header">
              <div className="address-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <span className="address-title">From</span>
            </div>
            <div className="address-content">
              <div className="address-name">{fromAddress.name}</div>
              {fromAddress.company && <div className="address-company">{fromAddress.company}</div>}
              <div className="address-street">{fromAddress.street1}</div>
              {fromAddress.street2 && <div className="address-street">{fromAddress.street2}</div>}
              <div className="address-city-state">{fromAddress.city}, {fromAddress.state} {fromAddress.zip}</div>
              {fromAddress.country && fromAddress.country !== 'US' && (
                <div className="address-country">{fromAddress.country}</div>
              )}
            </div>
          </div>

          <div className="address-card">
            <div className="address-header">
              <div className="address-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <span className="address-title">To</span>
            </div>
            <div className="address-content">
              <div className="address-name">{toAddress.name}</div>
              {toAddress.company && <div className="address-company">{toAddress.company}</div>}
              <div className="address-street">{toAddress.street1}</div>
              {toAddress.street2 && <div className="address-street">{toAddress.street2}</div>}
              <div className="address-city-state">{toAddress.city}, {toAddress.state} {toAddress.zip}</div>
              {toAddress.country && toAddress.country !== 'US' && (
                <div className="address-country">{toAddress.country}</div>
              )}
            </div>
          </div>
        </div>

        {/* Price Section */}
        {hasEnough ? (
          <div className="price-card">
            <div className="price-info">
              <span className="price-label">Total</span>
              <span className="price-value">${priceNum.toFixed(2)}</span>
            </div>
            <div className="price-subtext">USD</div>
          </div>
        ) : (
          <div className="price-card price-card-error">
            <div className="price-error-header">
              <svg className="error-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
                <line x1="10" y1="6" x2="10" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="10" y1="12" x2="10" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="error-title">Insufficient Balance</span>
            </div>
            <div className="price-error-details">
              <span>Balance: ${balanceNum.toFixed(2)}</span>
              <span className="error-separator">•</span>
              <span>Needed: ${priceNum.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancel
          </button>
          {!hasEnough && (
            <button 
              onClick={() => {
                onClose();
                navigate('/dashboard?tab=balance');
              }} 
              className="btn-add-funds"
            >
              Add Funds
            </button>
          )}
          <button 
            onClick={onPurchase} 
            className="btn-primary" 
            disabled={loading || !hasEnough}
          >
            {loading ? (
              <>
                <svg className="btn-spinner" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="43.98" strokeDashoffset="10" opacity="0.5"/>
                </svg>
                <span>Creating Label...</span>
              </>
            ) : (
              'Purchase Label'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PackageDetailsModal;

