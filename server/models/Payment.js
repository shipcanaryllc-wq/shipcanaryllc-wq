const mongoose = require('mongoose');

const paymentStatusEnum = ['PENDING', 'PAID', 'CONFIRMED', 'EXPIRED', 'FAILED'];

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  btcpayInvoiceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  btcpayCheckoutUrl: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    enum: ['USD', 'EUR', 'BTC', 'USDT']
  },
  status: {
    type: String,
    required: true,
    default: 'PENDING',
    enum: paymentStatusEnum,
    index: true
  },
  // Optional: link to order if this payment is for a specific order
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  // Metadata for tracking what this payment is for
  metadata: {
    type: Map,
    of: String,
    default: {}
  },
  // BTCPay webhook data (for debugging/audit)
  btcpayStatus: {
    type: String,
    required: false
  },
  btcpayExceptionStatus: {
    type: String,
    required: false
  },
  // Track if balance has been credited to prevent double-crediting
  balanceCredited: {
    type: Boolean,
    default: false,
    index: true
  },
  // Track when balance was credited (for audit)
  balanceCreditedAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Index for faster queries
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Virtual for checking if payment is complete
paymentSchema.virtual('isComplete').get(function() {
  return this.status === 'PAID' || this.status === 'CONFIRMED';
});

module.exports = mongoose.model('Payment', paymentSchema);

