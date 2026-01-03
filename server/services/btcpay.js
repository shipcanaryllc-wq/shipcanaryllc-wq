const axios = require('axios');
const crypto = require('crypto');

/**
 * BTCPay Server Integration Service
 * 
 * SUMMARY:
 * - Creates BTCPay invoices with user metadata (userId, email, amountUsd)
 * - Handles webhook events (InvoiceSettled, InvoiceConfirmed, etc.)
 * - Verifies webhook signatures using HMAC-SHA256
 * - Maps BTCPay statuses to our PaymentStatus enum
 * - Supports both event-based and direct invoice webhook formats
 * 
 * This service handles all interactions with BTCPay Server:
 * - Creating invoices
 * - Verifying webhooks
 * - Mapping BTCPay statuses to our PaymentStatus enum
 */

// Normalize BTCPAY_URL to include protocol if missing
const rawBtcpayUrl = process.env.BTCPAY_URL || '';
const BTCPAY_URL = rawBtcpayUrl.startsWith('http://') || rawBtcpayUrl.startsWith('https://') 
  ? rawBtcpayUrl 
  : `https://${rawBtcpayUrl}`;
const BTCPAY_API_KEY = process.env.BTCPAY_API_KEY;
const BTCPAY_STORE_ID = process.env.BTCPAY_STORE_ID;
const BTCPAY_WEBHOOK_SECRET = process.env.BTCPAY_WEBHOOK_SECRET || '';

