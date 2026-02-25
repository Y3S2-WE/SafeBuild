const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');

// @desc    Create a new course (Trainer only)
// @route   POST /api/courses
// @access  Private (Trainer)
exports.createCourse = async (req, res) => {
  try {
    const { title, category, description, level, duration, status } = req.body;

    // Check if user is a trainer
    if (req.user.role !== 'trainer') {
      return res.status(403).json({
        success: false,
        error: 'Only trainers can create courses'
      });
    }

    const course = await Course.create({
      title,
      category,
      description,
      level,
      duration,
      status: status || 'Draft',
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all courses (with filters)
// @route   GET /api/courses
// @access  Private
exports.getAllCourses = async (req, res) => {
  try {
    const { category, level, status, search } = req.query;
    let query = {};

    // Workers can only see Published courses
    if (req.user.role === 'worker') {
      query.status = 'Published';
    } else {
      // Trainers can see all courses they created or all if admin
      if (status) {
        query.status = status;
      }
      if (req.user.role === 'trainer') {
        query.createdBy = req.user.id;
      }
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

    const courses = await Course.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
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
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Workers can only view Published courses
    if (req.user.role === 'worker' && course.status !== 'Published') {
      return res.status(403).json({
        success: false,
        error: 'This course is not available'
      });
    }

    // Get lessons for this course
    const lessons = await Lesson.find({ courseId: course._id })
      .sort({ orderIndex: 1 });

    res.status(200).json({
      success: true,
      data: {
        course,
        lessons
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update course (Trainer only)
// @route   PUT /api/courses/:id
// @access  Private (Trainer)
exports.updateCourse = async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({
        success: false,
        error: 'Only trainers can update courses'
      });
    }

    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check if the trainer owns this course
    if (course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this course'
      });
    }

    const { title, category, description, level, duration, status } = req.body;

    course = await Course.findByIdAndUpdate(
      req.params.id,
      { title, category, description, level, duration, status },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete course (Trainer only)
// @route   DELETE /api/courses/:id
// @access  Private (Trainer)
exports.deleteCourse = async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({
        success: false,
        error: 'Only trainers can delete courses'
      });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check if the trainer owns this course
    if (course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this course'
      });
    }

    // Delete all lessons associated with this course
    await Lesson.deleteMany({ courseId: req.params.id });

    // Delete all enrollments
    await Enrollment.deleteMany({ courseId: req.params.id });

    await course.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Course and associated data deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get course statistics (Trainer only)
// @route   GET /api/courses/:id/stats
// @access  Private (Trainer)
exports.getCourseStats = async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({
        success: false,
        error: 'Only trainers can view course statistics'
      });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    if (course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this course statistics'
      });
    }

    // Get enrollment statistics
    const totalEnrolled = await Enrollment.countDocuments({ courseId: req.params.id });
    const notStarted = await Enrollment.countDocuments({ courseId: req.params.id, status: 'Not Started' });
    const learning = await Enrollment.countDocuments({ courseId: req.params.id, status: 'Learning' });
    const finished = await Enrollment.countDocuments({ courseId: req.params.id, status: 'Finished' });

    // Get total lessons
    const totalLessons = await Lesson.countDocuments({ courseId: req.params.id });

    res.status(200).json({
      success: true,
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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
