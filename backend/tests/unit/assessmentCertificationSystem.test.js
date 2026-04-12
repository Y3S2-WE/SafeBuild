jest.mock('../../models/Quiz', () => ({
  findById: jest.fn()
}));

jest.mock('../../models/QuizAttempt', () => ({
  create: jest.fn(),
  findById: jest.fn()
}));

jest.mock('../../models/Certificate', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  generateCertificateCode: jest.fn()
}));

jest.mock('../../utils/qrCodeGenerator', () => ({
  generateCertificateQRCode: jest.fn()
}));

const Quiz = require('../../models/Quiz');
const QuizAttempt = require('../../models/QuizAttempt');
const Certificate = require('../../models/Certificate');
const { generateCertificateQRCode } = require('../../utils/qrCodeGenerator');

const {
  submitQuizAttempt
} = require('../../controllers/quizAttemptController');
const {
  verifyCertificate
} = require('../../controllers/certificateController');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Assessment & Certification System unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('submitQuizAttempt should validate answer count', async () => {
    const req = {
      body: {
        quizId: 'quiz-1',
        answers: [{ selectedAnswer: 0 }],
        startedAt: new Date().toISOString()
      },
      user: {
        _id: 'user-1'
      }
    };

    const res = createRes();

    Quiz.findById.mockResolvedValue({
      _id: 'quiz-1',
      isActive: true,
      totalPoints: 100,
      passMark: 60,
      questions: [
        { _id: 'q1', answers: [{ isCorrect: true }], points: 50 },
        { _id: 'q2', answers: [{ isCorrect: true }], points: 50 }
      ]
    });

    await submitQuizAttempt(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'You must answer all 2 questions'
      })
    );
    expect(QuizAttempt.create).not.toHaveBeenCalled();
  });

  test('submitQuizAttempt should score and create certificate for passing attempt', async () => {
    const now = new Date();
    const req = {
      body: {
        quizId: 'quiz-1',
        answers: [{ selectedAnswer: 0 }, { selectedAnswer: 1 }],
        startedAt: new Date(now.getTime() - 4000).toISOString()
      },
      user: {
        _id: 'user-1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com'
      }
    };

    const res = createRes();

    Quiz.findById.mockResolvedValue({
      _id: 'quiz-1',
      title: 'Safety Basics',
      isActive: true,
      totalPoints: 100,
      passMark: 70,
      questions: [
        {
          _id: 'q1',
          points: 50,
          answers: [{ isCorrect: true }, { isCorrect: false }]
        },
        {
          _id: 'q2',
          points: 50,
          answers: [{ isCorrect: false }, { isCorrect: true }]
        }
      ]
    });

    QuizAttempt.create.mockResolvedValue({ _id: 'attempt-1' });
    Certificate.findOne.mockResolvedValue(null);
    Certificate.generateCertificateCode.mockResolvedValue('CERT-123');
    generateCertificateQRCode.mockReturnValue('https://example.com/qr/CERT-123');
    Certificate.create.mockResolvedValue({
      certificateCode: 'CERT-123',
      issuedAt: now,
      qrCodeUrl: 'https://example.com/qr/CERT-123'
    });

    const secondPopulate = jest.fn().mockResolvedValue({ _id: 'attempt-1' });
    const firstPopulate = jest.fn().mockReturnValue({ populate: secondPopulate });
    QuizAttempt.findById.mockReturnValue({ populate: firstPopulate });

    await submitQuizAttempt(req, res);

    expect(QuizAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 100,
        percentage: 100,
        passed: true
      })
    );

    expect(Certificate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        certificateCode: 'CERT-123',
        percentage: 100,
        quizTitle: 'Safety Basics'
      })
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining('Congratulations')
      })
    );
  });

  test('submitQuizAttempt should not create new certificate when valid one exists', async () => {
    const req = {
      body: {
        quizId: 'quiz-1',
        answers: [{ selectedAnswer: 0 }],
        startedAt: new Date().toISOString()
      },
      user: {
        _id: 'user-1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com'
      }
    };

    const res = createRes();

    Quiz.findById.mockResolvedValue({
      _id: 'quiz-1',
      title: 'Quick Quiz',
      isActive: true,
      totalPoints: 10,
      passMark: 50,
      questions: [{ _id: 'q1', points: 10, answers: [{ isCorrect: true }] }]
    });

    QuizAttempt.create.mockResolvedValue({ _id: 'attempt-2' });
    Certificate.findOne.mockResolvedValue({
      _id: 'cert-existing',
      certificateCode: 'EXIST-1',
      issuedAt: new Date(),
      qrCodeUrl: 'https://example.com/qr/EXIST-1'
    });

    const secondPopulate = jest.fn().mockResolvedValue({ _id: 'attempt-2' });
    const firstPopulate = jest.fn().mockReturnValue({ populate: secondPopulate });
    QuizAttempt.findById.mockReturnValue({ populate: firstPopulate });

    await submitQuizAttempt(req, res);

    expect(Certificate.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('verifyCertificate should uppercase code and mark expired certificate invalid', async () => {
    const req = {
      params: {
        code: 'cert-lower'
      }
    };
    const res = createRes();

    const expiredCert = {
      isValid: true,
      expiresAt: new Date('2000-01-01T00:00:00.000Z'),
      userName: 'Jane Doe',
      quizTitle: 'Safety Basics',
      certificateCode: 'CERT-LOWER',
      issuedAt: new Date('1999-01-01T00:00:00.000Z')
    };

    const secondPopulate = jest.fn().mockResolvedValue(expiredCert);
    const firstPopulate = jest.fn().mockReturnValue({ populate: secondPopulate });
    Certificate.findOne.mockReturnValue({ populate: firstPopulate });

    await verifyCertificate(req, res);

    expect(Certificate.findOne).toHaveBeenCalledWith({
      certificateCode: 'CERT-LOWER'
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ isValid: false })
      })
    );
  });
});
