const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  length: {
    type: Number,
    required: true,
    min: 0.1
  },
  width: {
    type: Number,
    required: true,
    min: 0.1
  },
  height: {
    type: Number,
    required: true,
    min: 0.1
  },
  weight: {
    type: Number,
    required: true,
    min: 0.1,
    max: 70 // Max 70 lbs
  },
  unit: {
    type: String,
    enum: ['inches', 'cm'],
    default: 'inches'
  },
  weightUnit: {
    type: String,
    enum: ['lbs', 'oz', 'kg', 'g'],
    default: 'lbs'
  },
  description: {
    type: String,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Package', packageSchema);

