const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Not Started', 'Learning', 'Finished'],
    default: 'Not Started'
  },
  progress: {
    type: Number,
    default: 0, // Percentage (0-100)
    min: 0,
    max: 100
  },
  lastAccessedLesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    default: null
  },
  lastAccessedPage: {
    type: Number,
    default: 0
  },
  completedLessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  completionDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Prevent duplicate enrollments
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ userId: 1 });
enrollmentSchema.index({ courseId: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
