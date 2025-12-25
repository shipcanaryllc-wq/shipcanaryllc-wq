import React, { useState } from 'react';
import { buildTrackingUrl, getDisplayStatuses, formatCreatedAt } from './orderHelpers';

/**
 * OrderRowHorizontal Component
 * 
 * Displays a single order in a horizontal row layout with:
 * - Checkbox for selection
 * - Label type name + ID + cost
 * - From/To addresses
 * - Tracking number (clickable link + copy button)
 * - Status badges (human-readable)
 * - Created date/time
 * - Download button
 */
const OrderRowHorizontal = ({ 
  order, 
  rowNumber,
  isSelected, 
  onToggleSelect, 
  onDownloadLabel 
}) => {
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const orderId = order._id || order.id;
  
  // Extract label name and ID
  const labelName = order.uspsService || 'USPS Service';
  const labelId = order.labelId || order.labelTypeId || '';
  const cost = order.cost || parseFloat(order.price?.replace('$', '') || 0);
  
  // Extract addresses
  const fromName = order.fromAddress?.name || order.fromAddressData?.name || 'N/A';
  const fromCity = order.fromAddress?.city || order.fromAddressData?.city || '';
  const fromState = order.fromAddress?.state || order.fromAddressData?.state || '';
  
  const toName = order.toAddress?.name || order.toAddressData?.name || 'N/A';
  const toCity = order.toAddress?.city || order.toAddressData?.city || '';
  const toState = order.toAddress?.state || order.toAddressData?.state || '';
  
  // Tracking
  const trackingNumber = order.trackingNumber || order.tracking_id || '';
  const trackingUrl = buildTrackingUrl(order);
  
  // Status (using helper)
  const { labelStatusText, shipmentStatusText, labelStatusTone, shipmentStatusTone } = getDisplayStatuses(order);
  
  // Created date/time (using helper)
  const { dateText, timeText } = formatCreatedAt(order.createdAt);

  const handleCopyTracking = async (e) => {
    e.stopPropagation(); // Prevent link click
    if (!trackingNumber) return;
    
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 1200);
    } catch (err) {
      console.error('Failed to copy tracking:', err);
    }
  };

  const handleDownload = async () => {
    if (!orderId || downloading) return;
    
    setDownloading(true);
    try {
      await onDownloadLabel(orderId);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download label. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`order-row-grid ${isSelected ? 'selected' : ''}`}>
      {/* Row Number */}
      <div className="cell cell-number number-cell">
        <span className="row-number">{rowNumber}</span>
      </div>

      {/* Checkbox */}
      <div className="cell cell-checkbox checkbox-cell">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(orderId)}
          aria-label={`Select order ${orderId}`}
        />
      </div>

      {/* Label Type + Created + Cost */}
      <div className="cell cell-label label-cell">
        <div className="label-name">{labelName}</div>
        <div className="label-created">
          {dateText}{timeText && ` • ${timeText}`}
        </div>
        <div className="label-cost">${cost.toFixed(2)}</div>
      </div>

      {/* From Address */}
      <div className="cell cell-from from-cell">
        <div className="address-name">{fromName}</div>
        {(fromCity || fromState) && (
          <div className="address-location">
            {fromCity}{fromCity && fromState ? ', ' : ''}{fromState}
          </div>
        )}
      </div>

      {/* To Address */}
      <div className="cell cell-to to-cell">
        <div className="address-name">{toName}</div>
        {(toCity || toState) && (
          <div className="address-location">
            {toCity}{toCity && toState ? ', ' : ''}{toState}
          </div>
        )}
      </div>

      {/* Tracking Number */}
      <div className="cell cell-tracking tracking-cell">
        {trackingNumber && trackingUrl ? (
          <div className="tracking-wrap">
            <a
              href={trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="tracking-link"
              onClick={(e) => e.stopPropagation()}
            >
              {trackingNumber}
            </a>
            <button
              className="copy-btn"
              onClick={handleCopyTracking}
              title={copiedTracking ? 'Copied!' : 'Copy tracking number'}
              aria-label="Copy tracking number"
            >
              {copiedTracking ? (
                <span className="copied-text">✓</span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </button>
          </div>
        ) : (
          <span className="no-tracking">—</span>
        )}
      </div>

      {/* Status Badges */}
      <div className="cell cell-status status-cell">
        <span className={`status-badge order-status-badge ${labelStatusTone}`}>
          {labelStatusText}
        </span>
        {shipmentStatusText && shipmentStatusText !== labelStatusText.toUpperCase() && (
          <span className={`status-badge status-secondary order-status-badge ${shipmentStatusTone}`}>
            {shipmentStatusText}
          </span>
        )}
      </div>

      {/* Download */}
      <div className="cell cell-actions download-cell">
        <button
          className="btn-download-text"
          onClick={handleDownload}
          disabled={downloading || !orderId}
          type="button"
          aria-label="Download label"
          title="Download label"
        >
          {downloading ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="icon icon-loading">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416;0 31.416" repeatCount="indefinite"/>
                <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416;-31.416" repeatCount="indefinite"/>
              </circle>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
              <path d="M12 3a1 1 0 0 1 1 1v9.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4.01 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.42-1.42L11 13.59V4a1 1 0 0 1 1-1z"></path>
              <path d="M5 19a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1z"></path>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default OrderRowHorizontal;

