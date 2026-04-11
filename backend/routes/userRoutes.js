const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validator');

// Public routes
router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);

// Protected routes (authenticated users only)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Admin routes (Manager, Officer, Trainer only)
router.get('/', protect, authorize('manager', 'officer', 'trainer'), getAllUsers);
router.get('/:id', protect, authorize('manager', 'officer', 'trainer'), getUserById);

module.exports = router;
