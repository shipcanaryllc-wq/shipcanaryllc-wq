const mongoose = require('mongoose');

/**
 * Topup Model
 * 
 * Tracks BTC balance top-ups via BTCPay Server
 * Used to ensure idempotent balance crediting via webhooks
 */
const topupSchema = new mongoose.Schema({
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
  status: {
    type: String,
    required: true,
    default: 'pending',
    enum: ['pending', 'confirmed'],
    index: true
  },
  confirmedAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Index for faster queries
topupSchema.index({ userId: 1, createdAt: -1 });
topupSchema.index({ invoiceId: 1, status: 1 });

module.exports = mongoose.model('Topup', topupSchema);










