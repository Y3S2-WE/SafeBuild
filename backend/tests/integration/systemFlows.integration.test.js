const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let app;

jest.setTimeout(90000);

const waitForMongooseConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  await new Promise((resolve, reject) => {
    const onConnected = () => {
      mongoose.connection.off('error', onError);
      resolve();
    };

    const onError = (err) => {
      mongoose.connection.off('connected', onConnected);
      reject(err);
    };

    mongoose.connection.once('connected', onConnected);
    mongoose.connection.once('error', onError);
  });
};

const registerUser = async ({ role, emailPrefix }) => {
  const payload = {
    firstName: role,
    lastName: 'User',
    email: `${emailPrefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`,
    password: 'Password123!',
    role
  };

  const response = await request(app)
    .post('/api/users/register')
    .send(payload)
    .expect(201);

  return {
    id: response.body.data.user.id,
    token: response.body.data.token,
    email: payload.email,
    password: payload.password
  };
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongoServer.getUri();

  app = require('../../server');
  await waitForMongooseConnection();
});

afterEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Integration: Training Course Manager', () => {
  it('allows trainer course creation and enforces worker visibility rules', async () => {
    const trainer = await registerUser({ role: 'trainer', emailPrefix: 'trainer-course' });
    const worker = await registerUser({ role: 'worker', emailPrefix: 'worker-course' });

    const publishedCoursePayload = {
      title: 'PPE Essentials',
      category: 'PPE',
      description: 'Mandatory PPE usage training.',
      level: 'Beginner',
      duration: 2,
      status: 'Published'
    };

    const draftCoursePayload = {
      title: 'Machine Safety Deep Dive',
      category: 'Machine Safety',
      description: 'Advanced machine safety controls.',
      level: 'Advanced',
      duration: 3,
      status: 'Draft'
    };

    await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${trainer.token}`)
      .send(publishedCoursePayload)
      .expect(201);

    await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${trainer.token}`)
      .send(draftCoursePayload)
      .expect(201);

    const trainerCoursesResponse = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${trainer.token}`)
      .expect(200);

    expect(trainerCoursesResponse.body.count).toBe(2);

    const workerCoursesResponse = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${worker.token}`)
      .expect(200);

    expect(workerCoursesResponse.body.count).toBe(1);
    expect(workerCoursesResponse.body.data[0].status).toBe('Published');
  });
});

