const mongoose = require('mongoose');

// ==================== SUB-SCHEMAS ====================

/**
 * Comment schema for incident investigation notes
 * Embedded within incident documents for better query performance
 */
const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ==================== MAIN SCHEMA ====================

/**
 * Incident schema for safety incident reporting
 * Supports hazards, near-misses, and accidents
 */
const incidentSchema = new mongoose.Schema({
  // Basic Incident Information
  title: {
    type: String,
    required: [true, 'Please provide incident title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  type: {
    type: String,
    enum: {
      values: ['hazard', 'near-miss', 'accident'],
      message: '{VALUE} is not a valid incident type'
    },
    required: [true, 'Please specify incident type']
  },
  severity: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: '{VALUE} is not a valid severity level'
    },
    required: [true, 'Please specify severity level'],
    default: 'medium'
  },
  
  // Location Information
  location: {
    address: {
      type: String,
      required: [true, 'Please provide location address'],
      trim: true
    },
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      }
    }
  },
  
  // Incident Details
  description: {
    type: String,
    required: [true, 'Please provide incident description'],
    trim: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  evidencePhotos: [{
    url: {
      type: String,
      required: true
    },
    fileName: {
      type: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status and Workflow
  status: {
    type: String,
    enum: {
      values: ['open', 'investigating', 'resolved', 'closed'],
      message: '{VALUE} is not a valid status'
    },
    default: 'open'
  },
  
  // User References
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedByName: {
    type: String,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedToName: {
    type: String
  },
  
  // Investigation and Resolution
  comments: [commentSchema],
  resolutionNotes: {
    type: String,
    trim: true
  },
  
  // Date Tracking
  dateOccurred: {
    type: Date,
    required: [true, 'Please provide date when incident occurred']
  },
  dateReported: {
    type: Date,
    default: Date.now
  },
  dateResolved: {
    type: Date
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// ==================== INDEXES ====================

// Compound index for efficient filtering queries
incidentSchema.index({ status: 1, severity: 1, type: 1 });

// Single field indexes for common queries
incidentSchema.index({ reportedBy: 1 });
incidentSchema.index({ assignedTo: 1 });
incidentSchema.index({ dateOccurred: -1 });

// ==================== MIDDLEWARE ====================

/**
 * Pre-save middleware to automatically populate GeoJSON coordinates
 * Converts latitude/longitude to GeoJSON format for geospatial queries
 */
incidentSchema.pre('save', function(next) {
  if (this.location.latitude && this.location.longitude) {
    this.location.coordinates = {
      type: 'Point',
      coordinates: [this.location.longitude, this.location.latitude]
    };
  }
  next();
});

// ==================== INSTANCE METHODS ====================

/**
 * Check if incident is in an editable state
 * @returns {boolean} True if incident can be edited
 */
incidentSchema.methods.isEditable = function() {
  return this.status === 'open';
};

/**
 * Check if incident is resolved or closed
 * @returns {boolean} True if incident is in a final state
 */
incidentSchema.methods.isFinalState = function() {
  return ['resolved', 'closed'].includes(this.status);
};

/**
 * Get incident age in days
 * @returns {number} Number of days since incident occurred
 */
incidentSchema.methods.getAgeDays = function() {
  const now = new Date();
  const occurred = new Date(this.dateOccurred);
  const diffTime = Math.abs(now - occurred);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if incident is assigned to a user
 * @returns {boolean} True if incident has an assignee
 */
incidentSchema.methods.isAssigned = function() {
  return !!this.assignedTo;
};

/**
 * Get resolution time in days (if resolved)
 * @returns {number|null} Number of days to resolve, or null if not resolved
 */
incidentSchema.methods.getResolutionTimeDays = function() {
  if (!this.dateResolved) return null;
  
  const reported = new Date(this.dateReported);
  const resolved = new Date(this.dateResolved);
  const diffTime = Math.abs(resolved - reported);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ==================== STATIC METHODS ====================

/**
 * Find incidents by status
 * @param {string} status - Status to filter by
 * @returns {Promise<Array>} Array of incidents
 */
incidentSchema.statics.findByStatus = function(status) {
  return this.find({ status })
    .populate('reportedBy', 'firstName lastName email role')
    .populate('assignedTo', 'firstName lastName email role')
    .sort({ createdAt: -1 });
};

/**
 * Find incidents by severity
 * @param {string} severity - Severity level to filter by
 * @returns {Promise<Array>} Array of incidents
 */
incidentSchema.statics.findBySeverity = function(severity) {
  return this.find({ severity })
    .populate('reportedBy', 'firstName lastName email role')
    .populate('assignedTo', 'firstName lastName email role')
    .sort({ dateOccurred: -1 });
};

/**
 * Find unassigned incidents
 * @returns {Promise<Array>} Array of unassigned incidents
 */
incidentSchema.statics.findUnassigned = function() {
  return this.find({ assignedTo: null, status: { $in: ['open', 'investigating'] } })
    .populate('reportedBy', 'firstName lastName email role')
    .sort({ severity: -1, dateOccurred: 1 });
};

/**
 * Find overdue incidents (open for more than specified days)
 * @param {number} days - Number of days to consider overdue
 * @returns {Promise<Array>} Array of overdue incidents
 */
incidentSchema.statics.findOverdue = function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    status: { $in: ['open', 'investigating'] },
    dateReported: { $lt: cutoffDate }
  })
    .populate('reportedBy', 'firstName lastName email role')
    .populate('assignedTo', 'firstName lastName email role')
    .sort({ dateReported: 1 });
};

module.exports = mongoose.model('Incident', incidentSchema);
