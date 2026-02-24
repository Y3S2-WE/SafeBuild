const express = require('express');
const router = express.Router();
const {
  enrollCourse,
  getMyEnrollments,
  getEnrollmentByCourse,
  updateProgress,
  getContinueLearning,
  getCoursesByStatus
} = require('../controllers/enrollmentController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Enrollment routes
router.post('/', enrollCourse);
router.get('/my-courses', getMyEnrollments);
router.get('/course/:courseId', getEnrollmentByCourse);
router.get('/status/:status', getCoursesByStatus);
router.get('/:enrollmentId/continue', getContinueLearning);

// Progress tracking
router.post('/progress', updateProgress);

module.exports = router;
