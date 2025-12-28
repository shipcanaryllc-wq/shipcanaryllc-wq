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
        <h2>Package Details</h2>
        
        {/* Service Display */}
        <div className="service-info-row">
          <span className="service-label">Service:</span>
          <span className="service-value">{serviceDisplayName}</span>
        </div>
        
        <div className="package-info">
          <div className="info-row">
            <span className="info-label">Dimensions:</span>
            <span className="info-value">{packageData.length}" x {packageData.width}" x {packageData.height}"</span>
          </div>
          <div className="info-row">
            <span className="info-label">Weight:</span>
            <span className="info-value">{packageData.weight} lbs</span>
          </div>
          {packageData.description && (
            <div className="info-row">
              <span className="info-label">Description:</span>
              <span className="info-value">{packageData.description}</span>
            </div>
          )}
        </div>

        <div className="address-section">
          <div className="address-block">
            <h4>From</h4>
            <p className="address-name">{fromAddress.name}</p>
            {fromAddress.company && <p className="address-company">{fromAddress.company}</p>}
            <p className="address-street">{fromAddress.street1}</p>
            {fromAddress.street2 && <p className="address-street">{fromAddress.street2}</p>}
            <p className="address-city">{fromAddress.city}, {fromAddress.state} {fromAddress.zip}</p>
            {fromAddress.country && <p className="address-country">{fromAddress.country}</p>}
          </div>

          <div className="address-block">
            <h4>To</h4>
            <p className="address-name">{toAddress.name}</p>
            {toAddress.company && <p className="address-company">{toAddress.company}</p>}
            <p className="address-street">{toAddress.street1}</p>
            {toAddress.street2 && <p className="address-street">{toAddress.street2}</p>}
            <p className="address-city">{toAddress.city}, {toAddress.state} {toAddress.zip}</p>
            {toAddress.country && <p className="address-country">{toAddress.country}</p>}
          </div>
        </div>

        {/* Price Section - Shows price or insufficient balance message */}
        {hasEnough ? (
          <div className="price-section">
            <span className="price-label">Price:</span>
            <span className="price-value">${priceNum.toFixed(2)} USD</span>
          </div>
        ) : (
          <div className="price-section insufficient-balance">
            <div className="insufficient-balance-header">
              <span className="insufficient-label">Insufficient balance</span>
            </div>
            <div className="insufficient-balance-details">
              <span className="balance-breakdown">
                Balance: ${balanceNum.toFixed(2)} • Needed: ${priceNum.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="cancel-modal-button" disabled={loading}>
            Cancel
          </button>
          {!hasEnough && (
            <button 
              onClick={() => {
                onClose();
                navigate('/dashboard?tab=balance');
              }} 
              className="add-funds-button"
            >
              Add Funds
            </button>
          )}
          <button 
            onClick={onPurchase} 
            className="purchase-button" 
            disabled={loading || !hasEnough}
            style={{ cursor: !hasEnough ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Creating Label...' : 'Purchase'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PackageDetailsModal;