describe('Integration: Assessment & Certification System', () => {
  it('creates a quiz, submits attempt, and verifies generated certificate', async () => {
    const trainer = await registerUser({ role: 'trainer', emailPrefix: 'trainer-assessment' });
    const worker = await registerUser({ role: 'worker', emailPrefix: 'worker-assessment' });

    const quizCreateResponse = await request(app)
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${trainer.token}`)
      .send({
        title: 'Electrical Safety Basics',
        description: 'Core electrical hazard awareness.',
        passMark: 70,
        timeLimit: 15
      })
      .expect(201);

    const quizId = quizCreateResponse.body.data._id;

    const addQuestionResponse = await request(app)
      .post(`/api/quizzes/${quizId}/questions`)
      .set('Authorization', `Bearer ${trainer.token}`)
      .send({
        questionText: 'What should be done before working on a live panel?',
        answers: [
          { answerText: 'Start immediately', isCorrect: false },
          { answerText: 'Lock out and tag out', isCorrect: true },
          { answerText: 'Ask a coworker only', isCorrect: false },
          { answerText: 'Skip PPE for speed', isCorrect: false }
        ],
        points: 10
      })
      .expect(201);

    expect(addQuestionResponse.body.data.questions).toHaveLength(1);

    const attemptResponse = await request(app)
      .post('/api/quiz-attempts')
      .set('Authorization', `Bearer ${worker.token}`)
      .send({
        quizId,
        answers: [{ selectedAnswer: 1 }],
        startedAt: new Date(Date.now() - 30_000).toISOString()
      })
      .expect(201);

    expect(attemptResponse.body.data.attempt.passed).toBe(true);
    expect(attemptResponse.body.data.certificate).toBeTruthy();

    const certificateCode = attemptResponse.body.data.certificate.certificateCode;

    const verificationResponse = await request(app)
      .get(`/api/certificates/verify/${certificateCode}`)
      .expect(200);

    expect(verificationResponse.body.data.isValid).toBe(true);
    expect(verificationResponse.body.data.certificate.certificateCode).toBe(certificateCode);
  });
});

describe('Integration: Incident & Hazard Reporting', () => {
  it('creates an incident as worker and allows manager status transition', async () => {
    const worker = await registerUser({ role: 'worker', emailPrefix: 'worker-incident' });
    const manager = await registerUser({ role: 'manager', emailPrefix: 'manager-incident' });

    const createIncidentResponse = await request(app)
      .post('/api/incidents')
      .set('Authorization', `Bearer ${worker.token}`)
      .send({
        title: 'Oil spill near loading dock',
        type: 'hazard',
        severity: 'medium',
        location: { address: 'Loading Dock B' },
        description: 'Visible slippery patch around forklift route.',
        dateOccurred: new Date().toISOString()
      })
      .expect(201);

    const incidentId = createIncidentResponse.body.data._id;
    expect(createIncidentResponse.body.data.status).toBe('open');

    const statusUpdateResponse = await request(app)
      .patch(`/api/incidents/${incidentId}/status`)
      .set('Authorization', `Bearer ${manager.token}`)
      .send({ status: 'investigating' })
      .expect(200);

    expect(statusUpdateResponse.body.data.status).toBe('investigating');

    await request(app)
      .patch(`/api/incidents/${incidentId}/status`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({ status: 'resolved' })
      .expect(403);
  });
});

describe('Integration: Compliance Auditing & Corrective Actions', () => {
  it('creates corrective actions from failed audit responses', async () => {
    const manager = await registerUser({ role: 'manager', emailPrefix: 'manager-audit' });
    const officer = await registerUser({ role: 'officer', emailPrefix: 'officer-audit' });
    const complianceManager = await registerUser({
      role: 'safety-compliance-manager',
      emailPrefix: 'scm-audit'
    });

    const checklistResponse = await request(app)
      .post('/api/checklists')
      .set('Authorization', `Bearer ${manager.token}`)
      .send({
        title: 'Weekly Fire Safety Walkthrough',
        description: 'Basic fire readiness checklist.',
        category: 'fire-safety',
        items: [
          { question: 'Fire extinguisher is unobstructed?', expectedAnswer: true }
        ]
      })
      .expect(201);

    const checklistId = checklistResponse.body.data._id;
    const questionId = checklistResponse.body.data.items[0]._id;

    const auditResponse = await request(app)
      .post('/api/audits')
      .set('Authorization', `Bearer ${manager.token}`)
      .send({
        site: 'Plant A - Zone 3',
        auditDate: new Date(Date.now() + 86_400_000).toISOString(),
        checklistTemplate: checklistId,
        assignedAuditor: officer.id
      })
      .expect(201);

    const auditId = auditResponse.body.data._id;

    await request(app)
      .put(`/api/audits/${auditId}`)
      .set('Authorization', `Bearer ${officer.token}`)
      .send({ status: 'in-progress' })
      .expect(200);

    const completedAuditResponse = await request(app)
      .put(`/api/audits/${auditId}`)
      .set('Authorization', `Bearer ${officer.token}`)
      .send({
        status: 'completed',
        findings: 'Extinguisher blocked by storage box.',
        responses: [
          {
            questionId,
            actualAnswer: false,
            comments: 'Blocked access path observed during inspection.'
          }
        ],
        correctiveAssignments: [
          {
            questionId,
            assignedTo: complianceManager.id,
            priority: 'high'
          }
        ]
      })
      .expect(200);

    expect(completedAuditResponse.body.data.autoCorrectiveActionsCreated).toBe(1);

    const correctiveActionsResponse = await request(app)
      .get('/api/corrective-actions')
      .set('Authorization', `Bearer ${manager.token}`)
      .expect(200);

    expect(correctiveActionsResponse.body.count).toBe(1);
    expect(correctiveActionsResponse.body.data[0].assignedTo._id.toString()).toBe(complianceManager.id);
    expect(correctiveActionsResponse.body.data[0].priority).toBe('high');
  });
});