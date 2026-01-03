const express = require('express');
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const trackingmore = require('../services/trackingmore');

const router = express.Router();

/**
 * Normalize TrackingMore response to our standard format
 */
function normalizeTrackingStatus(trackingData) {
  if (!trackingData || !trackingData.data) {
    return {
      trackingNumber: trackingData?.tracking_number || 'unknown',
      status: 'NO_SCAN',
      deliveryStatus: null,
      substatus: null,
      latestEvent: null,
      latestCheckpointTime: null,
      checkpoints: []
    };
  }

  const data = trackingData.data;
  const trackingNumber = data.tracking_number || 'unknown';
  const originInfo = data.origin_info || {};
  const trackInfo = originInfo.trackinfo || [];
  const deliveryStatus = data.delivery_status || null;

  // Get latest checkpoint
  let latestCheckpoint = null;
  let latestCheckpointTime = null;
  let latestEvent = null;

  if (trackInfo.length > 0) {
    // Sort by checkpoint_time (newest first)
    const sortedCheckpoints = [...trackInfo].sort((a, b) => {
      const timeA = a.checkpoint_time ? new Date(a.checkpoint_time).getTime() : 0;
      const timeB = b.checkpoint_time ? new Date(b.checkpoint_time).getTime() : 0;
      return timeB - timeA;
    });
    latestCheckpoint = sortedCheckpoints[0];
    latestCheckpointTime = latestCheckpoint.checkpoint_time ? new Date(latestCheckpoint.checkpoint_time) : null;
    latestEvent = latestCheckpoint.tracking_detail || latestCheckpoint.checkpoint_status || null;
  }

  // Normalize status based on rules
  let normalizedStatus = 'NO_SCAN';
  let substatus = null;

  if (trackInfo.length === 0 && !deliveryStatus) {
    normalizedStatus = 'NO_SCAN';
  } else if (latestCheckpoint && latestCheckpoint.checkpoint_delivery_status === 'inforeceived') {
    normalizedStatus = 'LABEL_CREATED';
  } else if (latestCheckpoint && ['transit', 'pickup'].includes(latestCheckpoint.checkpoint_delivery_status)) {
    normalizedStatus = 'IN_TRANSIT';
  } else if (latestCheckpoint && latestCheckpoint.tracking_detail && 
             latestCheckpoint.tracking_detail.toLowerCase().includes('out for delivery')) {
    normalizedStatus = 'OUT_FOR_DELIVERY';
  } else if (deliveryStatus === 'delivered' || 
             (latestCheckpoint && latestCheckpoint.checkpoint_delivery_status === 'delivered')) {
    normalizedStatus = 'DELIVERED';
  } else if (deliveryStatus && ['exception', 'failure', 'expired'].some(s => deliveryStatus.toLowerCase().includes(s))) {
    normalizedStatus = 'EXCEPTION';
  } else if (trackInfo.length > 0) {
    normalizedStatus = 'IN_TRANSIT';
  }

  substatus = latestCheckpoint?.checkpoint_delivery_status || deliveryStatus || null;

  return {
    trackingNumber,
    status: normalizedStatus,
    providerId: data.id || null,
    deliveryStatus,
    substatus,
    latestEvent,
    latestCheckpointTime,
    checkpoints: trackInfo
  };
}

/**
 * GET /api/tracking/status?tracking_numbers=NUM1,NUM2,...
 * Get tracking status for multiple tracking numbers
 */
