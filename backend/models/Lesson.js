const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  pageNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: [true, 'Page title is required'],
    trim: true
  },
  contentType: {
    type: String,
    enum: ['text', 'video', 'mixed'],
    default: 'text'
  },
  textContent: {
    type: String, // Rich text content from text editor
    default: ''
  },
  videoUrl: {
    type: String, // YouTube or other video link
    default: ''
  },
  videoTitle: {
    type: String,
    default: ''
  }
}, { _id: true });

const lessonSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  orderIndex: {
    type: Number,
    required: true,
    default: 0
  },
  pages: [pageSchema],
  duration: {
    type: Number, // Duration in minutes
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
lessonSchema.index({ courseId: 1, orderIndex: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