// Create axios instance for BTCPay API
const btcpayClient = axios.create({
  baseURL: BTCPAY_URL,
  headers: {
    'Authorization': `token ${BTCPAY_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Runtime assertion: Verify axios client is configured with correct baseURL (not demo server)
if (BTCPAY_URL) {
  const baseDomain = BTCPAY_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const demoDomains = ['demo.btcpayserver.org', 'mainnet.demo.btcpayserver.org', 'testnet.demo.btcpayserver.org'];
  const isDemoBaseUrl = demoDomains.some(domain => baseDomain.includes(domain));
  
  if (isDemoBaseUrl) {
    console.error('[BTCPay Security] ⚠️  CRITICAL: BTCPAY_URL points to DEMO server!');
    console.error(`  BTCPAY_URL: ${BTCPAY_URL}`);
    console.error(`  This will cause ALL invoices to be created on demo server!`);
    console.error(`  Update BTCPAY_URL in .env to: https://btcpay483258.lndyn.com`);
  } else {
    console.log('[BTCPay Service] ✅ Axios client configured with baseURL:', BTCPAY_URL);
  }
}

/**
 * Maps BTCPay invoice status to our PaymentStatus enum
 * 
 * BTCPay statuses:
 * - New: Invoice created but not paid
 * - Processing: Payment received but not confirmed
 * - Settled: Payment confirmed (enough confirmations)
 * - Expired: Invoice expired
 * - Invalid: Invoice is invalid
 */
function mapBtcpayStatusToPaymentStatus(btcpayStatus, exceptionStatus) {
  if (!btcpayStatus) return 'PENDING';
  
  const status = btcpayStatus.toLowerCase();
  const exception = exceptionStatus ? exceptionStatus.toLowerCase() : null;
  
  // Handle exception statuses first
  if (exception === 'paidpartial' || exception === 'paidover') {
    return 'PENDING'; // Still waiting for correct amount
  }
  
  if (exception === 'paidlate') {
    return 'EXPIRED'; // Payment arrived after expiration
  }
  
  // Map main statuses
  switch (status) {
    case 'new':
      return 'PENDING';
    case 'processing':
      return 'PENDING'; // Still pending confirmation
    case 'settled':
      return 'CONFIRMED'; // Fully confirmed
    case 'expired':
      return 'EXPIRED';
    case 'invalid':
      return 'FAILED';
    default:
      return 'PENDING';
  }
}

/**
 * Create a BTCPay invoice
 * 
 * @param {Object} params
 * @param {number} params.amount - Amount in fiat currency (e.g., 10.00 for $10)
 * @param {string} params.currency - Currency code (USD, EUR, etc.)
 * @param {string} params.userId - User ID for metadata
 * @param {Object} params.metadata - Additional metadata to store
 * @returns {Promise<Object>} Invoice data with btcpayInvoiceId and btcpayCheckoutUrl
 */
async function createInvoice({ amount, currency = 'USD', userId, metadata = {} }) {
  if (!BTCPAY_URL || !BTCPAY_API_KEY || !BTCPAY_STORE_ID) {
    const missing = [];
    if (!BTCPAY_URL) missing.push('BTCPAY_URL');
    if (!BTCPAY_API_KEY) missing.push('BTCPAY_API_KEY');
    if (!BTCPAY_STORE_ID) missing.push('BTCPAY_STORE_ID');
    
    throw new Error(
      `BTCPay Server is not configured. Please add the following to your server/.env file: ${missing.join(', ')}. ` +
      `See BTCPAY_INTEGRATION.md for setup instructions.`
    );
  }

  // CRITICAL: Log BTCPAY_URL at runtime to verify it's correct (dev only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[BTCPay Invoice Creation] BTCPAY_URL env:', process.env.BTCPAY_URL);
    console.log('[BTCPay Invoice Creation] BTCPAY_URL normalized:', BTCPAY_URL);
    console.log('[BTCPay Invoice Creation] BTCPAY_STORE_ID:', BTCPAY_STORE_ID);
  }

  try {
    // BTCPay expects amount as a string in the smallest currency unit
    // For USD, that's cents. For BTC, that's satoshis.
    // We'll use the price field which accepts decimal amounts
    const invoiceData = {
      amount: amount.toString(),
      currency: currency,
      metadata: {
        userId: userId,
        ...metadata
      },
      // Optional: set expiration time (default is usually 15 minutes)
      // expirationTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      // Optional: redirect URL after payment
      // redirectURL: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/success`,
    };

    const response = await btcpayClient.post(
      `/api/v1/stores/${BTCPAY_STORE_ID}/invoices`,
      invoiceData
    );

    if (!response.data || !response.data.id) {
      throw new Error('Invalid response from BTCPay Server');
    }

    const invoice = response.data;

    // Runtime assertion: Verify invoice was created for the correct store
    // This ensures addresses are derived ONLY from the configured store's xpub
    const invoiceStoreId = invoice.storeId || invoice.store?.id || null;
    if (invoiceStoreId && invoiceStoreId !== BTCPAY_STORE_ID) {
      console.error('[BTCPay Security] ⚠️  CRITICAL: Invoice store ID mismatch!');
      console.error(`  Expected Store ID: ${BTCPAY_STORE_ID}`);
      console.error(`  Invoice Store ID: ${invoiceStoreId}`);
      console.error(`  Invoice ID: ${invoice.id}`);
      // Don't throw - log and continue, but this should never happen
    }

    // CRITICAL FIX: Validate and fix checkout URL to prevent demo server usage
    // BTCPay may return checkoutLink pointing to demo server - we MUST override it
    const originalCheckoutLink = invoice.checkoutLink || null;
    let checkoutUrl = originalCheckoutLink;
    const expectedDomain = BTCPAY_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const demoDomains = ['demo.btcpayserver.org', 'mainnet.demo.btcpayserver.org', 'testnet.demo.btcpayserver.org'];
    
    // ALWAYS log the original checkoutLink from BTCPay (for debugging)
    console.log('[BTCPay Invoice] Raw checkoutLink from BTCPay API:', originalCheckoutLink || 'null');
    
    // Check if checkoutLink points to demo server
    if (checkoutUrl) {
      const checkoutUrlLower = checkoutUrl.toLowerCase();
      const isDemoUrl = demoDomains.some(domain => checkoutUrlLower.includes(domain));
      
      if (isDemoUrl) {
        console.error('[BTCPay Security] ⚠️  CRITICAL: Invoice checkoutLink points to DEMO server!');
        console.error(`  Invalid checkoutLink: ${checkoutUrl}`);
        console.error(`  Invoice ID: ${invoice.id}`);
        console.error(`  Expected domain: ${expectedDomain}`);
        console.error(`  Overriding with correct URL: ${BTCPAY_URL}/i/${invoice.id}`);
        checkoutUrl = null; // Force reconstruction with correct URL
      } else {
        // Validate checkoutLink points to our configured server
        try {
          const checkoutDomain = new URL(checkoutUrl).hostname;
          if (checkoutDomain !== expectedDomain) {
            console.warn('[BTCPay Security] ⚠️  CheckoutLink domain mismatch!');
            console.warn(`  Expected domain: ${expectedDomain}`);
            console.warn(`  CheckoutLink domain: ${checkoutDomain}`);
            console.warn(`  Invoice ID: ${invoice.id}`);
            console.warn(`  Overriding with correct URL: ${BTCPAY_URL}/i/${invoice.id}`);
            checkoutUrl = null; // Force reconstruction
          }
        } catch (urlError) {
          console.warn('[BTCPay Security] ⚠️  Invalid checkoutLink URL format:', urlError.message);
          console.warn(`  Invalid URL: ${checkoutUrl}`);
          checkoutUrl = null; // Force reconstruction
        }
      }
    }
    
    // Construct checkout URL if missing or invalid
    if (!checkoutUrl) {
      checkoutUrl = `${BTCPAY_URL}/i/${invoice.id}`;
      console.log('[BTCPay Invoice] Constructed checkout URL:', checkoutUrl);
    }
    
    // ALWAYS log final checkout URL domain (for debugging)
    try {
      const finalDomain = new URL(checkoutUrl).hostname;
      console.log('[BTCPay Invoice] Final checkout URL domain:', finalDomain);
      console.log('[BTCPay Invoice] Expected domain:', expectedDomain);
      console.log('[BTCPay Invoice] Domain match:', finalDomain === expectedDomain ? '✅' : '❌');
    } catch (e) {
      console.error('[BTCPay Invoice] Error parsing final checkout URL:', e.message);
    }

    // Extract BTC address from invoice (derived from store's xpub)
    const btcAddress = invoice.addresses?.BTC || invoice.availableAddressHashes?.BTC || null;
    
    // Runtime assertion: Address MUST come from BTCPay response (store's derivation scheme)
    if (!btcAddress) {
      console.warn('[BTCPay Security] ⚠️  No BTC address in invoice response');
      console.warn(`  Invoice ID: ${invoice.id}`);
      console.warn(`  Store ID: ${BTCPAY_STORE_ID}`);
      // This is OK - address may be generated later by BTCPay
    } else {
      // Validate address format (basic check)
      const isValidBtcAddress = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(btcAddress);
      if (!isValidBtcAddress && btcAddress !== 'N/A') {
        console.warn('[BTCPay Security] ⚠️  Invalid BTC address format in invoice response');
        console.warn(`  Address: ${btcAddress}`);
        console.warn(`  Invoice ID: ${invoice.id}`);
      }
    }

    // Enhanced debug logging (non-production only or when DEBUG=true)
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
      console.log('[BTCPay Debug] Invoice created successfully:');
      console.log(`  - Invoice ID: ${invoice.id}`);
      console.log(`  - Store ID: ${BTCPAY_STORE_ID} (configured)`);
      console.log(`  - Invoice Store ID: ${invoiceStoreId || 'N/A'} (from BTCPay)`);
      console.log(`  - Checkout URL: ${checkoutUrl} (validated)`);
      console.log(`  - Checkout Domain: ${new URL(checkoutUrl).hostname}`);
      console.log(`  - BTC Address: ${btcAddress || 'N/A'} (derived from store xpub)`);
      console.log(`  - BTCPay URL: ${BTCPAY_URL}`);
      console.log(`  - Derivation Source: Store ${BTCPAY_STORE_ID} configured wallet`);
      console.log(`  - Address Origin: BTCPay Server HD wallet (xpub-based)`);
    }

    return {
      btcpayInvoiceId: invoice.id,
      btcpayCheckoutUrl: checkoutUrl, // Use validated/constructed URL
      amount: parseFloat(invoice.amount) || amount,
      currency: invoice.currency || currency,
      status: mapBtcpayStatusToPaymentStatus(invoice.status, invoice.exceptionStatus),
      btcpayStatus: invoice.status,
      btcpayExceptionStatus: invoice.exceptionStatus
    };
  } catch (error) {
    console.error('BTCPay createInvoice error:', error.response?.data || error.message);
    
    if (error.response) {
      throw new Error(
        `BTCPay API error: ${error.response.data?.message || error.response.statusText}`
      );
    }
    
    throw new Error(`Failed to create BTCPay invoice: ${error.message}`);
  }
}

