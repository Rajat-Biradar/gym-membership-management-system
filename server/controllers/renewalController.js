const mongoose = require('mongoose');
const RenewalRequest = require('../models/RenewalRequest');
const Membership = require('../models/Membership');

// Helper function to calculate new expiry date
const calculateNewExpiryDate = (baseDate, plan) => {
  const date = new Date(baseDate);
  if (plan === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  } else if (plan === 'quarterly') {
    date.setMonth(date.getMonth() + 3);
  } else if (plan === 'annual') {
    date.setFullYear(date.getFullYear() + 1);
  }
  return date;
};

// @desc    Create a new membership renewal request
// @route   POST /api/renewals
// @access  Private
const createRenewalRequest = async (req, res) => {
  try {
    const { membershipId, requestedPlan } = req.body;
    const userId = req.user.id;

    // 1. Validation
    if (!membershipId || !requestedPlan) {
      return res.status(400).json({ error: 'Please provide membershipId and requestedPlan' });
    }

    const validPlans = ['monthly', 'quarterly', 'annual'];
    if (!validPlans.includes(requestedPlan)) {
      return res.status(400).json({ error: 'Invalid plan type. Must be monthly, quarterly, or annual' });
    }

    if (!mongoose.Types.ObjectId.isValid(membershipId)) {
      return res.status(400).json({ error: 'Invalid Membership ID reference' });
    }

    // Verify membership exists and belongs to the user
    const membership = await Membership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    if (membership.userId.toString() !== userId) {
      return res.status(403).json({ error: 'You are not authorized to renew this membership' });
    }

    // 2. Duplicate Check: Only one pending request per member at a time
    const pendingRequest = await RenewalRequest.findOne({
      userId,
      status: 'pending',
    });

    if (pendingRequest) {
      return res.status(400).json({ error: 'You already have a pending renewal request' });
    }

    // 3. Create Request
    const request = await RenewalRequest.create({
      userId,
      membershipId,
      requestedPlan,
      status: 'pending',
    });

    res.status(201).json({
      message: 'Renewal request submitted successfully',
      request,
    });
  } catch (error) {
    console.error(`Create Renewal Request Error: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Get renewal requests (Admins get all; standard users get their own)
// @route   GET /api/renewals
// @access  Private
const getRenewalRequests = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    }

    const requests = await RenewalRequest.find(query)
      .populate('userId', 'name email role')
      .populate('membershipId', 'plan status expiryDate')
      .sort({ requestedAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error(`Get Renewal Requests Error: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Review a renewal request (Approve/Reject)
// @route   PUT /api/renewals/:id
// @access  Private/Admin
const reviewRenewalRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const request = await RenewalRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Renewal request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been reviewed' });
    }

    // If approved, update membership record details
    if (status === 'approved') {
      const membership = await Membership.findById(request.membershipId);
      if (!membership) {
        return res.status(404).json({ error: 'Associated membership not found' });
      }

      // Calculate new expiry starting from either the current expiry date or today (whichever is later)
      const now = new Date();
      const baseDate = membership.expiryDate > now ? membership.expiryDate : now;
      const newExpiry = calculateNewExpiryDate(baseDate, request.requestedPlan);

      membership.plan = request.requestedPlan;
      membership.expiryDate = newExpiry;
      membership.status = 'active';
      await membership.save();
    }

    request.status = status;
    request.reviewedAt = new Date();
    await request.save();

    res.status(200).json({
      message: `Renewal request successfully ${status}`,
      request,
    });
  } catch (error) {
    console.error(`Review Renewal Request Error: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  createRenewalRequest,
  getRenewalRequests,
  reviewRenewalRequest,
};
