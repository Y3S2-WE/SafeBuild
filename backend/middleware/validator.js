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
 * Checklist template validation rules
 */
const checklistValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('category')
    .optional()
    .isIn(['fire-safety', 'electrical', 'ppe', 'machinery', 'general', 'environmental'])
    .withMessage('Invalid category'),
  body('items')
    .isArray({ min: 1 }).withMessage('At least one checklist item is required'),
  body('items.*.question')
    .notEmpty().withMessage('Question is required for each item'),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  checklistValidation

};