router.get('/status', auth, async (req, res) => {
  try {
    const trackingNumbersStr = req.query.tracking_numbers;
    if (!trackingNumbersStr) {
      return res.status(400).json({ 
        ok: false, 
        message: 'tracking_numbers query parameter required' 
      });
    }

    const trackingNumbers = trackingNumbersStr.split(',').map(n => n.trim()).filter(Boolean);
    if (trackingNumbers.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: 'At least one tracking number required' 
      });
    }

    console.log('[Tracking] Fetching status for', trackingNumbers.length, 'tracking numbers');

    // Call TrackingMore API
    const providerResponses = await trackingmore.trackingmoreGetMany(trackingNumbers);

    // Normalize responses
    const normalized = providerResponses.map(resp => ({
      ...normalizeTrackingStatus(resp),
      raw: resp.data || {}
    }));

    // Update database for each tracking number
    for (const normalizedItem of normalized) {
      try {
        const order = await Order.findOne({ 
          trackingNumber: normalizedItem.trackingNumber,
          userId: req.user._id 
        });

        if (order) {
          order.trackingStatus = normalizedItem.status;
          order.trackingSubstatus = normalizedItem.substatus;
          order.latestEvent = normalizedItem.latestEvent;
          order.latestCheckpointTime = normalizedItem.latestCheckpointTime;
          order.lastTrackingSyncAt = new Date();
          order.trackingEvents = normalizedItem.checkpoints || [];
          
          // Find the provider response for this tracking number
          const providerResp = providerResponses.find(r => 
            r.data?.tracking_number === normalizedItem.trackingNumber
          );
          if (providerResp) {
            order.trackingRawPayload = providerResp.data || {};
          }

          await order.save();
        }
      } catch (dbError) {
        console.error('[Tracking] Error updating order in DB:', dbError);
        // Continue with other orders
      }
    }

    res.json({
      ok: true,
      data: normalized
    });
  } catch (error) {
    console.error('[Tracking] Error fetching status:', error);
    res.status(error.status || 500).json({
      ok: false,
      message: error.message || 'Failed to fetch tracking status',
      error: error.data || {}
    });
  }
});

/**
 * GET /api/tracking/debug/:trackingNumber
 * Debug endpoint to test TrackingMore integration
 */
router.get('/debug/:trackingNumber', auth, async (req, res) => {
  const trackingNumber = req.params.trackingNumber;
  const trace = [];

  try {
    // Step 1: Create tracking (idempotent)
    trace.push({ step: 'create', endpoint: '/trackings/create', status: 'pending' });
    let createResponse;
    try {
      createResponse = await trackingmore.trackingmoreCreate(trackingNumber);
      trace.push({ 
        step: 'create', 
        endpoint: '/trackings/create', 
        status: 'success',
        body: createResponse
      });
    } catch (createError) {
      trace.push({ 
        step: 'create', 
        endpoint: '/trackings/create', 
        status: 'error',
        body: createError.data || createError.message
      });
      // Continue even if create fails (might already exist)
    }

    // Step 2: Get tracking updates
    trace.push({ step: 'get', endpoint: '/trackings/get', status: 'pending' });
    let getResponse;
    try {
      const responses = await trackingmore.trackingmoreGetMany([trackingNumber]);
      getResponse = responses[0] || null;
      trace.push({ 
        step: 'get', 
        endpoint: '/trackings/get', 
        status: 'success',
        body: getResponse
      });
    } catch (getError) {
      trace.push({ 
        step: 'get', 
        endpoint: '/trackings/get', 
        status: 'error',
        body: getError.data || getError.message
      });
      throw getError;
    }

    // Step 3: Normalize
    const normalized = normalizeTrackingStatus(getResponse);
    const extractedEventsCount = normalized.checkpoints?.length || 0;

    // Log trace server-side
    console.log('[Tracking Debug] Trace for', trackingNumber);
    trace.forEach(t => {
      console.log(`  [${t.step}] ${t.endpoint}: ${t.status}`);
    });

    res.json({
      ok: true,
      rawCreate: createResponse || null,
      rawGet: getResponse || null,
      normalized,
      extractedEventsCount,
      trace
    });
  } catch (error) {
    console.error('[Tracking Debug] Error:', error);
    res.status(error.status || 500).json({
      ok: false,
      message: error.message || 'Debug request failed',
      trace,
      error: error.data || {}
    });
  }
});

module.exports = router;

