const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Mark attendance for the logged-in user
// @route   POST /api/attendance
// @access  Private
const markAttendance = async (req, res) => {
  try {
    const userId = req.user.id; // Automatically read from the authenticated token payload

    const today = new Date();
    // Normalize date to midnight UTC of the current calendar day for robust duplicate checking
    const startOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));

    // Check if user has already checked in on this calendar day
    const alreadyCheckedIn = await Attendance.findOne({ userId, date: startOfToday });
    if (alreadyCheckedIn) {
      return res.status(400).json({ error: 'Attendance already marked for today' });
    }

    const attendance = await Attendance.create({
      userId,
      date: startOfToday,
      checkInTime: new Date(),
    });

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance,
    });
  } catch (error) {
    console.error(`Mark Attendance Error: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Get attendance records (Admins get all; standard users get their own)
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    }
    const records = await Attendance.find(query)
      .populate('userId', 'name email role')
      .sort({ checkInTime: -1 });

    res.status(200).json(records);
  } catch (error) {
    console.error(`Get Attendance Error: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Get attendance history for one user (Admin only)
// @route   GET /api/attendance/:userId
// @access  Private/Admin
const getUserAttendanceHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // Safe Mongoose ObjectId check
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid User ID' });
    }

    // Verify referenced user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const records = await Attendance.find({ userId })
      .populate('userId', 'name email role')
      .sort({ checkInTime: -1 });

    res.status(200).json(records);
  } catch (error) {
    console.error(`Get User Attendance Error: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  markAttendance,
  getAttendance,
  getUserAttendanceHistory,
};
