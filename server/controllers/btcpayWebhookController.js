const crypto = require('crypto');
const mongoose = require('mongoose');
const Topup = require('../models/Topup');
const Transaction = require('../models/Transaction');
const Deposit = require('../models/Deposit');
const User = require('../models/User');

/**
 * BTCPay Webhook Handler
 * 
 * SUMMARY:
 * - Receives webhooks from BTCPay Server when invoice status changes
 * - Verifies HMAC-SHA256 signature using BTCPAY_WEBHOOK_SECRET
 * - Processes only InvoiceSettled events for BALANCE_TOPUP invoices
 * - Credits user balance idempotently using Transaction model
 * - Prevents double-crediting by checking Transaction status
 * 
 * Flow:
 * 1. Verify webhook signature (HMAC-SHA256)
 * 2. Parse event payload and extract eventType, invoiceId, metadata
 * 3. Only process InvoiceSettled events
 * 4. Check metadata.type === 'BALANCE_TOPUP'
 * 5. Extract userId and topupAmountUsd from metadata
 * 6. Check Transaction model for idempotency (prevent double-credit)
 * 7. Create/update Transaction record
 * 8. Atomically increment user.balance using $inc operator
 * 9. Return 200 OK
 * 
 * Webhook URL: /api/btcpay/webhook
 * Public endpoint (no auth required)
 */
