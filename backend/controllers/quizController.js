const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

/**
 * @desc    Create new quiz
 * @route   POST /api/quizzes
 * @access  Private (Trainer only)
 */
const createQuiz = async (req, res) => {
  try {
    const { title, description, passMark, timeLimit } = req.body;

    const quiz = await Quiz.create({
      title,
      description,
      passMark,
      timeLimit,
      createdBy: req.user._id,
      questions: [] // Questions will be added later
    });

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating quiz',
      error: error.message
    });
  }
};

/**
 * @desc    Get all quizzes
 * @route   GET /api/quizzes
 * @access  Private
 */
const getAllQuizzes = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    let filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const quizzes = await Quiz.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quizzes',
      error: error.message
    });
  }
};

/**
 * @desc    Get quiz by ID
 * @route   GET /api/quizzes/:id
 * @access  Private
 */
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // If user is a worker, hide correct answers
    let quizData = quiz.toObject();
    if (req.user.role === 'worker') {
      quizData.questions = quizData.questions.map(q => ({
        _id: q._id,
        questionText: q.questionText,
        points: q.points,
        answers: q.answers.map(a => ({
          _id: a._id,
          answerText: a.answerText
          // Don't send isCorrect to workers
        }))
      }));
    }

    res.status(200).json({
      success: true,
      data: quizData
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz',
      error: error.message
    });
  }
};

/**
 * @desc    Update quiz
 * @route   PUT /api/quizzes/:id
 * @access  Private (Trainer only)
 */
const updateQuiz = async (req, res) => {
  try {
    const { title, description, passMark, timeLimit, isActive } = req.body;

    let quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Update fields
    if (title) quiz.title = title;
    if (description) quiz.description = description;
    if (passMark !== undefined) quiz.passMark = passMark;
    if (timeLimit !== undefined) quiz.timeLimit = timeLimit;
    if (isActive !== undefined) quiz.isActive = isActive;

    await quiz.save();

    res.status(200).json({
      success: true,
      message: 'Quiz updated successfully',
      data: quiz
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating quiz',
      error: error.message
    });
  }
};

/**
 * @desc    Delete quiz
 * @route   DELETE /api/quizzes/:id
 * @access  Private (Trainer only)
 */
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    await quiz.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting quiz',
      error: error.message
    });
  }
};

/**
 * @desc    Add question to quiz
 * @route   POST /api/quizzes/:id/questions
 * @access  Private (Trainer only)
 */
const addQuestion = async (req, res) => {
  try {
    const { questionText, answers, points } = req.body;

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Validate answers
    if (!answers || answers.length !== 4) {
      return res.status(400).json({
        success: false,
        message: 'Each question must have exactly 4 answers'
      });
    }

    // Check that exactly one answer is correct
    const correctAnswers = answers.filter(a => a.isCorrect);
    if (correctAnswers.length !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Each question must have exactly one correct answer'
      });
    }

    // Add question
    quiz.questions.push({
      questionText,
      answers,
      points: points || 1
    });

    await quiz.save();

    res.status(201).json({
      success: true,
      message: 'Question added successfully',
      data: quiz
    });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding question',
      error: error.message
    });
  }
};

/**
 * @desc    Update question in quiz
 * @route   PUT /api/quizzes/:id/questions/:questionId
 * @access  Private (Trainer only)
 */
const updateQuestion = async (req, res) => {
  try {
    const { questionText, answers, points } = req.body;
    const { id, questionId } = req.params;

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    const question = quiz.questions.id(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Validate answers if provided
    if (answers) {
      if (answers.length !== 4) {
        return res.status(400).json({
          success: false,
          message: 'Each question must have exactly 4 answers'
        });
      }

      const correctAnswers = answers.filter(a => a.isCorrect);
      if (correctAnswers.length !== 1) {
        return res.status(400).json({
          success: false,
          message: 'Each question must have exactly one correct answer'
        });
      }
    }

    // Update question
    if (questionText) question.questionText = questionText;
    if (answers) question.answers = answers;
    if (points !== undefined) question.points = points;

    await quiz.save();

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      data: quiz
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating question',
      error: error.message
    });
  }
};

/**
 * @desc    Delete question from quiz
 * @route   DELETE /api/quizzes/:id/questions/:questionId
 * @access  Private (Trainer only)
 */
const deleteQuestion = async (req, res) => {
  try {
    const { id, questionId } = req.params;

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    const question = quiz.questions.id(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    question.deleteOne();
    await quiz.save();

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
      data: quiz
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting question',
      error: error.message
    });
  }
};

module.exports = {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion
};
