const mongoose = require('mongoose');

/**
 * Transaction Model
 * 
 * Tracks balance transactions (top-ups, deductions) for idempotency
 * Prevents double-crediting when BTCPay retries webhooks
 */
const transactionSchema = new mongoose.Schema({
  invoiceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  type: {
    type: String,
    required: true,
    enum: ['BALANCE_TOPUP', 'ORDER_PAYMENT', 'REFUND']
  },
  status: {
    type: String,
    required: true,
    default: 'pending',
    enum: ['pending', 'settled', 'failed']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  settledAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Index for faster queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ invoiceId: 1, status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);










