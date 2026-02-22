const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true
  },
  expectedAnswer: {
    type: Boolean,
    default: true // true = Yes expected, false = No expected
  }
});

const checklistTemplateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Template title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    enum: ['fire-safety', 'electrical', 'ppe', 'machinery', 'general', 'environmental'],
    default: 'general'
  },
  items: [checklistItemSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChecklistTemplate', checklistTemplateSchema);