const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: [true, 'Quiz is required']
  },
  quizAttempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizAttempt',
    required: [true, 'Quiz attempt is required']
  },
  certificateCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  quizTitle: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalPoints: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null // null means never expires
  },
  isValid: {
    type: Boolean,
    default: true
  },
  qrCodeUrl: {
    type: String,
    required: false,
    default: null
  }
}, {
  timestamps: true
});

// Index for fast certificate verification
certificateSchema.index({ certificateCode: 1 });
certificateSchema.index({ user: 1, quiz: 1 });

// Static method to generate unique certificate code
certificateSchema.statics.generateCertificateCode = async function() {
  let code;
  let exists = true;
  
  while (exists) {
    // Generate code: CERT-XXXXXXXX (8 random alphanumeric characters)
    const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
    code = `CERT-${randomStr}`;
    
    // Check if code already exists
    const existingCert = await this.findOne({ certificateCode: code });
    exists = !!existingCert;
  }
  
  return code;
};

module.exports = mongoose.model('Certificate', certificateSchema);
