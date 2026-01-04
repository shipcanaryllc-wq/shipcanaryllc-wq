/**
 * Order Display Helpers
 * 
 * Pure helper functions for formatting order data for display.
 * Used by OrdersHistoryHorizontal component.
 */

/**
 * Builds tracking URL for a carrier based on tracking number
 * @param {Object} order - Order object
 * @returns {string|null} Tracking URL or null if not available
 */
export function buildTrackingUrl(order) {
  const trackingNumber = order.trackingNumber || order.tracking_id || '';
  if (!trackingNumber) return null;

  // Check if it's USPS (20-30 digit numeric)
  const isUSPS = /^\d{20,30}$/.test(trackingNumber);
  
  // Also check provider/carrier field if available
  const provider = order.provider || '';
  const carrier = order.carrier || '';
  const isUSPSProvider = provider.toLowerCase().includes('usps') || 
                         carrier.toLowerCase().includes('usps') ||
                         (order.uspsService && order.uspsService.toLowerCase().includes('usps'));

  if (isUSPS || isUSPSProvider) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
  }

  // Default to USPS if we can't determine (most orders are USPS)
  return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
}

/**
 * Gets human-readable display statuses from order fields
 * @param {Object} order - Order object
 * @returns {Object} { labelStatusText, shipmentStatusText, labelStatusTone, shipmentStatusTone }
 */
export function getDisplayStatuses(order) {
  const status = (order.status || '').toLowerCase();
  const trackingStatus = (order.trackingStatus || '').toUpperCase(); // Use uppercase for normalized statuses
  const detailStatus = (order.detailStatus || '').toLowerCase();
  
  // Combine all status fields for checking
  const combinedStatus = `${status} ${trackingStatus} ${detailStatus}`.toLowerCase();

  // Determine label status (primary)
  let labelStatusText = 'Label created';
  let labelStatusTone = 'neutral'; // neutral, success, info, warning, danger

  // Check for failure first
  if (status.includes('fail') || detailStatus.includes('fail') || status === 'failed') {
    labelStatusText = 'Failed';
    labelStatusTone = 'danger';
  }
  // Check for delivered (support both old and new formats)
  else if (combinedStatus.includes('delivered') || trackingStatus === 'DELIVERED') {
    labelStatusText = 'Delivered';
    labelStatusTone = 'success';
  }
  // Check for out for delivery
  else if (combinedStatus.includes('out for delivery') || combinedStatus.includes('out_for_delivery') || trackingStatus === 'OUT_FOR_DELIVERY') {
    labelStatusText = 'Out for delivery';
    labelStatusTone = 'info';
  }
  // Check for in transit
  else if (combinedStatus.includes('in transit') || combinedStatus.includes('in_transit') || combinedStatus.includes('transit') || trackingStatus === 'IN_TRANSIT') {
    labelStatusText = 'In transit';
    labelStatusTone = 'info';
  }
  // Check for exceptions
  else if (combinedStatus.includes('exception') || combinedStatus.includes('return') || 
           combinedStatus.includes('refused') || combinedStatus.includes('hold') || trackingStatus === 'EXCEPTION') {
    labelStatusText = 'Exception';
    labelStatusTone = 'warning';
  }
  // Check for label created
  else if (combinedStatus.includes('pre-shipment') || combinedStatus.includes('pre_shipment') ||
           combinedStatus.includes('label') || trackingStatus === 'LABEL_CREATED') {
    labelStatusText = 'Label created';
    labelStatusTone = 'neutral';
  }
  // Check for no scan
  else if (combinedStatus.includes('no scan') || combinedStatus.includes('no_scan') || trackingStatus === 'NO_SCAN' || 
           combinedStatus === '' || !combinedStatus.trim()) {
    labelStatusText = 'No scan';
    labelStatusTone = 'neutral';
  }

  // Determine shipment status (secondary badge - show normalized tracking status)
  let shipmentStatusText = '';
  let shipmentStatusTone = 'neutral';

  // Map normalized statuses to display text
  const statusDisplayMap = {
    'NO_SCAN': 'NO SCAN',
    'LABEL_CREATED': 'LABEL CREATED',
    'IN_TRANSIT': 'IN TRANSIT',
    'OUT_FOR_DELIVERY': 'OUT FOR DELIVERY',
    'DELIVERED': 'DELIVERED',
    'EXCEPTION': 'EXCEPTION'
  };

  // Use normalized trackingStatus if available
  if (trackingStatus && statusDisplayMap[trackingStatus]) {
    shipmentStatusText = statusDisplayMap[trackingStatus];
  } else if (detailStatus && detailStatus !== 'no_scan' && detailStatus !== 'no_info' && detailStatus.trim() !== '') {
    shipmentStatusText = detailStatus.toUpperCase().replace(/_/g, ' ');
  } else if (trackingStatus && trackingStatus !== 'LABEL CREATED' && trackingStatus.trim() !== '') {
    shipmentStatusText = trackingStatus.replace(/_/g, ' ');
  } else {
    shipmentStatusText = 'NO SCAN';
  }

  // Set tone based on shipment status
  if (shipmentStatusText.includes('DELIVERED')) {
    shipmentStatusTone = 'success';
  } else if (shipmentStatusText.includes('TRANSIT') || shipmentStatusText.includes('IN TRANSIT')) {
    shipmentStatusTone = 'info';
  } else if (shipmentStatusText.includes('EXCEPTION') || shipmentStatusText.includes('RETURN')) {
    shipmentStatusTone = 'warning';
  } else if (shipmentStatusText.includes('NO SCAN') || shipmentStatusText.includes('NO INFO')) {
    shipmentStatusTone = 'neutral';
  } else {
    shipmentStatusTone = 'neutral';
  }

  return {
    labelStatusText,
    shipmentStatusText,
    labelStatusTone,
    shipmentStatusTone,
  };
}

/**
 * Formats created date/time for display
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {Object} { dateText, timeText }
 */
export function formatCreatedAt(dateString) {
  if (!dateString) {
    return { dateText: '—', timeText: '' };
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { dateText: '—', timeText: '' };
    }

    // Format date: "Dec 24, 2025"
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const dateText = dateFormatter.format(date);

    // Format time: "1:26 PM"
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const timeText = timeFormatter.format(date);

    return { dateText, timeText };
  } catch (error) {
    console.error('Error formatting date:', error);
    return { dateText: '—', timeText: '' };
  }
}

