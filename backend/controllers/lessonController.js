const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Progress = require('../models/Progress');

/**
 * Check if user owns the course
 * @param {Object} course - Course document
 * @param {String} userId - User ID
 * @returns {Boolean}
 */
const isOwner = (course, userId) => {
  return course.createdBy.toString() === userId;
};

/**
 * Send success response
 * @param {Object} res - Response object
 * @param {Number} statusCode - HTTP status code
 * @param {Object} data - Response data
 */
const sendSuccess = (res, statusCode, data) => {
  res.status(statusCode).json({
    success: true,
    ...data
  });
};

/**
 * Send error response
 * @param {Object} res - Response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 */
const sendError = (res, statusCode, message) => {
  res.status(statusCode).json({
    success: false,
    error: message
  });
};

/**
 * Verify course ownership
 * @param {String} courseId - Course ID
 * @param {String} userId - User ID
 * @returns {Promise<Object|null>} Course document or null
 */
const verifyCourseOwnership = async (courseId, userId) => {
  const course = await Course.findById(courseId);
  if (!course) return null;
  if (!isOwner(course, userId)) return null;
  return course;
};

// @desc    Create a new lesson (Trainer only)
// @route   POST /api/lessons
// @access  Private (Trainer)
exports.createLesson = async (req, res) => {
  try {
    const { courseId, title, description, orderIndex, pages, duration } = req.body;

    // Check if course exists and trainer owns it
    const course = await verifyCourseOwnership(courseId, req.user.id);
    if (!course) {
      return sendError(res, 404, 'Course not found or not authorized');
    }

    // Create lesson
    const lesson = await Lesson.create({
      courseId,
      title,
      description,
      orderIndex: orderIndex || 0,
      pages: pages || [],
      duration: duration || 0,
      createdBy: req.user.id
    });

    // Update course total lessons count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { totalLessons: 1 }
    });

    sendSuccess(res, 201, { data: lesson });
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

// @desc    Get all lessons for a course
// @route   GET /api/lessons/course/:courseId
// @access  Private
exports.getLessonsByCourse = async (req, res) => {
  try {
    const lessons = await Lesson.find({ courseId: req.params.courseId })
      .sort({ orderIndex: 1 });

    sendSuccess(res, 200, { count: lessons.length, data: lessons });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// @desc    Get single lesson
// @route   GET /api/lessons/:id
// @access  Private
exports.getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('courseId', 'title status');

    if (!lesson) {
      return sendError(res, 404, 'Lesson not found');
    }

    sendSuccess(res, 200, { data: lesson });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// @desc    Update lesson (Trainer only)
// @route   PUT /api/lessons/:id
// @access  Private (Trainer)
exports.updateLesson = async (req, res) => {
  try {
    let lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return sendError(res, 404, 'Lesson not found');
    }

    // Check if the trainer owns this lesson's course
    const course = await verifyCourseOwnership(lesson.courseId, req.user.id);
    if (!course) {
      return sendError(res, 403, 'Not authorized to update this lesson');
    }

    const { title, description, orderIndex, pages, duration } = req.body;

    lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { title, description, orderIndex, pages, duration },
      { new: true, runValidators: true }
    );

    sendSuccess(res, 200, { data: lesson });
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

// @desc    Delete lesson (Trainer only)
// @route   DELETE /api/lessons/:id
// @access  Private (Trainer)
exports.deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return sendError(res, 404, 'Lesson not found');
    }

    // Check if the trainer owns this lesson's course
    const course = await verifyCourseOwnership(lesson.courseId, req.user.id);
    if (!course) {
      return sendError(res, 403, 'Not authorized to delete this lesson');
    }

    await lesson.deleteOne();

    // Update course total lessons count
    await Course.findByIdAndUpdate(lesson.courseId, {
      $inc: { totalLessons: -1 }
    });

    // Delete all progress records for this lesson
    await Progress.deleteMany({ lessonId: req.params.id });

    sendSuccess(res, 200, { data: {}, message: 'Lesson deleted successfully' });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// @desc    Add page to lesson (Trainer only)
// @route   POST /api/lessons/:id/pages
// @access  Private (Trainer)
exports.addPage = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return sendError(res, 404, 'Lesson not found');
    }

    // Check if the trainer owns this lesson's course
    const course = await verifyCourseOwnership(lesson.courseId, req.user.id);
    if (!course) {
      return sendError(res, 403, 'Not authorized to add pages to this lesson');
    }

    const { title, contentType, textContent, videoUrl, videoTitle } = req.body;

    const newPage = {
      pageNumber: lesson.pages.length + 1,
      title,
      contentType: contentType || 'text',
      textContent: textContent || '',
      videoUrl: videoUrl || '',
      videoTitle: videoTitle || ''
    };

    lesson.pages.push(newPage);
    await lesson.save();

    sendSuccess(res, 201, { data: lesson });
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

// @desc    Update page in lesson (Trainer only)
// @route   PUT /api/lessons/:id/pages/:pageId
// @access  Private (Trainer)
exports.updatePage = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return sendError(res, 404, 'Lesson not found');
    }

    // Check if the trainer owns this lesson's course
    const course = await verifyCourseOwnership(lesson.courseId, req.user.id);
    if (!course) {
      return sendError(res, 403, 'Not authorized to update pages in this lesson');
    }

    const page = lesson.pages.id(req.params.pageId);
    if (!page) {
      return sendError(res, 404, 'Page not found');
    }

    const { title, contentType, textContent, videoUrl, videoTitle } = req.body;

    if (title) page.title = title;
    if (contentType) page.contentType = contentType;
    if (textContent !== undefined) page.textContent = textContent;
    if (videoUrl !== undefined) page.videoUrl = videoUrl;
    if (videoTitle !== undefined) page.videoTitle = videoTitle;

    await lesson.save();

    sendSuccess(res, 200, { data: lesson });
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

// @desc    Delete page from lesson (Trainer only)
// @route   DELETE /api/lessons/:id/pages/:pageId
// @access  Private (Trainer)
exports.deletePage = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return sendError(res, 404, 'Lesson not found');
    }

    // Check if the trainer owns this lesson's course
    const course = await verifyCourseOwnership(lesson.courseId, req.user.id);
    if (!course) {
      return sendError(res, 403, 'Not authorized to delete pages from this lesson');
    }

    lesson.pages.id(req.params.pageId).deleteOne();
    
    // Reorder page numbers
    lesson.pages.forEach((page, index) => {
      page.pageNumber = index + 1;
    });

    await lesson.save();

    sendSuccess(res, 200, { data: lesson, message: 'Page deleted successfully' });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};
