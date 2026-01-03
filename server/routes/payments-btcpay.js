const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Topup = require('../models/Topup');
const btcpay = require('../services/btcpay');

const router = express.Router();

/**
 * POST /api/payments/create
 * Create a BTCPay invoice for balance top-up
 * 
 * SUMMARY:
 * - Creates BTCPay invoice with metadata: userId, topupAmountUsd, type: "BALANCE_TOPUP"
 * - Metadata is sent to BTCPay and returned in webhook payload
 * - Creates Payment and Topup records in database
 * - Returns payment details for frontend redirect
 * 
 * Metadata sent to BTCPay:
 * {
 *   userId: "<mongo-objectid-string>",
 *   topupAmountUsd: <number>,
 *   type: "BALANCE_TOPUP",
 *   email: "<user-email>",
 *   source: "balance-topup"
 * }
 * 
 * Body: { amount: number, currency?: string, metadata?: object }
 * 
 * Returns: { paymentId, btcpayInvoiceId, btcpayCheckoutUrl, amount, currency }
 */
router.post('/create',
  auth,
  [
    body('amount').isFloat({ min: 1.00 }).withMessage('Amount must be at least 1.00'),
    body('currency').optional().isIn(['USD', 'EUR', 'BTC', 'USDT']).withMessage('Invalid currency')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { amount, currency = 'USD', metadata = {} } = req.body;
      const userId = req.user._id.toString();
      const userEmail = req.user.email;

      // Prepare metadata with required fields for webhook processing
      // This metadata will be sent to BTCPay and returned in webhook payload
      const invoiceMetadata = {
        userId: userId,
        email: userEmail,
        topupAmountUsd: parseFloat(amount), // Use topupAmountUsd as specified
        type: 'BALANCE_TOPUP', // Marker to identify balance top-up invoices
        source: 'balance-topup',
        ...metadata
      };

      console.log(`[Invoice Creation] Creating BTCPay invoice for user ${userId} (${userEmail}), amount: $${amount} ${currency}`);
      console.log(`[Invoice Creation] Metadata:`, JSON.stringify(invoiceMetadata, null, 2));

      // Create BTCPay invoice
      const invoiceData = await btcpay.createInvoice({
        amount,
        currency,
        userId,
        metadata: invoiceMetadata
      });

      // Store payment in database
      const payment = new Payment({
        userId: req.user._id,
        btcpayInvoiceId: invoiceData.btcpayInvoiceId,
        btcpayCheckoutUrl: invoiceData.btcpayCheckoutUrl,
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        status: invoiceData.status,
        btcpayStatus: invoiceData.btcpayStatus,
        btcpayExceptionStatus: invoiceData.btcpayExceptionStatus,
        metadata: new Map(Object.entries(invoiceMetadata))
      });

      await payment.save();

      // Create Topup record for webhook processing
      const topup = new Topup({
        userId: req.user._id,
        invoiceId: invoiceData.btcpayInvoiceId,
        amountUsd: parseFloat(amount),
        status: 'pending'
      });

      await topup.save();

      console.log(`[Invoice Creation] ✅ Invoice created successfully: ${invoiceData.btcpayInvoiceId}`);
      console.log(`[Invoice Creation]   - Payment ID: ${payment._id}`);
      console.log(`[Invoice Creation]   - Topup ID: ${topup._id}`);
      console.log(`[BTCPAY] Created invoice ${invoiceData.btcpayInvoiceId}`);
      console.log(`[BTCPAY] Invoice metadata:`, JSON.stringify(invoiceMetadata, null, 2));
      
      // CRITICAL: Log checkout URL domain for verification (ALWAYS log, not just dev)
      try {
        const checkoutDomain = new URL(payment.btcpayCheckoutUrl).hostname;
        const expectedDomain = process.env.BTCPAY_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'unknown';
        console.log(`[Invoice Creation] 🔍 CHECKOUT URL VERIFICATION:`);
        console.log(`  - Checkout URL: ${payment.btcpayCheckoutUrl}`);
        console.log(`  - Checkout Domain: ${checkoutDomain}`);
        console.log(`  - Expected Domain: ${expectedDomain}`);
        console.log(`  - Domain Match: ${checkoutDomain === expectedDomain ? '✅ CORRECT' : '❌ MISMATCH'}`);
        
        // Warn if domain doesn't match
        if (checkoutDomain !== expectedDomain) {
          console.error(`[Invoice Creation] ⚠️  WARNING: Checkout URL domain mismatch!`);
          console.error(`  This invoice will open the wrong BTCPay server!`);
        }
      } catch (urlError) {
        console.error(`[Invoice Creation] ❌ Error parsing checkout URL:`, urlError.message);
        console.error(`  Checkout URL: ${payment.btcpayCheckoutUrl}`);
      }

      res.json({
        paymentId: payment._id.toString(),
        btcpayInvoiceId: payment.btcpayInvoiceId,
        btcpayCheckoutUrl: payment.btcpayCheckoutUrl,
        amount: payment.amount,
        currency: payment.currency
      });
    } catch (error) {
      console.error('\n========== Payment Creation Error ==========');
      console.error('[Payment] Error message:', error.message);
      console.error('[Payment] Error stack:', error.stack);
      
      if (error.response) {
        console.error('[Payment] BTCPay API response status:', error.response.status);
        console.error('[Payment] BTCPay API response data:', JSON.stringify(error.response.data, null, 2));
      }
      
      // Provide more helpful error messages
      let errorMessage = error.message || 'Failed to create payment';
      let statusCode = 500;
      
      if (error.message && error.message.includes('BTCPay')) {
        statusCode = 503; // Service Unavailable
        errorMessage = error.message;
      } else if (error.response) {
        // BTCPay API error
        const btcpayError = error.response.data?.message || error.response.data?.error || error.response.statusText;
        const httpStatus = error.response.status;
        
        // Handle specific HTTP status codes
        if (httpStatus === 502 || httpStatus === 503 || httpStatus === 504) {
          errorMessage = `BTCPay Server is temporarily unavailable (${httpStatus}). Please try again in a moment.`;
          statusCode = 503;
        } else {
          errorMessage = `BTCPay Server error: ${btcpayError || httpStatus}`;
          statusCode = httpStatus || 500;
        }
        console.error('[Payment] BTCPay error details:', btcpayError, 'HTTP Status:', httpStatus);
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        // Network errors
        errorMessage = 'Unable to connect to BTCPay Server. Please check your connection and try again.';
        statusCode = 503;
        console.error('[Payment] Network error:', error.code, error.message);
      } else if (error.name === 'ValidationError') {
        // Mongoose validation error
        errorMessage = `Validation error: ${error.message}`;
        statusCode = 400;
      } else if (error.name === 'MongoServerError' || error.name === 'MongoNetworkError') {
        // MongoDB connection error
        errorMessage = 'Database connection error. Please try again.';
        statusCode = 503;
      }
      
      console.error('[Payment] Returning error to client:', { statusCode, errorMessage });
      console.error('==========================================\n');
      
      res.status(statusCode).json({ 
        message: errorMessage,
        error: 'PAYMENT_CREATION_FAILED'
      });
    }
  }
);

