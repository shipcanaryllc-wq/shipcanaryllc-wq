import React from 'react';
import './PackageDetailsModal.css';

const PackageDetailsModal = ({ isOpen, onClose, onPurchase, packageData, fromAddress, toAddress, service, price, loading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Package Details</h2>
        
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

        <div className="price-section">
          <span className="price-label">Price:</span>
          <span className="price-value">${price.toFixed(2)} USD</span>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="cancel-modal-button" disabled={loading}>
            Cancel
          </button>
          <button onClick={onPurchase} className="purchase-button" disabled={loading}>
            {loading ? 'Creating Label...' : 'Purchase'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PackageDetailsModal;

