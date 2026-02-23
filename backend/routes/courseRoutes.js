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
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Course CRUD routes
router.route('/')
  .get(getAllCourses)
  .post(createCourse);

router.route('/:id')
  .get(getCourse)
  .put(updateCourse)
  .delete(deleteCourse);

// Course statistics
router.get('/:id/stats', getCourseStats);

module.exports = router;