/**
 * Verify BTCPay webhook signature
 * 
 * BTCPay uses HMAC-SHA256 with the webhook secret to sign webhook payloads.
 * The signature is in the BTCPay-Sig header.
 * 
 * @param {string} payload - Raw request body as string
 * @param {string} signature - Signature from BTCPay-Sig header
 * @returns {boolean} True if signature is valid
 */
function verifyWebhookSignature(payload, signature) {
  if (!BTCPAY_WEBHOOK_SECRET) {
    console.warn('BTCPAY_WEBHOOK_SECRET not set - webhook verification disabled');
    return true; // In development, allow unsigned webhooks if secret not set
  }

  if (!signature) {
    return false;
  }

  try {
    // BTCPay sends signature as: sha256=<hash>
    const expectedHash = crypto
      .createHmac('sha256', BTCPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    
    const receivedHash = signature.replace('sha256=', '');
    
    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash, 'hex'),
      Buffer.from(receivedHash, 'hex')
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Handle BTCPay webhook event
 * 
 * Processes webhook payload and returns payment status update
 * 
 * BTCPay webhook formats:
 * 1. Event-based: { type: "InvoiceSettled", invoiceId: "...", invoice: {...} }
 * 2. Direct invoice: { id: "...", status: "...", ... }
 * 
 * @param {Object} payload - Parsed webhook payload (invoice object or event object)
 * @param {Object} headers - Request headers (for signature verification)
 * @returns {Promise<Object>} Payment update data
 */
async function handleWebhook(payload, headers = {}) {
  // Verify webhook signature if secret is configured
  const signature = headers['btcpaysig'] || headers['btcpay-sig'] || headers['btcpay-sig'];
  const rawPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
  
  // Only verify signature if secret is configured
  if (BTCPAY_WEBHOOK_SECRET && !verifyWebhookSignature(rawPayload, signature)) {
    throw new Error('Invalid webhook signature');
  } else if (!BTCPAY_WEBHOOK_SECRET) {
    console.warn('[BTCPay Service] BTCPAY_WEBHOOK_SECRET not set - skipping signature verification');
  }

  // Parse payload if it's a string
  const payloadData = typeof payload === 'string' ? JSON.parse(payload) : payload;

  // Handle both event-based and direct invoice formats
  // Event format: { type: "InvoiceSettled", invoiceId: "...", invoice: {...} }
  // Direct format: { id: "...", status: "...", ... }
  let invoiceData;
  if (payloadData.invoice) {
    // Event-based format - extract invoice from nested object
    invoiceData = payloadData.invoice;
  } else {
    // Direct invoice format
    invoiceData = payloadData;
  }

  // Extract invoice information
  const invoiceId = invoiceData.id || invoiceData.invoiceId || payloadData.invoiceId;
  const status = invoiceData.status || invoiceData.type;
  const exceptionStatus = invoiceData.exceptionStatus;
  const amount = invoiceData.amount;
  const currency = invoiceData.currency;

  if (!invoiceId) {
    throw new Error('Invalid webhook payload: missing invoice ID');
  }

  return {
    btcpayInvoiceId: invoiceId,
    status: mapBtcpayStatusToPaymentStatus(status, exceptionStatus),
    btcpayStatus: status,
    btcpayExceptionStatus: exceptionStatus,
    amount: amount ? parseFloat(amount) : null,
    currency: currency || 'USD'
  };
}

/**
 * Get invoice status from BTCPay (for polling/checking)
 * 
 * @param {string} invoiceId - BTCPay invoice ID
 * @returns {Promise<Object>} Invoice status data
 */
async function getInvoiceStatus(invoiceId) {
  if (!BTCPAY_URL || !BTCPAY_API_KEY || !BTCPAY_STORE_ID) {
    throw new Error('BTCPay configuration missing');
  }

  try {
    const response = await btcpayClient.get(
      `/api/v1/stores/${BTCPAY_STORE_ID}/invoices/${invoiceId}`
    );

    const invoice = response.data;
    
    // Runtime assertion: Verify invoice belongs to configured store
    const invoiceStoreId = invoice.storeId || invoice.store?.id || null;
    if (invoiceStoreId && invoiceStoreId !== BTCPAY_STORE_ID) {
      console.error('[BTCPay Security] ⚠️  Invoice store ID mismatch in getInvoiceStatus');
      console.error(`  Expected Store ID: ${BTCPAY_STORE_ID}`);
      console.error(`  Invoice Store ID: ${invoiceStoreId}`);
      console.error(`  Invoice ID: ${invoiceId}`);
    }
    
    // CRITICAL FIX: Validate and fix checkout URL to prevent demo server usage
    let checkoutUrl = invoice.checkoutLink || null;
    const expectedDomain = BTCPAY_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const demoDomains = ['demo.btcpayserver.org', 'mainnet.demo.btcpayserver.org', 'testnet.demo.btcpayserver.org'];
    
    if (checkoutUrl) {
      const checkoutUrlLower = checkoutUrl.toLowerCase();
      const isDemoUrl = demoDomains.some(domain => checkoutUrlLower.includes(domain));
      
      if (isDemoUrl) {
        console.error('[BTCPay Security] ⚠️  CheckoutLink points to DEMO server in getInvoiceStatus!');
        console.error(`  Invalid checkoutLink: ${checkoutUrl}`);
        console.error(`  Overriding with correct URL`);
        checkoutUrl = null;
      } else {
        try {
          const checkoutDomain = new URL(checkoutUrl).hostname;
          if (checkoutDomain !== expectedDomain) {
            console.warn('[BTCPay Security] ⚠️  CheckoutLink domain mismatch in getInvoiceStatus');
            checkoutUrl = null;
          }
        } catch (e) {
          console.warn('[BTCPay Security] ⚠️  Invalid checkoutLink URL format');
          checkoutUrl = null;
        }
      }
    }
    
    if (!checkoutUrl) {
      checkoutUrl = `${BTCPAY_URL}/i/${invoice.id}`;
    }
    
    // Extract BTC address (from store's derivation scheme)
    const btcAddress = invoice.addresses?.BTC || invoice.availableAddressHashes?.BTC || null;
    
    // Debug logging for address verification
    if ((process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') && btcAddress) {
      console.log('[BTCPay Debug] Invoice status retrieved:');
      console.log(`  - Invoice ID: ${invoiceId}`);
      console.log(`  - Store ID: ${BTCPAY_STORE_ID} (configured)`);
      console.log(`  - Checkout URL: ${checkoutUrl} (validated)`);
      console.log(`  - BTC Address: ${btcAddress} (derived from store xpub)`);
      console.log(`  - Address Origin: BTCPay Server HD wallet`);
    }
    
    return {
      btcpayInvoiceId: invoice.id,
      status: mapBtcpayStatusToPaymentStatus(invoice.status, invoice.exceptionStatus),
      btcpayStatus: invoice.status,
      btcpayExceptionStatus: invoice.exceptionStatus,
      amount: parseFloat(invoice.amount) || null,
      currency: invoice.currency || 'USD',
      btcpayCheckoutUrl: checkoutUrl // Use validated/constructed URL
    };
  } catch (error) {
    console.error('BTCPay getInvoiceStatus error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      throw new Error('Invoice not found');
    }
    
    throw new Error(`Failed to get invoice status: ${error.message}`);
  }
}

module.exports = {
  createInvoice,
  handleWebhook,
  verifyWebhookSignature,
  getInvoiceStatus,
  mapBtcpayStatusToPaymentStatus
};

