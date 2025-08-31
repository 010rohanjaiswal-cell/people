const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['delivery', 'cooking', 'plumbing', 'electrical', 'cleaning', 'care_taker', 'mechanic', 'tailoring', 'saloon_spa', 'painting', 'laundry', 'driver'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  numberOfPeople: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  genderPreference: {
    type: String,
    enum: ['male', 'female', 'any'],
    default: 'any'
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'work_done', 'waiting_for_payment', 'completed', 'cancelled'],
    default: 'open'
  },
  assignedAt: {
    type: Date
  },
  workCompletedAt: {
    type: Date
  },
  paymentCompletedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  }
}, {
  timestamps: true
});

// Index for location-based queries
jobSchema.index({ location: '2dsphere' });

// Index for status-based queries
jobSchema.index({ status: 1, isActive: 1 });

module.exports = mongoose.model('Job', jobSchema);
