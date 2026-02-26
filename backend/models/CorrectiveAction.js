const mongoose = require('mongoose');

const correctiveActionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  audit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Audit',
    required: [true, 'Associated audit is required']
  },
  // Reference to specific failed question from audit (optional but useful)
  relatedQuestion: {
    questionId: {
      type: mongoose.Schema.Types.ObjectId
    },
    question: {
      type: String
    }
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned user is required']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'verified', 'closed'],
    default: 'open'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  completedAt: {
    type: Date
  },
  completionNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Completion notes cannot exceed 1000 characters']
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  verificationNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Verification notes cannot exceed 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
correctiveActionSchema.index({ status: 1, priority: 1 });
correctiveActionSchema.index({ assignedTo: 1, status: 1 });
correctiveActionSchema.index({ audit: 1 });
correctiveActionSchema.index({ dueDate: 1 });

// Virtual for checking if overdue
correctiveActionSchema.virtual('isOverdue').get(function() {
  if (['completed', 'verified', 'closed'].includes(this.status)) {
    return false;
  }
  return new Date() > this.dueDate;
});

// Ensure virtuals are included in JSON
correctiveActionSchema.set('toJSON', { virtuals: true });
correctiveActionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CorrectiveAction', correctiveActionSchema);