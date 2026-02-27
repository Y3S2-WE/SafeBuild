const Certificate = require('../models/Certificate');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

/**
 * @desc    Get all certificates for the authenticated user
 * @route   GET /api/certificates/my-certificates
 * @access  Private (Worker, Manager, Officer, Trainer)
 */
exports.getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ 
      user: req.user._id,
      isValid: true 
    })
      .populate('quiz', 'title description')
      .sort('-issuedAt');

    res.status(200).json({
      success: true,
      message: 'Certificates retrieved successfully',
      data: {
        count: certificates.length,
        certificates
      }
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve certificates',
      error: error.message
    });
  }
};

/**
 * @desc    Get certificate by ID
 * @route   GET /api/certificates/:id
 * @access  Private (Owner or Admin)
 */
exports.getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('quiz', 'title description')
      .populate('quizAttempt', 'score percentage submittedAt');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check authorization: user must own the certificate or be admin (manager/officer/trainer)
    const isOwner = certificate.user._id.toString() === req.user._id.toString();
    const isAdmin = ['manager', 'officer', 'trainer'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this certificate'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Certificate retrieved successfully',
      data: certificate
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve certificate',
      error: error.message
    });
  }
};

/**
 * @desc    Verify certificate by certificate code (Public)
 * @route   GET /api/certificates/verify/:code
 * @access  Public
 */
exports.verifyCertificate = async (req, res) => {
  try {
    const certificateCode = req.params.code.toUpperCase();
    
    const certificate = await Certificate.findOne({ certificateCode })
      .populate('user', 'firstName lastName email')
      .populate('quiz', 'title description');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found. Invalid certificate code.',
        data: {
          isValid: false
        }
      });
    }

    // Check if certificate is still valid
    if (!certificate.isValid) {
      return res.status(200).json({
        success: true,
        message: 'Certificate found but has been revoked',
        data: {
          isValid: false,
          certificate: {
            certificateCode: certificate.certificateCode,
            issuedAt: certificate.issuedAt,
            revokedAt: certificate.updatedAt
          }
        }
      });
    }

    // Check if certificate has expired
    if (certificate.expiresAt && new Date() > certificate.expiresAt) {
      return res.status(200).json({
        success: true,
        message: 'Certificate found but has expired',
        data: {
          isValid: false,
          certificate: {
            certificateCode: certificate.certificateCode,
            userName: certificate.userName,
            quizTitle: certificate.quizTitle,
            issuedAt: certificate.issuedAt,
            expiresAt: certificate.expiresAt
          }
        }
      });
    }

    // Certificate is valid
    res.status(200).json({
      success: true,
      message: 'Certificate is valid',
      data: {
        isValid: true,
        certificate: {
          certificateCode: certificate.certificateCode,
          userName: certificate.userName,
          userEmail: certificate.userEmail,
          quizTitle: certificate.quizTitle,
          score: certificate.score,
          totalPoints: certificate.totalPoints,
          percentage: certificate.percentage,
          issuedAt: certificate.issuedAt,
          expiresAt: certificate.expiresAt,
          qrCodeUrl: certificate.qrCodeUrl
        }
      }
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify certificate',
      error: error.message
    });
  }
};

/**
 * @desc    Get all certificates (Admin only)
 * @route   GET /api/certificates
 * @access  Private (Manager, Officer, Trainer)
 */
exports.getAllCertificates = async (req, res) => {
  try {
    const { userId, quizId, isValid } = req.query;
    
    // Build filter
    const filter = {};
    if (userId) filter.user = userId;
    if (quizId) filter.quiz = quizId;
    if (isValid !== undefined) filter.isValid = isValid === 'true';

    const certificates = await Certificate.find(filter)
      .populate('user', 'firstName lastName email role')
      .populate('quiz', 'title')
      .sort('-issuedAt');

    res.status(200).json({
      success: true,
      message: 'Certificates retrieved successfully',
      data: {
        count: certificates.length,
        certificates
      }
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve certificates',
      error: error.message
    });
  }
};

/**
 * @desc    Revoke a certificate (Admin only)
 * @route   PUT /api/certificates/:id/revoke
 * @access  Private (Manager, Officer, Trainer)
 */
exports.revokeCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    if (!certificate.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Certificate is already revoked'
      });
    }

    certificate.isValid = false;
    await certificate.save();

    res.status(200).json({
      success: true,
      message: 'Certificate revoked successfully',
      data: certificate
    });
  } catch (error) {
    console.error('Error revoking certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke certificate',
      error: error.message
    });
  }
};

/**
 * @desc    Get certificate statistics
 * @route   GET /api/certificates/stats/overview
 * @access  Private (Manager, Officer, Trainer)
 */
exports.getCertificateStats = async (req, res) => {
  try {
    const totalCertificates = await Certificate.countDocuments({ isValid: true });
    const revokedCertificates = await Certificate.countDocuments({ isValid: false });
    
    // Certificates issued in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCertificates = await Certificate.countDocuments({
      isValid: true,
      issuedAt: { $gte: thirtyDaysAgo }
    });

    // Top quizzes by certificates issued
    const topQuizzes = await Certificate.aggregate([
      { $match: { isValid: true } },
      { 
        $group: { 
          _id: '$quiz', 
          count: { $sum: 1 },
          quizTitle: { $first: '$quizTitle' }
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      message: 'Certificate statistics retrieved successfully',
      data: {
        totalCertificates,
        revokedCertificates,
        recentCertificates,
        topQuizzes
      }
    });
  } catch (error) {
    console.error('Error fetching certificate stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve certificate statistics',
      error: error.message
    });
  }
};
