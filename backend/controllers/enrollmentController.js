const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');

// @desc    Enroll in a course (Worker only)
// @route   POST /api/enrollments
// @access  Private (Worker)
exports.enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    // Check if user is a worker
    if (req.user.role !== 'worker') {
      return res.status(403).json({
        success: false,
        error: 'Only workers can enroll in courses'
      });
    }

    // Check if course exists and is published
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    if (course.status !== 'Published') {
      return res.status(403).json({
        success: false,
        error: 'This course is not available for enrollment'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      userId: req.user.id,
      courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: 'You are already enrolled in this course'
      });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      userId: req.user.id,
      courseId,
      status: 'Not Started',
      progress: 0
    });

    // Update course enrolled count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrolledCount: 1 }
    });

    res.status(201).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all enrollments for current user
// @route   GET /api/enrollments/my-courses
// @access  Private (Worker)
exports.getMyEnrollments = async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({
        success: false,
        error: 'Only workers can view enrollments'
      });
    }

    const enrollments = await Enrollment.find({ userId: req.user.id })
      .populate('courseId', 'title category level duration totalLessons')
      .populate('lastAccessedLesson', 'title')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get enrollment details for a specific course
// @route   GET /api/enrollments/course/:courseId
// @access  Private (Worker)
exports.getEnrollmentByCourse = async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({
        success: false,
        error: 'Only workers can view enrollments'
      });
    }

    const enrollment = await Enrollment.findOne({
      userId: req.user.id,
      courseId: req.params.courseId
    })
      .populate('courseId')
      .populate('lastAccessedLesson')
      .populate('completedLessons');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    // Get all lessons for the course
    const allLessons = await Lesson.find({ courseId: req.params.courseId })
      .sort({ orderIndex: 1 });

    // Get progress for each lesson
    const progressData = await Progress.find({
      userId: req.user.id,
      courseId: req.params.courseId
    });

    res.status(200).json({
      success: true,
      data: {
        enrollment,
        lessons: allLessons,
        progressData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update lesson progress (Worker only)
// @route   POST /api/enrollments/progress
// @access  Private (Worker)
exports.updateProgress = async (req, res) => {
  try {
    const { courseId, lessonId, pageId, isLessonCompleted } = req.body;

    if (req.user.role !== 'worker') {
      return res.status(403).json({
        success: false,
        error: 'Only workers can update progress'
      });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      userId: req.user.id,
      courseId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found. Please enroll first'
      });
    }

    // Update or create progress record
    let progress = await Progress.findOne({
      userId: req.user.id,
      lessonId
    });

    if (!progress) {
      progress = await Progress.create({
        userId: req.user.id,
        lessonId,
        courseId,
        completedPages: pageId ? [pageId] : [],
        lastAccessedPage: pageId || null
      });
    } else {
      // Update progress
      if (pageId && !progress.completedPages.includes(pageId)) {
        progress.completedPages.push(pageId);
      }
      if (pageId) {
        progress.lastAccessedPage = pageId;
      }
      await progress.save();
    }

    // Mark lesson as completed if specified
    if (isLessonCompleted && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = new Date();
      await progress.save();

      // Add to enrollment's completed lessons
      if (!enrollment.completedLessons.includes(lessonId)) {
        enrollment.completedLessons.push(lessonId);
      }
    }

    // Update enrollment status and progress
    enrollment.lastAccessedLesson = lessonId;
    enrollment.lastAccessedPage = pageId || 0;

    if (enrollment.status === 'Not Started') {
      enrollment.status = 'Learning';
    }

    // Calculate overall progress
    const totalLessons = await Lesson.countDocuments({ courseId });
    const completedLessonsCount = enrollment.completedLessons.length;
    enrollment.progress = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

    // Check if course is finished
    if (enrollment.progress === 100) {
      enrollment.status = 'Finished';
      enrollment.completionDate = new Date();
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      data: {
        enrollment,
        progress
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get continue learning info (last accessed lesson)
// @route   GET /api/enrollments/:enrollmentId/continue
// @access  Private (Worker)
exports.getContinueLearning = async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({
        success: false,
        error: 'Only workers can access this feature'
      });
    }

    const enrollment = await Enrollment.findById(req.params.enrollmentId)
      .populate('courseId')
      .populate('lastAccessedLesson');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    // Check if enrollment belongs to user
    if (enrollment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // If no last accessed lesson, get first lesson
    let nextLesson = enrollment.lastAccessedLesson;
    if (!nextLesson) {
      nextLesson = await Lesson.findOne({ courseId: enrollment.courseId._id })
        .sort({ orderIndex: 1 });
    }

    res.status(200).json({
      success: true,
      data: {
        enrollment,
        nextLesson,
        lastAccessedPage: enrollment.lastAccessedPage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get courses by status for worker
// @route   GET /api/enrollments/status/:status
// @access  Private (Worker)
exports.getCoursesByStatus = async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({
        success: false,
        error: 'Only workers can access this feature'
      });
    }

    const { status } = req.params;
    const validStatuses = ['Not Started', 'Learning', 'Finished'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const enrollments = await Enrollment.find({
      userId: req.user.id,
      status
    })
      .populate('courseId')
      .populate('lastAccessedLesson', 'title')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
