const express = require('express');
const router = express.Router();
const {
  createCourse,
  getAllCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  getCourseStats
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Course CRUD routes
router.route('/')
  .get(getAllCourses)
  .post(authorize('trainer'), createCourse);

// Course statistics (must be before /:id route)
router.get('/:id/stats', authorize('trainer'), getCourseStats);

router.route('/:id')
  .get(getCourse)
  .put(authorize('trainer'), updateCourse)
  .delete(authorize('trainer'), deleteCourse);

module.exports = router;
