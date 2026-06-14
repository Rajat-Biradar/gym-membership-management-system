const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Membership = require('../models/Membership');
const Attendance = require('../models/Attendance');

// @desc    Get all members
// @route   GET /api/members
// @access  Private/Admin
const getMembers = async (req, res) => {
  try {
    const members = await User.find({}).select('-password');
    res.status(200).json(members);
  } catch (error) {
    console.error(`Get Members Error: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Create new member
// @route   POST /api/members
// @access  Private/Admin
const createMember = async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password.trim() : '';
    const role = typeof req.body.role === 'string' ? req.body.role.trim() : 'user';

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please enter all fields (name, email, password)' });
    }

    if (role && role !== 'user' && role !== 'admin') {
      return res.status(400).json({ error: 'Role must be user or admin' });
    }

    // Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in database
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
    });

    res.status(201).json({
      message: 'Member created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(`Create Member Error: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Update member
// @route   PUT /api/members/:id
// @access  Private/Admin
const updateMember = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Mongoose ObjectId defensively
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid member ID' });
    }

    const name = typeof req.body.name === 'string' ? req.body.name.trim() : undefined;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : undefined;
    const role = typeof req.body.role === 'string' ? req.body.role.trim() : undefined;

    // Find existing user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Handle email updates with duplicate check
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) {
      if (role !== 'user' && role !== 'admin') {
        return res.status(400).json({ error: 'Role must be user or admin' });
      }
      user.role = role;
    }

    await user.save();

    res.status(200).json({
      message: 'Member updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(`Update Member Error: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Delete member
// @route   DELETE /api/members/:id
// @access  Private/Admin
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Mongoose ObjectId defensively
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid member ID' });
    }

    // Security check: Admins cannot delete their own account
    if (req.user && req.user.id === id) {
      return res.status(400).json({ error: 'Admins cannot delete their own account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Cascade Cleanup
    await Membership.deleteMany({ userId: id });
    await Attendance.deleteMany({ userId: id });

    // Delete User
    await User.deleteOne({ _id: id });

    res.status(200).json({
      message: 'Member deleted successfully',
    });
  } catch (error) {
    console.error(`Delete Member Error: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
};
