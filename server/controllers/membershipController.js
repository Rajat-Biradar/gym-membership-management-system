const mongoose = require('mongoose');
const Membership = require('../models/Membership');
const User = require('../models/User');

// Helper function to calculate expiry date based on start date and plan
const calculateExpiryDate = (startDate, plan) => {
  const date = new Date(startDate);
  if (plan === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  } else if (plan === 'quarterly') {
    date.setMonth(date.getMonth() + 3);
  } else if (plan === 'annual') {
    date.setFullYear(date.getFullYear() + 1);
  }
  return date;
};

// @desc    Get memberships (Admins get all; standard users get their own)
// @route   GET /api/memberships
// @access  Private
const getMemberships = async (req, res) => {
  try {
    let query = {};
    
    // Standard users only get their own records; Admins get all records
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    }

    const memberships = await Membership.find(query).populate('userId', 'name email role');
    res.status(200).json(memberships);
  } catch (error) {
    console.error(`Get Memberships Error: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Create membership
// @route   POST /api/memberships
// @access  Private/Admin
const createMembership = async (req, res) => {
  try {
    const { userId, plan, startDate, status } = req.body;

    // Validation checks
    if (!userId || !plan) {
      return res.status(400).json({ error: 'Please enter all required fields (userId, plan)' });
    }

    // Plan validation
    const validPlans = ['monthly', 'quarterly', 'annual'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan type. Must be monthly, quarterly, or annual' });
    }

    // Safe Mongoose ObjectId validation for userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid User ID reference' });
    }

    // Verify user exists in DB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Referenced user does not exist' });
    }

    const parsedStartDate = startDate ? new Date(startDate) : new Date();
    const expiryDate = calculateExpiryDate(parsedStartDate, plan);

    const membership = await Membership.create({
      userId,
      plan,
      startDate: parsedStartDate,
      expiryDate,
      status: status || 'active',
    });

    res.status(201).json({
      message: 'Membership created successfully',
      membership,
    });
  } catch (error) {
    console.error(`Create Membership Error: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Update membership
// @route   PUT /api/memberships/:id
// @access  Private/Admin
const updateMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, startDate, status } = req.body;

    // Safe Mongoose ObjectId validation for membership ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid membership ID' });
    }

    const membership = await Membership.findById(id);
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    let isDateRecalculationNeeded = false;

    if (plan !== undefined) {
      const validPlans = ['monthly', 'quarterly', 'annual'];
      if (!validPlans.includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan type. Must be monthly, quarterly, or annual' });
      }
      membership.plan = plan;
      isDateRecalculationNeeded = true;
    }

    if (startDate !== undefined) {
      membership.startDate = new Date(startDate);
      isDateRecalculationNeeded = true;
    }

    // Recalculate expiry date if plan or start date was updated
    if (isDateRecalculationNeeded) {
      membership.expiryDate = calculateExpiryDate(membership.startDate, membership.plan);
    }

    if (status !== undefined) {
      if (status !== 'active' && status !== 'inactive') {
        return res.status(400).json({ error: 'Status must be active or inactive' });
      }
      membership.status = status;
    }

    await membership.save();

    res.status(200).json({
      message: 'Membership updated successfully',
      membership,
    });
  } catch (error) {
    console.error(`Update Membership Error: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Delete membership
// @route   DELETE /api/memberships/:id
// @access  Private/Admin
const deleteMembership = async (req, res) => {
  try {
    const { id } = req.params;

    // Safe Mongoose ObjectId validation for membership ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid membership ID' });
    }

    const membership = await Membership.findById(id);
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    await Membership.deleteOne({ _id: id });

    res.status(200).json({
      message: 'Membership deleted successfully',
    });
  } catch (error) {
    console.error(`Delete Membership Error: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  getMemberships,
  createMembership,
  updateMembership,
  deleteMembership,
};
