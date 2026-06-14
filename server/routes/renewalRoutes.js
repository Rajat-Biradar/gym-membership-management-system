const express = require('express');
const router = express.Router();
const {
  createRenewalRequest,
  getRenewalRequests,
  reviewRenewalRequest,
} = require('../controllers/renewalController');
const { protect, admin } = require('../middleware/authMiddleware');

// Route protection: ALL renewal endpoints require authentication
router.use(protect);

// POST create request & GET scoped requests list
router.route('/')
  .post(createRenewalRequest)
  .get(getRenewalRequests);

// PUT review request (admin only)
router.route('/:id')
  .put(admin, reviewRenewalRequest);

module.exports = router;
