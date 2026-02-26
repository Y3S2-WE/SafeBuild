const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');

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
 * Build query filters for courses
 * @param {Object} queryParams - Request query parameters
 * @param {String} userRole - User role
 * @param {String} userId - User ID
 * @returns {Object} MongoDB query object
 */
const buildCourseQuery = (queryParams, userRole, userId) => {
  const { category, level, status, search } = queryParams;
  let query = {};

  // Workers can only see Published courses
  if (userRole === 'worker') {
    query.status = 'Published';
  } else {
    // Trainers can see all courses they created
    if (status) query.status = status;
    if (userRole === 'trainer') query.createdBy = userId;
  }

  // Apply filters
  if (category) query.category = category;
  if (level) query.level = level;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  return query;
};


// @desc    Create a new course (Trainer only)
// @route   POST /api/courses
// @access  Private (Trainer)
exports.createCourse = async (req, res) => {
  try {
    const { title, category, description, level, duration, status } = req.body;

    const course = await Course.create({
      title,
      category,
      description,
      level,
      duration,
      status: status || 'Draft',
      createdBy: req.user.id
    });

    sendSuccess(res, 201, { data: course });
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

// @desc    Get all courses (with filters)
// @route   GET /api/courses
// @access  Private
exports.getAllCourses = async (req, res) => {
  try {
    const query = buildCourseQuery(req.query, req.user.role, req.user.id);

    const courses = await Course.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    sendSuccess(res, 200, { count: courses.length, data: courses });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!course) {
      return sendError(res, 404, 'Course not found');
    }

    // Workers can only view Published courses
    if (req.user.role === 'worker' && course.status !== 'Published') {
      return sendError(res, 403, 'This course is not available');
    }

    // Get lessons for this course
    const lessons = await Lesson.find({ courseId: course._id })
      .sort({ orderIndex: 1 });

    sendSuccess(res, 200, { data: { course, lessons } });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// @desc    Update course (Trainer only)
// @route   PUT /api/courses/:id
// @access  Private (Trainer)
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return sendError(res, 404, 'Course not found');
    }

    // Check if the trainer owns this course
    if (!isOwner(course, req.user.id)) {
      return sendError(res, 403, 'Not authorized to update this course');
    }

    const { title, category, description, level, duration, status } = req.body;

    course = await Course.findByIdAndUpdate(
      req.params.id,
      { title, category, description, level, duration, status },
      { new: true, runValidators: true }
    );

    sendSuccess(res, 200, { data: course });
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

// @desc    Delete course (Trainer only)
// @route   DELETE /api/courses/:id
// @access  Private (Trainer)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return sendError(res, 404, 'Course not found');
    }

    // Check if the trainer owns this course
    if (!isOwner(course, req.user.id)) {
      return sendError(res, 403, 'Not authorized to delete this course');
    }

    // Delete all lessons associated with this course
    await Lesson.deleteMany({ courseId: req.params.id });

    // Delete all enrollments
    await Enrollment.deleteMany({ courseId: req.params.id });

    await course.deleteOne();

    sendSuccess(res, 200, { data: {}, message: 'Course and associated data deleted successfully' });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// @desc    Get course statistics (Trainer only)
// @route   GET /api/courses/:id/stats
// @access  Private (Trainer)
exports.getCourseStats = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return sendError(res, 404, 'Course not found');
    }

    if (!isOwner(course, req.user.id)) {
      return sendError(res, 403, 'Not authorized to view this course statistics');
    }

    // Get enrollment statistics
    const totalEnrolled = await Enrollment.countDocuments({ courseId: req.params.id });
    const notStarted = await Enrollment.countDocuments({ courseId: req.params.id, status: 'Not Started' });
    const learning = await Enrollment.countDocuments({ courseId: req.params.id, status: 'Learning' });
    const finished = await Enrollment.countDocuments({ courseId: req.params.id, status: 'Finished' });

    // Get total lessons
    const totalLessons = await Lesson.countDocuments({ courseId: req.params.id });

    sendSuccess(res, 200, {
      data: {
        course: {
          id: course._id,
          title: course.title,
          status: course.status
        },
        enrollmentStats: {
          totalEnrolled,
          notStarted,
          learning,
          finished
        },
        totalLessons
      }
    });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};
