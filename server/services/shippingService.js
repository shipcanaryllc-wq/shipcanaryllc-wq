const axios = require('axios');
// 2) Import dedicated ShipLabel client that ALWAYS uses SHIPLABEL_API_KEY
const { shiplabel } = require('./shiplabelClient');

/**
 * Normalize ShipLabel create-order response
 * Handles multiple response shapes:
 * - { success: true, data: {...} }
 * - { success: { data: {...} } }
 * - { data: {...} }
 */
function normalizeShipLabelCreateOrderResponse(body) {
  const data =
    body?.data ??
    body?.success?.data ??
    (body?.success === true ? body?.data : null);

  const ok = Boolean(
    data?.pdf ||
    data?.tracking_id ||
    data?.label_created === "success"
  );

  return { ok, data, raw: body };
}

/**
 * Normalize ShipLabel /services response
 * Handles multiple response shapes:
 * - { success: true, data: [...] }
 * - { success: { labels: [...] } }
 */
function normalizeShipLabelServicesResponse(body) {
  const labels =
    (body?.success === true && Array.isArray(body?.data)) ? body.data :
    Array.isArray(body?.success?.labels) ? body.success.labels :
    [];
  
  return labels;
}

/**
 * Unified Shipping Service with Failover
 * 
 * PRIMARY: ShipLabel.net API
 * BACKUP: ShippFast API (existing provider)
 * 
 * Failover rules:
 * - Timeout, network errors, 5xx → fallback to backup
 * - 4xx errors → throw (don't fallback)
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * @typedef {Object} Address
 * @property {string} name
 * @property {string} [company]
 * @property {string} street1
 * @property {string} [street2]
 * @property {string} city
 * @property {string} state
 * @property {string} zip
 * @property {string} country
 */

/**
 * @typedef {Object} Parcel
 * @property {number} weight - Weight in lbs
 * @property {number} length - Length in inches
 * @property {number} width - Width in inches
 * @property {number} height - Height in inches
 */

/**
 * @typedef {Object} RateRequest
 * @property {Address} fromAddress
 * @property {Address} toAddress
 * @property {Parcel[]} parcels
 */

/**
 * @typedef {Object} RateOption
 * @property {string} carrier - e.g., "USPS"
 * @property {string} service - Service name
 * @property {string} currency - e.g., "USD"
 * @property {number} amount - Price in currency
 * @property {number} [etaDays] - Estimated delivery days
 * @property {"primary"|"backup"} provider - Which provider returned this rate
 * @property {any} [raw] - Raw provider response
 */

/**
 * @typedef {Object} LabelRequest
 * @property {string} rateId - Rate/service ID from provider
 * @property {string} [shipmentId] - Optional shipment ID
 * @property {any} from - From address object
 * @property {any} to - To address object
 * @property {number} weight - Weight in lbs
 * @property {number} length - Length in inches
 * @property {number} width - Width in inches
 * @property {number} height - Height in inches
 * @property {any} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} LabelResult
 * @property {string} trackingNumber
 * @property {string} labelUrl
 * @property {string} carrier
 * @property {string} service
 * @property {"primary"|"backup"} provider
 * @property {number} [price]
 * @property {any} [raw] - Raw provider response
 */

// ============================================================================
// PRIMARY PROVIDER: ShipLabel.net
// ============================================================================

// OLD CODE REMOVED - Now using dedicated shiplabelClient.js
// The dedicated client ALWAYS uses SHIPLABEL_API_KEY and never gets overridden

/**
 * Get rates from ShipLabel.net (PRIMARY)
 * POST /api/v2/services
 */
