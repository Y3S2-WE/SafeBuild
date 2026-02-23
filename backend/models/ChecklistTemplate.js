const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [500, 'Question cannot exceed 500 characters']
  },
  expectedAnswer: {
    type: Boolean,
    required: [true, 'Expected answer is required'],
    default: true
  }
});

const checklistTemplateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['fire-safety', 'electrical', 'ppe', 'machinery', 'chemical', 'general', 'environmental', 'emergency'],
    default: 'general'
  },
  items: {
    type: [checklistItemSchema],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'At least one checklist item is required'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
checklistTemplateSchema.index({ category: 1, isActive: 1 });
checklistTemplateSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('ChecklistTemplate', checklistTemplateSchema);