const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalAmount: {
    type: Number,
    required: true
  },
  offeredAmount: {
    type: Number,
    required: true
  },
  message: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  offerType: {
    type: String,
    enum: ['direct_apply', 'custom_offer'],
    required: true
  },
  respondedAt: {
    type: Date
  },
  responseMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
offerSchema.index({ jobId: 1, status: 1 });
offerSchema.index({ freelancerId: 1, status: 1 });
offerSchema.index({ clientId: 1, status: 1 });

module.exports = mongoose.model('Offer', offerSchema);
