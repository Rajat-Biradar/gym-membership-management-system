const express = require('express');
const router = express.Router();
const {
  getMemberships,
  createMembership,
  updateMembership,
  deleteMembership,
} = require('../controllers/membershipController');
const { protect, admin } = require('../middleware/authMiddleware');

// Route protection: ALL membership routes require authentication
router.use(protect);

// GET all memberships (filtered by role inside controller) & POST create new membership (admin only)
router.route('/')
  .get(getMemberships)
  .post(admin, createMembership);

// PUT update membership & DELETE by ID (admin only)
router.route('/:id')
  .put(admin, updateMembership)
  .delete(admin, deleteMembership);

module.exports = router;
