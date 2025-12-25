const axios = require('axios');

// 1) Backend env vars: SHIPLABEL_API_KEY and SHIPLABEL_BASE_URL
// Note: This should already be validated at startup in server/index.js
const baseURL = process.env.SHIPLABEL_BASE_URL || 'https://www.shiplabel.net/api/v2';

// 1) Create ShipLabel axios client
// - baseURL from env SHIPLABEL_BASE_URL default "https://www.shiplabel.net/api/v2"
// - NEVER use user JWT for ShipLabel calls
// - ALWAYS override Authorization header in request interceptor to prevent header forwarding
const shiplabel = axios.create({
  baseURL: baseURL,
  timeout: 20000,
  maxRedirects: 0, // Prevent redirects
});

// CRITICAL: Request interceptor that ALWAYS overrides Authorization header
// This ensures user JWT from incoming requests NEVER gets forwarded to ShipLabel
shiplabel.interceptors.request.use((config) => {
  // Get API key and trim whitespace
  const k = (process.env.SHIPLABEL_API_KEY || '').trim();
  
  // Initialize headers if not present
  config.headers = config.headers || {};
  
  // ALWAYS override Authorization header with ShipLabel API key (never use user JWT)
  config.headers.Authorization = `Bearer ${k}`;
  
  // Set default headers
  config.headers.Accept = 'application/json';
  config.headers['Content-Type'] = 'application/json';
  
  // Remove any x-auth-token headers that might leak from incoming requests
  delete config.headers['x-auth-token'];
  delete config.headers['X-Auth-Token'];
  
  // Log request details (for debugging - NO secrets)
  console.log('[SHIPLABEL CLIENT] Outgoing request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
    fullURL: (config.baseURL || '') + (config.url || ''),
    hasAuthHeader: !!config.headers.Authorization,
    authHeaderLength: String(config.headers.Authorization || '').length,
    contentType: config.headers['Content-Type'],
  });
  
  return config;
}, (error) => {
  console.error('[SHIPLABEL CLIENT] Request interceptor error:', error);
  return Promise.reject(error);
});

// Add response interceptor to log responses (for debugging)
shiplabel.interceptors.response.use(
  (response) => {
    console.log('[SHIPLABEL CLIENT] Response received:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    console.error('[SHIPLABEL CLIENT] Response error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

// 6) Test function to verify auth
async function testShipLabelAuth() {
  try {
    console.log('[ShipLabel Client] Testing authentication with /services endpoint...');
    const response = await shiplabel.post('/services', {});
    console.log('[ShipLabel Client] ✅ Auth test successful:', {
      status: response.status,
      success: response.data?.success,
      hasData: Boolean(response.data?.data),
    });
    return { success: true, response };
  } catch (error) {
    console.error('[ShipLabel Client] ❌ Auth test failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    return { success: false, error };
  }
}

module.exports = {
  shiplabel,
  testShipLabelAuth,
};

