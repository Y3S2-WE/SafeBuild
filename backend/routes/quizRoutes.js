const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion
} = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/auth');
const { createQuizValidation, addQuestionValidation } = require('../middleware/validator');

// Public/All authenticated users can view quizzes
router.get('/', protect, getAllQuizzes);
router.get('/:id', protect, getQuizById);

// Trainer only routes
router.post('/', protect, authorize('trainer'), createQuizValidation, createQuiz);
router.put('/:id', protect, authorize('trainer'), updateQuiz);
router.delete('/:id', protect, authorize('trainer'), deleteQuiz);

// Question management (Trainer only)
router.post('/:id/questions', protect, authorize('trainer'), addQuestionValidation, addQuestion);
router.put('/:id/questions/:questionId', protect, authorize('trainer'), updateQuestion);
router.delete('/:id/questions/:questionId', protect, authorize('trainer'), deleteQuestion);

module.exports = router;
