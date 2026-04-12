require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SafeBuild API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
// Component 1: Training Course Manager + User Management
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/lessons', require('./routes/lessonRoutes'));
app.use('/api/enrollments', require('./routes/enrollmentRoutes'));

// Component 2: Assessment & Certification System
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/quiz-attempts', require('./routes/quizAttemptRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));

// Component 3: Incident & Hazard Reporting
app.use('/api/incidents', require('./routes/incidentRoutes'));

// Component 4: Compliance Auditing & Corrective Actions
app.use('/api/checklists', require('./routes/checklistRoutes'));
app.use('/api/audits', require('./routes/auditRoutes'));
app.use('/api/corrective-actions', require('./routes/correctiveActionRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Translation API (Hugging Face NLLB-200)
app.use('/api/translate', require('./routes/translateRoutes'));

// AI Safety Assistant Chatbot
app.use('/api/chat', require('./routes/chatRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}/api`);
  });
}

module.exports = app;