/**
 * POST /api/payments/btcpay-webhook
 * Handle BTCPay webhook events
 * 
 * SUMMARY:
 * - Receives webhooks from BTCPay Server when invoice status changes
 * - Verifies webhook signature (if configured)
 * - On InvoiceSettled/InvoiceConfirmed events, credits user balance
 * - Idempotent: prevents double-crediting using balanceCredited flag
 * - Comprehensive logging for debugging
 * 
 * Webhook URL: https://<ngrok-url>/api/payments/btcpay-webhook
 */
router.post('/btcpay-webhook', 
  express.raw({ type: '*/*' }), 
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      console.log('\n========== BTCPay Webhook Received ==========');
      console.log(`[Webhook] Timestamp: ${new Date().toISOString()}`);
      console.log(`[Webhook] Headers:`, JSON.stringify(req.headers, null, 2));
      
      const signature = req.headers['btcpaysig'] || req.headers['btcpay-sig'] || req.headers['btcpay-sig'];
      const rawBody = req.body.toString('utf8');
      
      console.log(`[Webhook] Signature present: ${!!signature}`);
      console.log(`[Webhook] Raw body length: ${rawBody.length} bytes`);

      // Parse the payload
      let payload;
      try {
        payload = JSON.parse(rawBody);
        console.log(`[Webhook] Payload parsed successfully`);
        console.log(`[Webhook] Payload structure:`, JSON.stringify(payload, null, 2));
      } catch (e) {
        console.error(`[Webhook] ❌ Invalid JSON payload:`, e.message);
        return res.status(400).json({ message: 'Invalid JSON payload' });
      }

      // BTCPay webhook format: { type: "InvoiceSettled", invoiceId: "...", storeId: "...", invoice: {...} }
      // OR: { id: "...", status: "...", ... } (direct invoice object)
      const eventType = payload.type || payload.eventType || null;
      const invoiceId = payload.invoiceId || payload.id || payload.invoice?.id;
      const invoiceData = payload.invoice || payload; // Use nested invoice or payload itself
      
      console.log(`[Webhook] Event type: ${eventType || 'none (direct invoice object)'}`);
      console.log(`[Webhook] Invoice ID: ${invoiceId}`);
      
      if (!invoiceId) {
        console.error(`[Webhook] ❌ Missing invoice ID in payload`);
        return res.status(400).json({ message: 'Missing invoice ID in webhook payload' });
      }

      // Handle webhook signature verification and extract invoice data
      const webhookData = await btcpay.handleWebhook(invoiceData, req.headers);

      console.log(`[Webhook] Processed webhook data:`, {
        invoiceId: webhookData.btcpayInvoiceId,
        status: webhookData.status,
        btcpayStatus: webhookData.btcpayStatus,
        amount: webhookData.amount
      });

      // Find payment by BTCPay invoice ID
      const payment = await Payment.findOne({ 
        btcpayInvoiceId: webhookData.btcpayInvoiceId 
      });

      if (!payment) {
        console.warn(`[Webhook] ⚠️ Payment not found for invoice ${webhookData.btcpayInvoiceId}`);
        // Return 200 to prevent BTCPay from retrying
        return res.status(200).json({ received: true, message: 'Payment not found (may be from different store)' });
      }

      console.log(`[Webhook] Found payment record: ${payment._id}, User: ${payment.userId}, Amount: $${payment.amount}`);

      // Extract metadata from payment record (stored when invoice was created)
      const metadata = payment.metadata || new Map();
      const userId = payment.userId.toString();
      const amountUsd = payment.amount; // Use stored amount from payment record
      const userEmail = metadata.get('email') || null;

      console.log(`[Webhook] Payment metadata:`, {
        userId: userId,
        email: userEmail,
        amountUsd: amountUsd,
        balanceCredited: payment.balanceCredited || false
      });

      // Update payment status
      const oldStatus = payment.status;
      payment.status = webhookData.status;
      payment.btcpayStatus = webhookData.btcpayStatus;
      payment.btcpayExceptionStatus = webhookData.btcpayExceptionStatus;

      // If amount/currency changed, update them
      if (webhookData.amount) {
        payment.amount = webhookData.amount;
      }
      if (webhookData.currency) {
        payment.currency = webhookData.currency;
      }

      await payment.save();

      console.log(`[Webhook] Payment status updated: ${oldStatus} → ${payment.status}`);

      // Handle status transitions - credit balance when invoice is settled/confirmed
      // BTCPay events: InvoiceSettled, InvoiceConfirmed, or status becomes "Settled"
      const shouldCredit = (
        (eventType === 'InvoiceSettled' || eventType === 'InvoiceConfirmed' || 
         webhookData.btcpayStatus === 'Settled' || payment.status === 'CONFIRMED') &&
        !payment.balanceCredited
      );

      if (shouldCredit) {
        console.log(`[Webhook] 💰 Processing balance credit...`);
        console.log(`[Webhook]   - Payment ID: ${payment._id}`);
        console.log(`[Webhook]   - Invoice ID: ${payment.btcpayInvoiceId}`);
        console.log(`[Webhook]   - User ID: ${userId}`);
        console.log(`[Webhook]   - User Email: ${userEmail || 'N/A'}`);
        console.log(`[Webhook]   - Amount to credit: $${amountUsd}`);
        
        try {
          // Use atomic MongoDB operation to increment balance and prevent race conditions
          const updateResult = await User.findByIdAndUpdate(
            payment.userId,
            { $inc: { balance: amountUsd } },
            { new: true }
          );

          if (!updateResult) {
            console.error(`[Webhook] ❌ User ${userId} not found - cannot credit balance`);
          } else {
            // Mark payment as credited to prevent double-crediting
            payment.balanceCredited = true;
            payment.balanceCreditedAt = new Date();
            await payment.save();
            
            const duration = Date.now() - startTime;
            console.log(`[Webhook] ✅ Balance credited successfully!`);
            console.log(`[Webhook]   - Added: $${amountUsd.toFixed(2)}`);
            console.log(`[Webhook]   - User: ${userId} (${userEmail || 'N/A'})`);
            console.log(`[Webhook]   - New balance: $${updateResult.balance.toFixed(2)}`);
            console.log(`[Webhook]   - Processing time: ${duration}ms`);
            console.log(`==========================================\n`);
          }
        } catch (error) {
          console.error(`[Webhook] ❌ Error crediting balance:`, error);
          console.error(`[Webhook]   - Payment ID: ${payment._id}`);
          console.error(`[Webhook]   - User ID: ${userId}`);
          console.error(`[Webhook]   - Error: ${error.message}`);
          console.error(`[Webhook]   - Stack:`, error.stack);
          // Don't throw - return 200 so BTCPay doesn't retry immediately
          // The webhook will be retried by BTCPay if we return 500
        }
      } else if (payment.balanceCredited) {
        console.log(`[Webhook] ⏭️  Payment already credited - skipping (idempotent check)`);
        console.log(`==========================================\n`);
      } else {
        console.log(`[Webhook] ⏳ Payment not yet settled - status: ${payment.status}, event: ${eventType || 'none'}`);
        console.log(`==========================================\n`);
      }

      // Always return 200 OK to acknowledge receipt (BTCPay will retry on 5xx)
      res.status(200).json({ 
        received: true, 
        status: payment.status,
        balanceCredited: payment.balanceCredited || false
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Webhook] ❌ Webhook processing error:`);
      console.error(`[Webhook]   - Error: ${error.message}`);
      console.error(`[Webhook]   - Stack:`, error.stack);
      console.error(`[Webhook]   - Processing time: ${duration}ms`);
      console.error(`==========================================\n`);
      
      // Return 200 for signature/validation errors (don't retry)
      // Return 500 for processing errors (BTCPay will retry)
      if (error.message.includes('signature') || error.message.includes('Invalid')) {
        return res.status(200).json({ 
          received: false, 
          error: error.message,
          note: 'Signature validation failed - not retrying'
        });
      }
      
      // For other errors, return 500 so BTCPay retries
      res.status(500).json({ 
        received: false, 
        error: error.message || 'Webhook processing failed',
        note: 'Internal error - BTCPay will retry'
      });
    }
  }
);

/**
 * GET /api/payments/:paymentId
 * Get payment status and details
 * 
 * Returns payment info for the authenticated user
 */
router.get('/:paymentId',
  auth,
  async (req, res) => {
    try {
      const { paymentId } = req.params;
      const userId = req.user._id.toString();

      const payment = await Payment.findOne({
        _id: paymentId,
        userId: userId
      });

      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Optionally refresh status from BTCPay (for polling)
      // This is optional - you can remove this if you only want to rely on webhooks
      try {
        const btcpayStatus = await btcpay.getInvoiceStatus(payment.btcpayInvoiceId);
        
        // Update if status changed
        if (btcpayStatus.status !== payment.status) {
          payment.status = btcpayStatus.status;
          payment.btcpayStatus = btcpayStatus.btcpayStatus;
          payment.btcpayExceptionStatus = btcpayStatus.btcpayExceptionStatus;
          await payment.save();
        }
      } catch (error) {
        // If BTCPay is unreachable, just return cached status
        console.warn('Could not refresh payment status from BTCPay:', error.message);
      }

      res.json({
        paymentId: payment._id.toString(),
        btcpayInvoiceId: payment.btcpayInvoiceId,
        btcpayCheckoutUrl: payment.btcpayCheckoutUrl,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      });
    } catch (error) {
      console.error('Get payment error:', error);
      res.status(500).json({ message: 'Failed to get payment' });
    }
  }
);

module.exports = router;

