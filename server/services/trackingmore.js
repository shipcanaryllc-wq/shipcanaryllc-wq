const axios = require('axios');

const BASE_URL = 'https://api.trackingmore.com/v4';
const API_KEY = process.env.TRACKINGMORE_API_KEY;

if (!API_KEY) {
  console.warn('[TrackingMore] ⚠️  TRACKINGMORE_API_KEY not set in environment variables');
}

/**
 * Create a tracking in TrackingMore
 * @param {string} trackingNumber - USPS tracking number
 * @returns {Promise<Object>} Provider response
 */
async function trackingmoreCreate(trackingNumber) {
  if (!API_KEY) {
    throw new Error('TRACKINGMORE_API_KEY not configured');
  }

  const url = `${BASE_URL}/trackings/create`;
  const payload = {
    tracking_number: trackingNumber,
    courier_code: 'usps'
  };

  const headers = {
    'Tracking-Api-Key': API_KEY,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  try {
    console.log('[TrackingMore] Creating tracking:', trackingNumber);
    const response = await axios.post(url, payload, { headers });
    
    // Handle "already exists" as success (idempotent)
    if (response.data && response.data.meta && response.data.meta.code === 4101) {
      console.log('[TrackingMore] Tracking already exists (idempotent):', trackingNumber);
      return {
        ok: true,
        alreadyExists: true,
        data: response.data.data || {},
        meta: response.data.meta
      };
    }

    return {
      ok: true,
      alreadyExists: false,
      data: response.data.data || {},
      meta: response.data.meta || {}
    };
  } catch (error) {
    // Handle "already exists" error code
    if (error.response && error.response.data && error.response.data.meta && error.response.data.meta.code === 4101) {
      console.log('[TrackingMore] Tracking already exists (error response):', trackingNumber);
      return {
        ok: true,
        alreadyExists: true,
        data: error.response.data.data || {},
        meta: error.response.data.meta
      };
    }

    console.error('[TrackingMore] Create error:', error.response?.data || error.message);
    throw {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message,
      data: error.response?.data || {}
    };
  }
}

/**
 * Get tracking updates for multiple tracking numbers
 * @param {string[]} trackingNumbers - Array of USPS tracking numbers
 * @returns {Promise<Object[]>} Array of provider responses
 */
async function trackingmoreGetMany(trackingNumbers) {
  if (!API_KEY) {
    throw new Error('TRACKINGMORE_API_KEY not configured');
  }

  if (!Array.isArray(trackingNumbers) || trackingNumbers.length === 0) {
    return [];
  }

  const url = `${BASE_URL}/trackings/get`;
  const trackingNumbersStr = trackingNumbers.join(',');
  const params = { tracking_numbers: trackingNumbersStr };

  const headers = {
    'Tracking-Api-Key': API_KEY,
    'Accept': 'application/json'
  };

  try {
    console.log('[TrackingMore] Getting tracking updates for:', trackingNumbers.length, 'numbers');
    const response = await axios.get(url, { params, headers });
    
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data.map(item => ({
        ok: true,
        data: item,
        meta: response.data.meta || {}
      }));
    }

    return [];
  } catch (error) {
    console.error('[TrackingMore] GetMany error:', error.response?.data || error.message);
    throw {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message,
      data: error.response?.data || {}
    };
  }
}

module.exports = {
  trackingmoreCreate,
  trackingmoreGetMany
};



