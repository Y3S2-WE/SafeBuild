const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Certificate = require('../models/Certificate');

/**
 * @desc    Submit quiz attempt
 * @route   POST /api/quiz-attempts
 * @access  Private (Worker)
 */
const submitQuizAttempt = async (req, res) => {
  try {
    const { quizId, answers, startedAt } = req.body;

    // Get quiz with all questions
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    if (!quiz.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This quiz is not active'
      });
    }

    // Validate answers length
    if (!answers || answers.length !== quiz.questions.length) {
      return res.status(400).json({
        success: false,
        message: `You must answer all ${quiz.questions.length} questions`
      });
    }

    // Calculate score and mark answers
    let score = 0;
    const markedAnswers = [];

    answers.forEach((answer, index) => {
      const question = quiz.questions[index];
      const selectedAnswerIndex = answer.selectedAnswer;
      const isCorrect = question.answers[selectedAnswerIndex]?.isCorrect || false;
      
      const pointsEarned = isCorrect ? question.points : 0;
      score += pointsEarned;

      markedAnswers.push({
        questionId: question._id,
        selectedAnswer: selectedAnswerIndex,
        isCorrect,
        pointsEarned
      });
    });

    // Calculate percentage
    const percentage = quiz.totalPoints > 0 
      ? Math.round((score / quiz.totalPoints) * 100) 
      : 0;

    // Determine if passed
    const passed = percentage >= quiz.passMark;

    // Calculate time taken
    const submittedAt = new Date();
    const timeTaken = startedAt 
      ? Math.round((submittedAt - new Date(startedAt)) / 1000) 
      : 0;

    // Create quiz attempt
    const attempt = await QuizAttempt.create({
      user: req.user._id,
      quiz: quizId,
      answers: markedAnswers,
      score,
      percentage,
      passed,
      startedAt: startedAt || submittedAt,
      submittedAt,
      timeTaken
    });

    // Auto-generate certificate if passed
    let certificate = null;
    if (passed) {
      try {
        // Check if certificate already exists for this user and quiz
        const existingCertificate = await Certificate.findOne({
          user: req.user._id,
          quiz: quizId,
          isValid: true
        });

        // Only create new certificate if one doesn't exist
        if (!existingCertificate) {
          const certificateCode = await Certificate.generateCertificateCode();
          
          certificate = await Certificate.create({
            user: req.user._id,
            quiz: quizId,
            quizAttempt: attempt._id,
            certificateCode,
            quizTitle: quiz.title,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            userEmail: req.user.email,
            score,
            totalPoints: quiz.totalPoints,
            percentage
          });
        } else {
          certificate = existingCertificate;
        }
      } catch (certError) {
        console.error('Error generating certificate:', certError);
        // Don't fail the quiz attempt if certificate generation fails
      }
    }

    // Populate for response
    const populatedAttempt = await QuizAttempt.findById(attempt._id)
      .populate('quiz', 'title description passMark')
      .populate('user', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: passed 
        ? 'Congratulations! You passed the quiz! A certificate has been generated.' 
        : 'Quiz completed. Keep practicing!',
      data: {
        attempt: populatedAttempt,
        certificate: certificate ? {
          certificateCode: certificate.certificateCode,
          issuedAt: certificate.issuedAt
        } : null
      }
    });
  } catch (error) {
    console.error('Submit quiz attempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting quiz attempt',
      error: error.message
    });
  }
};

/**
 * @desc    Get user's quiz attempts
 * @route   GET /api/quiz-attempts/my-attempts
 * @access  Private
 */
const getMyAttempts = async (req, res) => {
  try {
    const { quizId } = req.query;

    let filter = { user: req.user._id };
    if (quizId) {
      filter.quiz = quizId;
    }

    const attempts = await QuizAttempt.find(filter)
      .populate('quiz', 'title description passMark totalPoints')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: attempts.length,
      data: attempts
    });
  } catch (error) {
    console.error('Get my attempts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your attempts',
      error: error.message
    });
  }
};

/**
 * @desc    Get attempt by ID
 * @route   GET /api/quiz-attempts/:id
 * @access  Private
 */
const getAttemptById = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id)
      .populate('quiz', 'title description passMark totalPoints questions')
      .populate('user', 'firstName lastName email employeeId');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    // Check if user can access this attempt
    if (req.user.role === 'worker' && attempt.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own attempts'
      });
    }

    res.status(200).json({
      success: true,
      data: attempt
    });
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attempt',
      error: error.message
    });
  }
};

/**
 * @desc    Get all quiz attempts (Admin only)
 * @route   GET /api/quiz-attempts
 * @access  Private (Trainer, Manager, Officer)
 */
const getAllAttempts = async (req, res) => {
  try {
    const { quizId, userId, passed } = req.query;

    let filter = {};
    if (quizId) filter.quiz = quizId;
    if (userId) filter.user = userId;
    if (passed !== undefined) filter.passed = passed === 'true';

    const attempts = await QuizAttempt.find(filter)
      .populate('quiz', 'title description passMark')
      .populate('user', 'firstName lastName email employeeId')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: attempts.length,
      data: attempts
    });
  } catch (error) {
    console.error('Get all attempts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attempts',
      error: error.message
    });
  }
};

/**
 * @desc    Get quiz statistics
 * @route   GET /api/quiz-attempts/quiz/:quizId/stats
 * @access  Private (Trainer, Manager, Officer)
 */
const getQuizStats = async (req, res) => {
  try {
    const { quizId } = req.params;

    const attempts = await QuizAttempt.find({ quiz: quizId });

    if (attempts.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalAttempts: 0,
          passedAttempts: 0,
          failedAttempts: 0,
          passRate: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0
        }
      });
    }

    const passedAttempts = attempts.filter(a => a.passed).length;
    const failedAttempts = attempts.length - passedAttempts;
    const passRate = Math.round((passedAttempts / attempts.length) * 100);
    
    const scores = attempts.map(a => a.percentage);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    res.status(200).json({
      success: true,
      data: {
        totalAttempts: attempts.length,
        passedAttempts,
        failedAttempts,
        passRate,
        averageScore,
        highestScore,
        lowestScore
      }
    });
  } catch (error) {
    console.error('Get quiz stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz statistics',
      error: error.message
    });
  }
};

module.exports = {
  submitQuizAttempt,
  getMyAttempts,
  getAttemptById,
  getAllAttempts,
  getQuizStats
};
