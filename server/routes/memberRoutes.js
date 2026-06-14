const express = require('express');
const router = express.Router();
const {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
} = require('../controllers/memberController');
const { protect, admin } = require('../middleware/authMiddleware');

// Route protection: ALL member management routes require authentication AND admin privileges
router.use(protect);
router.use(admin);

// GET all members & POST create new member
router.route('/')
  .get(getMembers)
  .post(createMember);

// PUT update member & DELETE user by ID
router.route('/:id')
  .put(updateMember)
  .delete(deleteMember);

module.exports = router;
