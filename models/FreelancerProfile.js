const mongoose = require('mongoose');

const freelancerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  freelancerId: {
    type: String,
    unique: true,
    sparse: true // Allows null/undefined values
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  profilePhoto: {
    type: String // URL to uploaded image
  },
  documents: {
    aadhaarFront: String,
    aadhaarBack: String,
    drivingLicenseFront: String,
    drivingLicenseBack: String,
    panFront: String
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalJobs: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate freelancer ID when approved
freelancerProfileSchema.pre('save', function(next) {
  if (this.verificationStatus === 'approved' && !this.freelancerId) {
    // Generate 5-9 digit ID
    this.freelancerId = Math.floor(10000 + Math.random() * 900000).toString();
  }
  next();
});

module.exports = mongoose.model('FreelancerProfile', freelancerProfileSchema);
