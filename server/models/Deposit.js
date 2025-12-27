const mongoose = require('mongoose');

/**
 * Deposit Model
 * 
 * Tracks user deposits/top-ups for display in dashboard
 * One deposit record per successful balance top-up
 */
const depositSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  invoiceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amountUsd: {
    type: Number,
    required: true,
    min: 0
  },
  amountBtc: {
    type: Number,
    required: false
  },
  paymentMethod: {
    type: String,
    default: 'Bitcoin via BTCPay',
    required: true
  },
  status: {
    type: String,
    required: true,
    default: 'completed',
    enum: ['completed', 'pending', 'failed'],
    index: true
  }
}, {
  timestamps: true
});

// Index for faster queries
depositSchema.index({ userId: 1, createdAt: -1 });
depositSchema.index({ invoiceId: 1 });

module.exports = mongoose.model('Deposit', depositSchema);




