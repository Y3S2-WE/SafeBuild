const express = require('express');
const router = express.Router();
const {
  createLesson,
  getLessonsByCourse,
  getLesson,
  updateLesson,
  deleteLesson,
  addPage,
  updatePage,
  deletePage
} = require('../controllers/lessonController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Lesson CRUD routes
router.route('/')
  .post(authorize('trainer'), createLesson);

router.route('/course/:courseId')
  .get(getLessonsByCourse);

router.route('/:id')
  .get(getLesson)
  .put(authorize('trainer'), updateLesson)
  .delete(authorize('trainer'), deleteLesson);

// Page management within lessons
router.route('/:id/pages')
  .post(authorize('trainer'), addPage);

router.route('/:id/pages/:pageId')
  .put(authorize('trainer'), updatePage)
  .delete(authorize('trainer'), deletePage);

module.exports = router;
