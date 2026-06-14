const mongoose = require('mongoose');

const renewalRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Membership',
      required: true,
    },
    requestedPlan: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const RenewalRequest = mongoose.model('RenewalRequest', renewalRequestSchema);

module.exports = RenewalRequest;
