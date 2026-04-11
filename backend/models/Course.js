const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: ['PPE', 'Electrical Safety', 'Working at Heights', 'Fire Safety', 'First Aid', 'Hazardous Materials', 'Machine Safety', 'Confined Spaces', 'Other']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  level: {
    type: String,
    required: [true, 'Course level is required'],
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  duration: {
    type: Number, // Duration in hours
    required: [true, 'Course duration is required'],
    min: [0.5, 'Duration must be at least 0.5 hours']
  },
  status: {
    type: String,
    required: true,
    enum: ['Draft', 'Published'],
    default: 'Draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrolledCount: {
    type: Number,
    default: 0
  },
  totalLessons: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for filtering
courseSchema.index({ category: 1, level: 1, status: 1 });
courseSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Course', courseSchema);
