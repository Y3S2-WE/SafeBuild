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
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Lesson CRUD routes
router.route('/')
  .post(createLesson);

router.route('/course/:courseId')
  .get(getLessonsByCourse);

router.route('/:id')
  .get(getLesson)
  .put(updateLesson)
  .delete(deleteLesson);

// Page management within lessons
router.route('/:id/pages')
  .post(addPage);

router.route('/:id/pages/:pageId')
  .put(updatePage)
  .delete(deletePage);

module.exports = router;
