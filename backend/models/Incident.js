const mongoose = require('mongoose');

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

const incidentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide incident title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  type: {
    type: String,
    enum: ['hazard', 'near-miss', 'accident'],
    required: [true, 'Please specify incident type']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: [true, 'Please specify severity level'],
    default: 'medium'
  },
  location: {
    address: {
      type: String,
      required: [true, 'Please provide location address'],
      trim: true
    },
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
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
  status: {
    type: String,
    enum: ['open', 'investigating', 'resolved', 'closed'],
    default: 'open'
  },
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
  comments: [commentSchema],
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
  },
  resolutionNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
incidentSchema.index({ status: 1, severity: 1, type: 1 });
incidentSchema.index({ reportedBy: 1 });
incidentSchema.index({ assignedTo: 1 });
incidentSchema.index({ dateOccurred: -1 });

// Update coordinates when latitude/longitude are provided
incidentSchema.pre('save', function(next) {
  if (this.location.latitude && this.location.longitude) {
    this.location.coordinates = {
      type: 'Point',
      coordinates: [this.location.longitude, this.location.latitude]
    };
  }
  next();
});

module.exports = mongoose.model('Incident', incidentSchema);