async function btcpayWebhookHandler(req, res) {
  const startTime = Date.now();
  
  // Top-level logging at the very beginning
  console.log('\n========== [BTCPAY WEBHOOK] Incoming Request ==========');
  console.log(`[BTCPAY WEBHOOK] Method: ${req.method}`);
  console.log(`[BTCPAY WEBHOOK] Path: ${req.path}`);
  console.log(`[BTCPAY WEBHOOK] Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Get raw body as Buffer and string
    const rawBody = req.body; // Buffer from express.raw()
    const bodyString = rawBody.toString('utf8');
    
    // Log raw body immediately
    console.log(`[BTCPAY WEBHOOK] Raw body length: ${bodyString.length} bytes`);
    try {
      const parsedBody = JSON.parse(bodyString);
      console.log(`[BTCPAY WEBHOOK] Raw body:`, JSON.stringify(parsedBody, null, 2));
    } catch (e) {
      console.log(`[BTCPAY WEBHOOK] Raw body (not JSON):`, bodyString.substring(0, 500));
    }
    
    // Log headers and body for debugging
    console.log(`[BTCPAY WEBHOOK] Headers:`, JSON.stringify(req.headers, null, 2));
    
    // Read BTCPay signature header (try multiple possible header names)
    const sigHeader = req.header('BTCPAY-SIG') || 
                     req.headers['btcpay-sig'] || 
                     req.headers['btcpaysig'] ||
                     req.headers['btcpay-sig'] ||
                     req.headers['BTCPAY-SIG'];
    
    console.log(`[Webhook] Signature header present: ${!!sigHeader}`);
    if (sigHeader) {
      console.log(`[Webhook] Signature header value: ${sigHeader.substring(0, 50)}...`);
    }
    
    // Validate signature
    const webhookSecret = process.env.BTCPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('[Webhook] ❌ BTCPAY_WEBHOOK_SECRET not configured in environment');
      return res.status(500).json({ message: 'Server misconfigured' });
    }
    
    if (!sigHeader) {
      console.error('[Webhook] ❌ Missing BTCPAY-SIG header');
      return res.status(401).json({ message: 'Missing signature' });
    }
    
    // BTCPay sends signature as 'sha256=<hex>' format
    // Compute expected signature using HMAC-SHA256
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(bodyString, 'utf8');
    const expectedHex = hmac.digest('hex');
    const expectedWithPrefix = 'sha256=' + expectedHex;
    
    console.log(`[BTCPAY WEBHOOK] Expected signature (hex): ${expectedHex.substring(0, 50)}...`);
    console.log(`[BTCPAY WEBHOOK] Expected signature (with prefix): ${expectedWithPrefix.substring(0, 50)}...`);
    console.log(`[BTCPAY WEBHOOK] Received signature: ${sigHeader.substring(0, 50)}...`);
    
    // Use timing-safe comparison to prevent timing attacks
    // Try both formats: plain hex and with 'sha256=' prefix
    let isValid = false;
    try {
      // Remove 'sha256=' prefix if present
      const receivedHash = sigHeader.replace(/^sha256=/, '');
      
      // Compare using timing-safe comparison
      if (sigHeader === expectedWithPrefix || sigHeader === expectedHex) {
        isValid = true;
      } else if (receivedHash.length === expectedHex.length) {
        // Use timing-safe comparison for hex strings
        isValid = crypto.timingSafeEqual(
          Buffer.from(receivedHash, 'hex'),
          Buffer.from(expectedHex, 'hex')
        );
      }
    } catch (e) {
      console.error('[BTCPAY WEBHOOK] Signature comparison error:', e.message);
      isValid = false;
    }
    
    if (!isValid) {
      console.error('[BTCPAY WEBHOOK] ❌ Invalid signature - HMAC verification failed');
      console.error(`[BTCPAY WEBHOOK] Expected (hex): ${expectedHex}`);
      console.error(`[BTCPAY WEBHOOK] Expected (prefixed): ${expectedWithPrefix}`);
      console.error(`[BTCPAY WEBHOOK] Received: ${sigHeader}`);
      return res.status(401).json({ message: 'Invalid signature' });
    }
    
    console.log('[BTCPAY WEBHOOK] ✅ Signature verified successfully');
    
    // Parse JSON payload
    let event;
    try {
      event = JSON.parse(bodyString);
    } catch (e) {
      console.error('[Webhook] ❌ Invalid JSON payload:', e.message);
      return res.status(400).json({ message: 'Invalid JSON' });
    }
    
    console.log('[BTCPAY WEBHOOK] Event payload:', JSON.stringify(event, null, 2));
    
    // Extract event type and invoice ID
    const eventType = event.type || event.eventType || '';
    const invoiceId = event.invoiceId || event.invoice?.id || event.id;
    
    console.log('[BTCPAY WEBHOOK] eventType:', eventType);
    console.log('[BTCPAY WEBHOOK] invoiceId:', invoiceId);
    
    // Handle test webhooks or webhooks without invoice ID
    if (!invoiceId) {
      console.log('[BTCPAY WEBHOOK] ⚠️ Webhook without invoiceId (may be a test webhook)');
      console.log('[BTCPAY WEBHOOK] Event data:', JSON.stringify(event, null, 2));
      return res.status(200).json({ received: true, message: 'Test webhook received' });
    }
    
    // Extract metadata from webhook payload FIRST (before checking event type)
    // BTCPay sends metadata in different places depending on event structure:
    // - event.metadata (top level)
    // - event.invoice.metadata (nested in invoice object)
    // - event.data.metadata (sometimes)
    // Metadata values may be strings, so we need to parse them
    let rawMetadata = event.metadata || event.invoice?.metadata || event.data?.metadata || {};
    
    console.log('[BTCPAY WEBHOOK] Raw metadata extracted:', JSON.stringify(rawMetadata, null, 2));
    
    // BTCPay sometimes sends metadata values as strings, parse if needed
    let metadata = {};
    if (typeof rawMetadata === 'string') {
      try {
        metadata = JSON.parse(rawMetadata);
        console.log('[BTCPAY WEBHOOK] Parsed metadata from string');
      } catch (e) {
        console.log('[BTCPAY WEBHOOK] Metadata is string but not JSON, using as-is');
        metadata = rawMetadata; // Fallback to original if not JSON
      }
    } else {
      metadata = rawMetadata;
    }
    
    // Also check if metadata values are strings that need parsing
    if (metadata.userId && typeof metadata.userId === 'string' && metadata.userId.startsWith('"')) {
      try {
        metadata.userId = JSON.parse(metadata.userId);
      } catch (e) {
        // Keep as is
      }
    }
    if (metadata.topupAmountUsd && typeof metadata.topupAmountUsd === 'string') {
      metadata.topupAmountUsd = parseFloat(metadata.topupAmountUsd);
    }
    if (metadata.amountUsd && typeof metadata.amountUsd === 'string') {
      metadata.amountUsd = parseFloat(metadata.amountUsd);
    }
    
    console.log('[BTCPAY WEBHOOK] metadata:', JSON.stringify(metadata, null, 2));
    
    // Fallback: If metadata not in webhook payload, look up Payment record
    // BTCPay doesn't always include metadata in webhooks, so we need to fetch it from our DB
    if (!metadata || !metadata.type || !metadata.userId) {
      console.log('[BTCPAY WEBHOOK] ⚠️ Metadata not found in webhook payload, looking up Payment record...');
      
      const Payment = require('../models/Payment');
      const payment = await Payment.findOne({ btcpayInvoiceId: invoiceId });
      
      if (payment && payment.metadata) {
        // Convert Map to object
        const paymentMetadata = {};
        payment.metadata.forEach((value, key) => {
          paymentMetadata[key] = value;
        });
        
        console.log('[BTCPAY WEBHOOK] Found metadata from Payment record:', JSON.stringify(paymentMetadata, null, 2));
        
        // Merge with webhook metadata (webhook takes precedence)
        metadata = { ...paymentMetadata, ...metadata };
        
        // Also get userId and amount from payment record if missing
        if (!metadata.userId && payment.userId) {
          metadata.userId = payment.userId.toString();
        }
        if (!metadata.topupAmountUsd && payment.amount) {
          metadata.topupAmountUsd = payment.amount;
        }
      } else {
        console.warn('[BTCPAY WEBHOOK] ⚠️ Payment record not found for invoice:', invoiceId);
      }
    }
    
    console.log('[BTCPAY WEBHOOK] Final metadata:', JSON.stringify(metadata, null, 2));
    
    // Handle the correct event(s)
    // BTCPay sends InvoiceSettled when payment is fully confirmed
    // Also check for InvoiceProcessing in case BTCPay sends that first
    const isTopupEvent = (
      (eventType === 'InvoiceSettled' || eventType === 'InvoiceProcessing') &&
      metadata &&
      metadata.type === 'BALANCE_TOPUP'
    );
    
    if (!isTopupEvent) {
      console.log(`[BTCPAY WEBHOOK] Ignored non-topup event:`, {
        eventType: eventType,
        metadataType: metadata?.type,
        reason: eventType !== 'InvoiceSettled' && eventType !== 'InvoiceProcessing' 
          ? `Event type ${eventType} not InvoiceSettled/InvoiceProcessing`
          : metadata?.type !== 'BALANCE_TOPUP'
          ? `Metadata type is ${metadata?.type}, not BALANCE_TOPUP`
          : 'Unknown reason'
      });
      return res.status(200).json({ received: true, ignored: true, reason: 'Not a BALANCE_TOPUP settlement event' });
    }
    
    // Read metadata correctly and update balance idempotently
    // Extract userId and amount from metadata
    const userId = metadata.userId;
    const topupAmountUsd = parseFloat(metadata.topupAmountUsd || metadata.amountUsd || 0);
    
    // Validate metadata
    if (!userId || !topupAmountUsd || topupAmountUsd <= 0) {
      console.error('[BTCPAY WEBHOOK] Missing userId or amount in metadata', {
        userId: userId,
        topupAmountUsd: topupAmountUsd,
        metadata: metadata
      });
      return res.status(200).json({ received: true, error: 'missing metadata' });
    }
    
    console.log(`[BTCPAY WEBHOOK] 💰 Processing BALANCE_TOPUP settlement for invoice ${invoiceId}`);
    console.log(`[BTCPAY WEBHOOK]   - User ID: ${userId}`);
    console.log(`[BTCPAY WEBHOOK]   - Amount: $${topupAmountUsd}`);
    
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('[BTCPAY WEBHOOK] ❌ MongoDB not connected! Connection state:', mongoose.connection.readyState);
      return res.status(500).json({ received: false, error: 'Database connection error' });
    }
    
    // Implement idempotent crediting using Transaction model
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Check if transaction already exists
        const existing = await Transaction.findOne({ 
          invoiceId: invoiceId, 
          type: 'BALANCE_TOPUP' 
        }).session(session);
        
        if (existing && existing.status === 'settled') {
          console.log(`[BTCPAY WEBHOOK] ⏭️  Transaction for invoice ${invoiceId} already settled - skipping (idempotent)`);
          return; // Exit transaction early
        }
        
        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          console.error(`[BTCPAY WEBHOOK] ❌ Invalid userId format: ${userId}`);
          throw new Error('Invalid userId format');
        }
        
        // Find user
        const user = await User.findById(userId).session(session);
        
        if (!user) {
          console.error(`[BTCPAY WEBHOOK] ❌ User ${userId} not found`);
          throw new Error('User not found');
        }
        
        console.log(`[BTCPAY WEBHOOK] Found user: ${user._id} (${user.email})`);
        
        // Create transaction record if it doesn't exist
        if (!existing) {
          await Transaction.create([{
            invoiceId: invoiceId,
            userId: user._id,
            amount: topupAmountUsd,
            currency: 'USD',
            type: 'BALANCE_TOPUP',
            status: 'settled',
            settledAt: new Date()
          }], { session });
          console.log(`[BTCPAY WEBHOOK] Created transaction record for invoice ${invoiceId}`);
        } else {
          // Update existing transaction to settled
          existing.status = 'settled';
          existing.settledAt = new Date();
          await existing.save({ session });
          console.log(`[BTCPAY WEBHOOK] Updated existing transaction to settled: ${existing._id}`);
        }
        
        // Increment user balance atomically
        const oldBalance = user.balance || 0;
        const updateResult = await User.findByIdAndUpdate(
          user._id,
          { $inc: { balance: topupAmountUsd } },
          { new: true, session }
        );
        
        if (!updateResult) {
          console.error(`[BTCPAY WEBHOOK] ❌ Failed to update user balance for ${user._id}`);
          throw new Error('Failed to update balance');
        }
        
        // Create or update Deposit record for dashboard display (idempotent)
        await Deposit.findOneAndUpdate(
          { invoiceId: invoiceId, userId: user._id },
          {
            userId: user._id,
            invoiceId: invoiceId,
            amountUsd: topupAmountUsd,
            amountBtc: null, // Can be extracted from event if available
            paymentMethod: 'Bitcoin via BTCPay',
            status: 'completed'
          },
          { upsert: true, new: true, setDefaultsOnInsert: true, session }
        );
        
        console.log(`[BTCPAY WEBHOOK] Recorded deposit for user ${userId}, invoice ${invoiceId}, amountUsd $${topupAmountUsd}`);
        
        const duration = Date.now() - startTime;
        console.log(`[BTCPAY WEBHOOK] ✅ Balance credited successfully!`);
        console.log(`[BTCPAY WEBHOOK]   - User: ${userId} (${user.email})`);
        console.log(`[BTCPAY WEBHOOK]   - Amount: $${topupAmountUsd.toFixed(2)}`);
        console.log(`[BTCPAY WEBHOOK]   - Old balance: $${oldBalance.toFixed(2)}`);
        console.log(`[BTCPAY WEBHOOK]   - New balance: $${updateResult.balance.toFixed(2)}`);
        console.log(`[BTCPAY WEBHOOK]   - Processing time: ${duration}ms`);
      });
      
      console.log(`[BTCPAY WEBHOOK] ==========================================\n`);
      
      // Always return 200 OK
      return res.status(200).json({ received: true, processed: true });
      
    } catch (dbError) {
      console.error('[BTCPAY WEBHOOK] ❌ Database error:', dbError);
      console.error('[BTCPAY WEBHOOK]   - Error message:', dbError.message);
      console.error('[BTCPAY WEBHOOK]   - Stack:', dbError.stack);
      
      // Abort transaction
      await session.abortTransaction();
      
      // Return 200 for validation errors (don't retry), 500 for DB errors (retry)
      if (dbError.message.includes('Invalid') || dbError.message.includes('not found')) {
        return res.status(200).json({ received: true, error: dbError.message });
      }
      
      return res.status(500).json({ received: false, error: 'Database error' });
    } finally {
      await session.endSession();
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[BTCPAY WEBHOOK] ❌ Error processing webhook:', error);
    console.error('[BTCPAY WEBHOOK]   - Error message:', error.message);
    console.error('[BTCPAY WEBHOOK]   - Stack:', error.stack);
    console.error('[BTCPAY WEBHOOK]   - Processing time:', duration + 'ms');
    console.error(`[BTCPAY WEBHOOK] ==========================================\n`);
    
    // Return clean responses - never throw unhandled errors
    // Return 200 for signature/validation errors (don't retry)
    // Return 500 for processing errors (BTCPay will retry)
    if (error.message && (error.message.includes('signature') || error.message.includes('Invalid'))) {
      return res.status(200).json({ received: false, error: error.message });
    }
    
    // For other errors, return 500 so BTCPay retries
    return res.status(500).json({ received: false, error: 'Internal server error' });
  }
}

module.exports = btcpayWebhookHandler;

