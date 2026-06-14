const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

// Route: POST /api/auth/register
router.post('/register', registerUser);

// Route: POST /api/auth/login
router.post('/login', loginUser);

// Route: GET /api/auth/profile (Protected test route)
router.get('/profile', protect, (req, res) => {
  res.status(200).json({
    id: req.user.id,
    role: req.user.role,
  });
});

// Route: GET /api/auth/admin-test (Protected admin test route)
router.get('/admin-test', protect, admin, (req, res) => {
  res.status(200).json({
    message: 'Admin access granted successfully',
    user: {
      id: req.user.id,
      role: req.user.role,
    },
  });
});

module.exports = router;
