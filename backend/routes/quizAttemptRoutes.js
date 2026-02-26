const express = require('express');
const router = express.Router();
const {
  submitQuizAttempt,
  getMyAttempts,
  getAttemptById,
  getAllAttempts,
  getQuizStats
} = require('../controllers/quizAttemptController');
const { protect, authorize } = require('../middleware/auth');
const { submitAttemptValidation } = require('../middleware/validator');

// Worker routes
router.post('/', protect, submitAttemptValidation, submitQuizAttempt);
router.get('/my-attempts', protect, getMyAttempts);

// Admin routes
router.get('/', protect, authorize('trainer', 'manager', 'officer'), getAllAttempts);
router.get('/quiz/:quizId/stats', protect, authorize('trainer', 'manager', 'officer'), getQuizStats);

// Single attempt (user can view own, admin can view all)
router.get('/:id', protect, getAttemptById);

module.exports = router;
