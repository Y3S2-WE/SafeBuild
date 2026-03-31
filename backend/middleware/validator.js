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
    .isIn(['worker', 'manager', 'officer', 'trainer', 'safety-compliance-manager'])
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

/**
 * Checklist template creation/update validation rules
 */
const checklistValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['fire-safety', 'electrical', 'ppe', 'machinery', 'chemical', 'general', 'environmental', 'emergency'])
    .withMessage('Invalid category'),
  body('items')
    .isArray({ min: 1 }).withMessage('At least one checklist item is required'),
  body('items.*.question')
    .trim()
    .notEmpty().withMessage('Question is required for each item')
    .isLength({ min: 5, max: 500 }).withMessage('Question must be between 5 and 500 characters'),
  body('items.*.expectedAnswer')
    .isBoolean().withMessage('Expected answer must be a boolean for each item'),
  handleValidationErrors
];

/**
 * Audit creation validation rules
 */
const auditCreateValidation = [
  body('site')
    .trim()
    .notEmpty().withMessage('Site/Location is required')
    .isLength({ min: 3, max: 200 }).withMessage('Site name must be between 3 and 200 characters'),
  body('auditDate')
    .notEmpty().withMessage('Audit date is required')
    .isISO8601().withMessage('Audit date must be a valid ISO 8601 date'),
  body('checklistTemplate')
    .notEmpty().withMessage('Checklist template is required')
    .isMongoId().withMessage('Invalid checklist template ID'),
  body('assignedAuditor')
    .notEmpty().withMessage('Assigned auditor is required')
    .isMongoId().withMessage('Invalid auditor ID'),
  handleValidationErrors
];

/**
 * Audit execution/update validation rules (responses submission)
 */
const auditExecutionValidation = [
  body('responses')
    .optional()
    .isArray().withMessage('Responses must be an array'),
  body('responses.*.questionId')
    .optional()
    .isMongoId().withMessage('Invalid question ID in responses'),
  body('responses.*.actualAnswer')
    .optional()
    .isBoolean().withMessage('Actual answer must be a boolean'),
  body('findings')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Findings cannot exceed 2000 characters'),
  body('status')
    .optional()
    .isIn(['scheduled', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('cancelReason')
    .if(() => false)
    .trim(),
  handleValidationErrors
];

/**
 * Corrective action update validation rules
 */
const correctiveActionUpdateValidation = [
  body('status')
    .optional()
    .trim()
    .isIn(['open', 'in-progress', 'completed', 'verified', 'closed'])
    .withMessage('Invalid status'),
  body('completionSummary')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Completion summary cannot exceed 1000 characters'),
  body('completionReport')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Completion report cannot exceed 2000 characters'),
  body('verificationNotes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Verification notes cannot exceed 500 characters'),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  createQuizValidation,
  addQuestionValidation,
  submitAttemptValidation,
  checklistValidation,
  auditCreateValidation,
  auditExecutionValidation,
  correctiveActionUpdateValidation
};
