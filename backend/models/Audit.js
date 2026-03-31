const mongoose = require('mongoose');

// Schema for individual audit responses (answers to checklist questions)
const auditResponseSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  expectedAnswer: {
    type: Boolean,
    required: true
  },
  actualAnswer: {
    type: Boolean,
    required: true
  },
  passed: {
    type: Boolean,
    required: true
  },
  comments: {
    type: String,
    trim: true,
    maxlength: [500, 'Comments cannot exceed 500 characters']
  }
});

const auditSchema = new mongoose.Schema({
  site: {
    type: String,
    required: [true, 'Site/Location is required'],
    trim: true,
    maxlength: [200, 'Site name cannot exceed 200 characters']
  },
  auditDate: {
    type: Date,
    required: [true, 'Audit date is required']
  },
  checklistTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChecklistTemplate',
    required: [true, 'Checklist template is required']
  },
  assignedAuditor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned auditor is required']
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  responses: [auditResponseSchema],
  score: {
    total: { type: Number, default: 0 },
    passed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },
  findings: {
    type: String,
    trim: true,
    maxlength: [2000, 'Findings cannot exceed 2000 characters']
  },
  cancelReason: {
    type: String,
    trim: true,
    maxlength: [1000, 'Cancellation reason cannot exceed 1000 characters']
  },
  completedAt: {
    type: Date
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
auditSchema.index({ status: 1, auditDate: 1 });
auditSchema.index({ assignedAuditor: 1, status: 1 });
auditSchema.index({ checklistTemplate: 1 });
auditSchema.index({ site: 'text' });

module.exports = mongoose.model('Audit', auditSchema);