async function getRatesFromPrimary(request) {
  console.log('\n[SHIPPING SERVICE] ════════════════════════════════════════════════════════════════');
  console.log('[SHIPPING SERVICE] 🟢 GETTING RATES FROM SHIPLABEL.NET');
  console.log('[SHIPPING SERVICE] ════════════════════════════════════════════════════════════════');
  console.log('[SHIPPING SERVICE] Using dedicated shiplabel client (ALWAYS uses SHIPLABEL_API_KEY)');
  console.log('[SHIPPING SERVICE] Endpoint: /services');
  console.log('[SHIPPING SERVICE] Request Body: {} (empty as per API docs)');
  
  try {
    // 2) Services fetch: Call POST /services with {}
    console.log('[SHIPPING SERVICE] Making POST request to ShipLabel /services endpoint...');
    console.log('[SHIPPING SERVICE] Base URL:', shiplabel.defaults.baseURL);
    console.log('[SHIPPING SERVICE] Auth header present:', !!shiplabel.defaults.headers.Authorization);
    console.log('[SHIPPING SERVICE] Auth header preview:', shiplabel.defaults.headers.Authorization?.slice(0, 20) + '...');
    const res = await shiplabel.post('/services', {});
    console.log('[SHIPPING SERVICE] ✅ Response received:', res.status, res.statusText);
    
    // Log raw response for debugging
    const rawResponseStr = JSON.stringify(res.data);
    console.log('[SHIPPING SERVICE] Raw ShipLabel response (first 500 chars):', rawResponseStr.slice(0, 500));
    console.log('[SHIPPING SERVICE] Full response:', JSON.stringify(res.data, null, 2));

    // 4) Normalize ShipLabel /services response - support BOTH schemas
    const labels = normalizeShipLabelServicesResponse(res.data);
    
    console.log('[SHIPPING SERVICE] Parsed labels:', labels.length);
    console.log('[SHIPPING SERVICE] Labels array:', JSON.stringify(labels, null, 2));
    
    // If labels empty, throw provider error with truncated raw response
    if (labels.length === 0) {
      const errorMsg = 'ShipLabel returned no shipping services. Check API key and account status.';
      const error = new Error(errorMsg);
      error.status = 502; // Bad Gateway
      error.response = res;
      error.provider = 'shiplabel';
      error.details = JSON.stringify(res.data).slice(0, 500); // Truncated raw response
      console.error('[SHIPPING SERVICE] ❌ No labels found in response');
      console.error('[SHIPPING SERVICE] Response preview:', error.details);
      throw error;
    }
    
    // 3) Normalize labels into: { id: String(id), name, type, max_weight, price_ranges }
    const rates = labels.map((label, index) => {
      // Extract price from price_ranges (use first range or average)
      let price = 0;
      if (label.price_ranges && label.price_ranges.length > 0) {
        const priceStr = label.price_ranges[0].price || '$0';
        price = parseFloat(priceStr.replace('$', '').replace(',', '')) || 0;
      }

      // Normalize to our rate format
      const rate = {
        carrier: 'USPS',
        service: label.name || 'Unknown Service',
        currency: 'USD',
        amount: price,
        provider: 'primary',
        raw: label,
        rateId: String(label.id || label.id) // Use ShipLabel label.id
      };
      
      console.log(`[SHIPPING SERVICE] Rate ${index + 1}:`, {
        id: rate.rateId,
        service: rate.service,
        price: rate.amount,
        shipLabelLabelId: label.id,
        maxWeight: label.max_weight,
        type: label.type
      });
      
      return rate;
    });

    console.log(`[SHIPPING SERVICE] ✅ PRIMARY provider returned ${rates.length} rates`);
    console.log('[SHIPPING SERVICE] ════════════════════════════════════════════════════════════════\n');
    return rates;
  } catch (error) {
    console.error('\n[SHIPPING SERVICE] ════════════════════════════════════════════════════════════════');
    console.error('[SHIPPING SERVICE] ❌ ERROR GETTING RATES FROM SHIPLABEL.NET');
    console.error('[SHIPPING SERVICE] ════════════════════════════════════════════════════════════════');
    console.error('[SHIPPING SERVICE] Error message:', error.message);
    console.error('[SHIPPING SERVICE] Error type:', error.name);
    
    if (error.response) {
      console.error('[SHIPPING SERVICE] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('[SHIPPING SERVICE] HTTP RESPONSE ERROR:');
      console.error('[SHIPPING SERVICE] Response status:', error.response.status);
      console.error('[SHIPPING SERVICE] Response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * Create label from ShipLabel.net (PRIMARY)
 * POST https://www.shiplabel.net/api/v2/create-order
 * Authorization: Bearer {SHIPLABEL_API_KEY}
 */
async function createLabelFromPrimary(request) {
  console.log('\n[SHIPPING SERVICE] ════════════════════════════════════════════════════════════════');
  console.log('[SHIPPING SERVICE] 🟢 CREATING LABEL WITH SHIPLABEL.NET');
  console.log('[SHIPPING SERVICE] ════════════════════════════════════════════════════════════════');
  console.log('[SHIPPING SERVICE] Rate ID received:', request.rateId);
  
  try {
    // 4) Create-order: Build payload EXACTLY per docs keys
    const labelId = String(request.rateId); // Should be service.id from ShipLabel /services response
    
    console.log('[SHIPPING SERVICE] Using label_id (from ShipLabel service.id):', labelId);
    
    // Input validation: fromCountry/toCountry must be "US" style, not "USA"
    const normalizeCountry = (country) => {
      if (!country) return 'US';
      const normalized = country.trim().toUpperCase();
      // Convert "USA" to "US" unless provider requires otherwise
      return normalized === 'USA' ? 'US' : normalized;
    };
    
    // 4) Build payload EXACTLY per docs keys
    const payload = {
      label_id: labelId,
      fromName: (request.from.name || '').trim(),
      fromCompany: (request.from.company || '').trim(),
      fromAddress: (request.from.street1 || request.from.address || '').trim(),
      fromAddress2: (request.from.street2 || request.from.address2 || '').trim(),
      fromZip: (request.from.zip || '').trim(),
      fromState: (request.from.state || '').trim(),
      fromCity: (request.from.city || '').trim(),
      fromCountry: normalizeCountry(request.from.country || 'US'),
      toName: (request.to.name || '').trim(),
      toCompany: (request.to.company || '').trim(),
      toAddress: (request.to.street1 || request.to.address || '').trim(),
      toAddress2: (request.to.street2 || request.to.address2 || '').trim(),
      toZip: (request.to.zip || '').trim(),
      toState: (request.to.state || '').trim(),
      toCity: (request.to.city || '').trim(),
      toCountry: normalizeCountry(request.to.country || 'US'),
      weight: Number(request.weight) || 0,
      length: Number(request.length) || 0,
      height: Number(request.height) || 0,
      width: Number(request.width) || 0,
      reference_1: (request.metadata?.reference1 || '').trim() || undefined,
      reference_2: (request.metadata?.reference2 || '').trim() || undefined,
      discription: (request.metadata?.description || '').trim() || undefined, // NOTE: ShipLabel docs use "discription" typo
    };
    
    // Remove undefined/empty fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === '') {
        delete payload[key];
      }
    });
    
    console.log('[SHIPPING SERVICE] Request payload:', JSON.stringify(payload, null, 2));
    console.log('[SHIPPING SERVICE] Making POST request to ShipLabel /create-order endpoint...');
    console.log('[SHIPPING SERVICE] Base URL:', shiplabel.defaults.baseURL);
    console.log('[SHIPPING SERVICE] Auth header present:', !!shiplabel.defaults.headers.Authorization);
    console.log('[SHIPPING SERVICE] Auth header preview:', shiplabel.defaults.headers.Authorization?.slice(0, 20) + '...');
    
    // Call ShipLabel using dedicated client
    const res = await shiplabel.post('/create-order', payload);
    console.log('[SHIPPING SERVICE] ✅ Response received:', res.status, res.statusText);
    console.log('[SHIPPING SERVICE] Full response:', JSON.stringify(res.data, null, 2));

    // 1) Normalize ShipLabel create-order response
    const { ok, data } = normalizeShipLabelCreateOrderResponse(res.data);
    
    if (!ok) {
      const errorMsg = 'ShipLabel returned invalid order response';
      const error = new Error(errorMsg);
      error.status = 502; // Bad Gateway
      error.response = res;
      error.provider = 'shiplabel';
      error.details = JSON.stringify(res.data).slice(0, 500); // Body preview
      console.error('[SHIPPING SERVICE] ❌ Invalid order response');
      console.error('[SHIPPING SERVICE] Response preview:', error.details);
      throw error;
    }
    
    // Normalize to LabelResult
    // IMPORTANT: provider is set to 'primary' to indicate ShipLabel.net was used
    const result = {
      trackingNumber: data.tracking_id,
      labelUrl: data.pdf,
      carrier: 'USPS',
      service: request.metadata?.labelTypeId || request.rateId,
      provider: 'primary', // 'primary' = ShipLabel.net (PRIMARY PROVIDER)
      price: parseFloat(data.price) || undefined,
      raw: res.data
    };

    console.log('[SHIPPING SERVICE] ✅ ShipLabel: PRIMARY SUCCESS');
    console.log('[SHIPPING SERVICE] Tracking Number:', result.trackingNumber);
    console.log('[SHIPPING SERVICE] Label URL:', result.labelUrl);
    console.log('[SHIPPING SERVICE] Price:', result.price);
    
    return result;
  } catch (error) {
    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('[SHIPPING SERVICE] ❌ PRIMARY provider (ShipLabel.net) error:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error message:', error.message);
    console.error('Error status:', error.status);
    
    // 6) Return 502 (not 400) when ShipLabel fails; include provider body preview in details
    if (!error.status) {
      error.status = 502; // Bad Gateway for ShipLabel failures
    }
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response status text:', error.response.statusText);
      console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      
      // Include body preview in details if not already set
      if (!error.details && error.response.data) {
        error.details = JSON.stringify(error.response.data).slice(0, 500);
      }
      
      // Check for authentication errors specifically
      if (error.response.status === 400 || error.response.status === 401) {
        const responseData = error.response.data || {};
        const errorMessage = typeof responseData === 'string' ? responseData : 
                           responseData.message || 
                           responseData.error || 
                           JSON.stringify(responseData);
        
        if (errorMessage.toLowerCase().includes('unauth') || 
            errorMessage.toLowerCase().includes('invalid') ||
            errorMessage.toLowerCase().includes('token') ||
            errorMessage.toLowerCase().includes('api key')) {
          console.error('\n⚠️  AUTHENTICATION ERROR DETECTED:');
          console.error('   This appears to be an API key authentication issue.');
          console.error('   Check that SHIPLABEL_API_KEY is set correctly in your .env file.');
          const apiKey = process.env.SHIPLABEL_API_KEY || '';
          console.error('   Key length:', apiKey.length);
          // Key preview removed for security - only log length
        }
      }
    } else if (error.request) {
      console.error('Request was made but no response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    // Ensure provider is set
    if (!error.provider) {
      error.provider = 'shiplabel';
    }
    
    // Preserve error details
    if (error.details) {
      console.error('Error details:', error.details);
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Enhance error with more context
    const enhancedError = new Error(error.message);
    enhancedError.response = error.response;
    enhancedError.status = error.response?.status;
    enhancedError.provider = 'shiplabel';
    enhancedError.originalError = error;
    throw enhancedError;
  }
}

// ============================================================================
// BACKUP PROVIDER: ShippFast (existing)
// ============================================================================

const shippfast = require('./shippfast');

/**
 * Get rates from ShippFast (BACKUP)
 * Note: ShippFast doesn't have a rates API, so we return their label types as rates
 */
async function getRatesFromBackup(request) {
  console.log('[SHIPPING SERVICE] 🟡 Attempting BACKUP provider (ShippFast) for rates');
  
  try {
    // ShippFast doesn't have dynamic rates API, so we use their label types
    const labelTypes = shippfast.getLabelTypes();
    
    // Filter by weight/dimensions if needed
    const totalDimensions = (request.parcels[0]?.length || 0) + 
                           (request.parcels[0]?.width || 0) + 
                           (request.parcels[0]?.height || 0);
    const weight = request.parcels[0]?.weight || 1;
    
    const rates = labelTypes
      .filter(type => {
        return weight <= type.maxWeight && totalDimensions <= type.maxDimensions;
      })
      .map(type => ({
        carrier: 'USPS',
        service: type.name,
        currency: 'USD',
        amount: type.price,
        provider: 'backup',
        raw: type,
        rateId: type.id.toString()
      }));

    console.log(`[SHIPPING SERVICE] ✅ BACKUP provider returned ${rates.length} rates`);
    return rates;
  } catch (error) {
    console.error('[SHIPPING SERVICE] ❌ BACKUP provider error:', error.message);
    throw error;
  }
}

/**
 * Create label from ShippFast (BACKUP)
 * Only called when ShipLabel.net (PRIMARY) fails
 */
async function createLabelFromBackup(request) {
  console.log('[SHIPPING SERVICE] 🟡 ShipFast: BACKUP - Attempting label creation');
  
  try {
    // Get label type to find API ID
    const labelType = shippfast.getLabelTypeById(request.rateId);
    if (!labelType) {
      throw new Error(`Label type ${request.rateId} not found`);
    }

    // Build ShippFast order payload
    const orderData = {
      label_type_id: labelType.apiId,
      weight: request.weight,
      from_country: request.from.country || 'US',
      from_name: request.from.name || '',
      from_company: request.from.company || null,
      from_street: request.from.street1 || request.from.address || '',
      from_street2: request.from.street2 || request.from.address2 || null,
      from_city: request.from.city || '',
      from_state: request.from.state || '',
      from_zip: request.from.zip || '',
      to_country: request.to.country || 'US',
      to_name: request.to.name || '',
      to_company: request.to.company || null,
      to_street: request.to.street1 || request.to.address || '',
      to_street2: request.to.street2 || request.to.address2 || null,
      to_city: request.to.city || '',
      to_state: request.to.state || '',
      to_zip: request.to.zip || '',
      length: request.length || 1,
      width: request.width || 1,
      height: request.height || 1,
      english_product_name: request.metadata?.englishProductName || 'Shipping Package',
      description: request.metadata?.description || '',
      reference_1: request.metadata?.reference1 || null,
      reference_2: request.metadata?.reference2 || null
    };

    const shippfastOrder = await shippfast.createOrder(orderData);

    if (shippfastOrder.status !== 'success') {
      throw new Error(shippfastOrder.status_reason || shippfastOrder.message || 'Failed to create label');
    }

    // Normalize to LabelResult
    // IMPORTANT: provider is set to 'backup' to indicate ShipFast was used as fallback
    const result = {
      trackingNumber: shippfastOrder.tracking_id || '',
      labelUrl: shippfastOrder.pdf || '',
      carrier: 'USPS',
      service: labelType.name,
      provider: 'backup', // 'backup' = ShipFast (BACKUP PROVIDER - only used if primary fails)
      price: parseFloat(shippfastOrder.price) || undefined,
      raw: shippfastOrder
    };

    console.log('[SHIPPING SERVICE] ✅ ShipFast: BACKUP SUCCESS');
    console.log('[SHIPPING SERVICE] Tracking Number:', result.trackingNumber);
    console.log('[SHIPPING SERVICE] Label URL:', result.labelUrl);
    console.log('[SHIPPING SERVICE] Price:', result.price);
    return result;
  } catch (error) {
    console.error('[SHIPPING SERVICE] ❌ ShipFast: BACKUP FAILED');
    console.error('[SHIPPING SERVICE] Error:', error.message);
    throw error;
  }
}

// ============================================================================
// FAILOVER LOGIC
// ============================================================================

/**
 * Check if error should trigger failover
 * @param {Error} error - The error object
 * @returns {boolean} - True if should failover, false if should throw
 */
function shouldFailover(error) {
  // Failover rules:
  // - Network errors, timeouts, 5xx → FAILOVER
  // - 4xx errors → FAILOVER (including auth errors - allows system to continue working)
  // - Invalid responses → FAILOVER
  
  // Network errors, timeouts, 5xx = always failover
  if (error.code === 'ECONNABORTED' || // timeout
      error.code === 'ENOTFOUND' || // DNS error
      error.code === 'ECONNREFUSED' || // connection refused
      error.code === 'ETIMEDOUT' || // timeout
      (error.response && error.response.status >= 500)) {
    console.log('[SHIPPING SERVICE] Network/5xx error detected - will failover');
    return true;
  }

  // Network errors without response = failover
  if (!error.response && error.message) {
    console.log('[SHIPPING SERVICE] Network error (no response) - will failover');
    return true;
  }

  // 4xx errors (including 400, 401) = failover to allow system to continue
  if (error.response && error.response.status >= 400 && error.response.status < 500) {
    const responseData = error.response.data || {};
    const errorMessage = (typeof responseData === 'string' ? responseData : 
                         responseData.message || 
                         responseData.error || 
                         JSON.stringify(responseData)).toLowerCase();
    
    // Check if it's a service/label ID not found error
    const isServiceNotFound = errorMessage.includes('label') || 
                             errorMessage.includes('service') || 
                             errorMessage.includes('not found');
    
    if (isServiceNotFound) {
      console.log('[SHIPPING SERVICE] Service/label ID not found - will failover');
      return true;
    }
    
    // All other 4xx errors (including auth) = failover
    console.log('[SHIPPING SERVICE] 4xx error detected - will failover to backup');
    return true;
  }

  // Default: don't failover (shouldn't reach here)
  return false;
}

/**
 * Get rates (ShippFast disabled - ShipLabel only)
 */
async function getRatesWithFailover(request) {
  try {
    // Only use ShipLabel (ShippFast disabled)
    const rates = await getRatesFromPrimary(request);
    return rates;
  } catch (primaryError) {
    // No failover - throw error
    console.log('[SHIPPING SERVICE] ⚠️ ShipLabel failed - ShippFast is DISABLED, not failing over');
    throw primaryError;
  }
}

/**
 * Create label with automatic failover
 * 
 * PRIMARY PROVIDER: ShipLabel.net (https://www.shiplabel.net/api/v2/create-order)
 * FALLBACK PROVIDER: DISABLED - ShippFast is disabled until launch
 * 
 * This function ONLY uses ShipLabel.net. ShippFast failover is disabled.
 * 
 * @param {LabelRequest} request - Label creation request
 * @returns {Promise<LabelResult>} Label result with provider field indicating which API was used
 */
async function createLabelWithFailover(request) {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║           SHIPPING SERVICE: LABEL CREATION (SHIPLABEL ONLY)                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('[SHIPPING SERVICE] PRIMARY PROVIDER: ShipLabel.net');
  console.log('[SHIPPING SERVICE] FALLBACK PROVIDER: DISABLED (ShippFast disabled until launch)');
  console.log('[SHIPPING SERVICE] ========================================\n');
  
  // ============================================================================
  // STEP 1: ONLY try ShipLabel.net (ShippFast disabled)
  // ============================================================================
  console.log('[SHIPPING SERVICE] 🟢 Attempting ShipLabel.net');
  console.log('[SHIPPING SERVICE]    URL: https://www.shiplabel.net/api/v2/create-order');
  const apiKeyForLog = process.env.SHIPLABEL_API_KEY || '';
  console.log('[SHIPPING SERVICE]    Key length:', apiKeyForLog.length);
  // Key preview removed for security - only log length
  
  try {
    const result = await createLabelFromPrimary(request);
    
    // SUCCESS: ShipLabel worked
    console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ SHIPLABEL SUCCESS                                     ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    console.log('[SHIPPING SERVICE] ✅ ShipLabel.net succeeded');
    console.log('[SHIPPING SERVICE] ✅ Provider used: shiplabel');
    console.log('[SHIPPING SERVICE] ✅ Tracking Number:', result.trackingNumber);
    console.log('[SHIPPING SERVICE] ✅ Label URL:', result.labelUrl);
    console.log('[SHIPPING SERVICE] ✅ Price:', result.price);
    console.log('[SHIPPING SERVICE] ⚠️  ShippFast (BACKUP) is disabled - not called\n');
    
    // Ensure provider is set correctly
    result.provider = 'primary'; // or 'shiplabel' for consistency
    return result;
    
  } catch (primaryError) {
    // PRIMARY FAILED: Throw error (no failover)
    console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    ❌ SHIPLABEL FAILED                                      ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    console.error('[SHIPPING SERVICE] ❌ ShipLabel.net failed');
    console.error('[SHIPPING SERVICE] ❌ Error message:', primaryError.message);
    console.error('[SHIPPING SERVICE] ❌ Error status:', primaryError.response?.status);
    console.error('[SHIPPING SERVICE] ❌ Error response:', JSON.stringify(primaryError.response?.data, null, 2));
    console.error('[SHIPPING SERVICE] ⚠️  ShippFast (BACKUP) is DISABLED - not failing over');
    console.error('[SHIPPING SERVICE] ⚠️  Throwing error\n');
    
    throw primaryError;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  getRatesWithFailover,
  createLabelWithFailover,
  // Expose individual functions for testing
  getRatesFromPrimary,
  getRatesFromBackup,
  createLabelFromPrimary,
  createLabelFromBackup,
  // Normalization helpers
  normalizeShipLabelServicesResponse,
  normalizeShipLabelCreateOrderResponse
};
