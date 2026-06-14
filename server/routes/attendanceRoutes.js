const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getAttendance,
  getUserAttendanceHistory,
} = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/authMiddleware');

// Route: POST /api/attendance - Members mark their own attendance (Requires authentication only)
router.post('/', protect, markAttendance);

// Route: GET /api/attendance - Scoped check-in logs retrieval (Requires authentication only)
router.get('/', protect, getAttendance);

// Route: GET /api/attendance/:userId - Admins view check-in history for one user (Requires admin authentication)
router.get('/:userId', protect, admin, getUserAttendanceHistory);

module.exports = router;
