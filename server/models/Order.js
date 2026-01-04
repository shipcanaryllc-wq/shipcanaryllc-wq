const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uspsService: {
    type: String,
    required: true,
    enum: ['Priority Mail', 'Priority Mail Express', 'First-Class Package', 'Parcel Select', 'Media Mail', 'USPS Ground', 'USPS Ground Advantage']
  },
  fromAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
    required: false
  },
  fromAddressData: {
    type: Object,
    required: false
  },
  toAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
    required: false
  },
  toAddressData: {
    type: Object,
    required: false
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: false
  },
  packageData: {
    type: Object,
    required: false
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  trackingNumber: {
    type: String,
    required: true
  },
  labelUrl: {
    type: String, // AWS S3 URL for PDF
    required: true
  },
  trackingStatus: {
    type: String,
    default: 'NO_SCAN',
    enum: ['NO_SCAN', 'LABEL_CREATED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION']
  },
  // TrackingMore integration fields
  courierCode: {
    type: String,
    default: 'usps'
  },
  trackingProvider: {
    type: String,
    default: 'trackingmore'
  },
  trackingCreatedAt: {
    type: Date,
    default: null
  },
  trackingSubstatus: {
    type: String,
    default: null
  },
  latestEvent: {
    type: String,
    default: null
  },
  latestCheckpointTime: {
    type: Date,
    default: null
  },
  lastTrackingSyncAt: {
    type: Date,
    default: null
  },
  trackingEvents: {
    type: Array,
    default: []
  },
  trackingRawPayload: {
    type: Object,
    default: null
  },
  status: {
    type: String,
    default: 'completed',
    enum: ['pending', 'completed', 'failed', 'refunded']
  },
  provider: {
    type: String,
    enum: ['primary', 'backup'],
    required: false
  },
  shippfastOrderId: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Index for faster queries
orderSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);

