const { body, validationResult } = require('express-validator');

/**
 * Validation error handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * User registration validation rules
 */
const registerValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['worker', 'manager', 'officer', 'trainer'])
    .withMessage('Invalid role'),
  body('phone')
    .optional()
    .trim(),
  body('department')
    .optional()
    .trim(),
  body('employeeId')
    .optional()
    .trim(),
  handleValidationErrors
];

/**
 * User login validation rules
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Quiz creation validation rules
 */
const createQuizValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Quiz title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Quiz description is required')
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('passMark')
    .notEmpty().withMessage('Pass mark is required')
    .isInt({ min: 0, max: 100 }).withMessage('Pass mark must be between 0 and 100'),
  body('timeLimit')
    .optional()
    .isInt({ min: 1 }).withMessage('Time limit must be at least 1 minute'),
  handleValidationErrors
];

/**
 * Add question validation rules
 */
const addQuestionValidation = [
  body('questionText')
    .trim()
    .notEmpty().withMessage('Question text is required'),
  body('answers')
    .isArray({ min: 4, max: 4 }).withMessage('Each question must have exactly 4 answers'),
  body('answers.*.answerText')
    .trim()
    .notEmpty().withMessage('Answer text is required'),
  body('answers.*.isCorrect')
    .isBoolean().withMessage('isCorrect must be a boolean'),
  body('points')
    .optional()
    .isInt({ min: 1 }).withMessage('Points must be at least 1'),
  handleValidationErrors
];

/**
 * Submit quiz attempt validation rules
 */
const submitAttemptValidation = [
  body('quizId')
    .notEmpty().withMessage('Quiz ID is required')
    .isMongoId().withMessage('Invalid quiz ID'),
  body('answers')
    .isArray({ min: 1 }).withMessage('Answers array is required'),
  body('answers.*.selectedAnswer')
    .isInt({ min: 0, max: 3 }).withMessage('Selected answer must be between 0 and 3'),
  body('startedAt')
    .optional()
    .isISO8601().withMessage('Invalid start time'),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  createQuizValidation,
  addQuestionValidation,
  submitAttemptValidation
};
