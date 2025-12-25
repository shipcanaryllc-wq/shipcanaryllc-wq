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

const BTCPAY_URL = process.env.BTCPAY_URL;
const BTCPAY_API_KEY = process.env.BTCPAY_API_KEY;
const BTCPAY_STORE_ID = process.env.BTCPAY_STORE_ID;
const BTCPAY_WEBHOOK_SECRET = process.env.BTCPAY_WEBHOOK_SECRET;

// Create axios instance for BTCPay API
const btcpayClient = axios.create({
  baseURL: BTCPAY_URL,
  headers: {
    'Authorization': `token ${BTCPAY_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

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

    return {
      btcpayInvoiceId: invoice.id,
      btcpayCheckoutUrl: invoice.checkoutLink || `${BTCPAY_URL}/i/${invoice.id}`,
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
    
    return {
      btcpayInvoiceId: invoice.id,
      status: mapBtcpayStatusToPaymentStatus(invoice.status, invoice.exceptionStatus),
      btcpayStatus: invoice.status,
      btcpayExceptionStatus: invoice.exceptionStatus,
      amount: parseFloat(invoice.amount) || null,
      currency: invoice.currency || 'USD',
      btcpayCheckoutUrl: invoice.checkoutLink || `${BTCPAY_URL}/i/${invoice.id}`
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

