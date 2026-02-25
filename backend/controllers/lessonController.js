const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Progress = require('../models/Progress');

// @desc    Create a new lesson (Trainer only)
// @route   POST /api/lessons
// @access  Private (Trainer)
exports.createLesson = async (req, res) => {
  try {
    const { courseId, title, description, orderIndex, pages, duration } = req.body;

    // Check if user is a trainer
    if (req.user.role !== 'trainer') {
      return res.status(403).json({
        success: false,
        error: 'Only trainers can create lessons'
      });
    }

    // Check if course exists and trainer owns it
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    if (course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add lessons to this course'
      });
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

    res.status(201).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all lessons for a course
// @route   GET /api/lessons/course/:courseId
// @access  Private
exports.getLessonsByCourse = async (req, res) => {
  try {
    const lessons = await Lesson.find({ courseId: req.params.courseId })
      .sort({ orderIndex: 1 });

    res.status(200).json({
      success: true,
      count: lessons.length,
      data: lessons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
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
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update lesson (Trainer only)
// @route   PUT /api/lessons/:id
// @access  Private (Trainer)
exports.updateLesson = async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({
        success: false,
        error: 'Only trainers can update lessons'
      });
    }

    let lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    // Check if the trainer owns this lesson's course
    const course = await Course.findById(lesson.courseId);
    if (course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this lesson'
      });
    }

    const { title, description, orderIndex, pages, duration } = req.body;

    lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { title, description, orderIndex, pages, duration },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete lesson (Trainer only)
// @route   DELETE /api/lessons/:id
// @access  Private (Trainer)
exports.deleteLesson = async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({
        success: false,
        error: 'Only trainers can delete lessons'
      });
    }

    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    // Check if the trainer owns this lesson's course
    const course = await Course.findById(lesson.courseId);
    if (course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this lesson'
      });
    }

    await lesson.deleteOne();

    // Update course total lessons count
    await Course.findByIdAndUpdate(lesson.courseId, {
      $inc: { totalLessons: -1 }
    });

    // Delete all progress records for this lesson
    await Progress.deleteMany({ lessonId: req.params.id });

    res.status(200).json({
      success: true,
      data: {},
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Add page to lesson (Trainer only)
// @route   POST /api/lessons/:id/pages
// @access  Private (Trainer)
exports.addPage = async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({
        success: false,
        error: 'Only trainers can add pages'
      });
    }

    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    // Check if the trainer owns this lesson's course
    const course = await Course.findById(lesson.courseId);
    if (course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add pages to this lesson'
      });
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

    res.status(201).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update page in lesson (Trainer only)
// @route   PUT /api/lessons/:id/pages/:pageId
// @access  Private (Trainer)
exports.updatePage = async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({
        success: false,
        error: 'Only trainers can update pages'
      });
    }

    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    // Check if the trainer owns this lesson's course
    const course = await Course.findById(lesson.courseId);
    if (course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update pages in this lesson'
      });
    }

    const page = lesson.pages.id(req.params.pageId);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Page not found'
      });
    }

    const { title, contentType, textContent, videoUrl, videoTitle } = req.body;

    if (title) page.title = title;
    if (contentType) page.contentType = contentType;
    if (textContent !== undefined) page.textContent = textContent;
    if (videoUrl !== undefined) page.videoUrl = videoUrl;
    if (videoTitle !== undefined) page.videoTitle = videoTitle;

    await lesson.save();

    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete page from lesson (Trainer only)
// @route   DELETE /api/lessons/:id/pages/:pageId
// @access  Private (Trainer)
exports.deletePage = async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({
        success: false,
        error: 'Only trainers can delete pages'
      });
    }

    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    // Check if the trainer owns this lesson's course
    const course = await Course.findById(lesson.courseId);
    if (course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete pages from this lesson'
      });
    }

    lesson.pages.id(req.params.pageId).deleteOne();
    
    // Reorder page numbers
    lesson.pages.forEach((page, index) => {
      page.pageNumber = index + 1;
    });

    await lesson.save();

    res.status(200).json({
      success: true,
      data: lesson,
      message: 'Page deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
