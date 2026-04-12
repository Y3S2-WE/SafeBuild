jest.mock('../../models/Incident', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn()
}));

jest.mock('../../models/User', () => ({
  findById: jest.fn()
}));

const Incident = require('../../models/Incident');
const {
  getAllIncidents,
  deleteIncident,
  addComment,
  updateIncidentStatus
} = require('../../controllers/incidentController');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Incident & Hazard Reporting unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('updateIncidentStatus should reject invalid status values', async () => {
    const req = {
      params: {
        id: '507f1f77bcf86cd799439011'
      },
      body: {
        status: 'unknown-status'
      }
    };
    const res = createRes();

    await updateIncidentStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Invalid status')
      })
    );
    expect(Incident.findById).not.toHaveBeenCalled();
  });

  test('getAllIncidents should scope workers to their own incidents', async () => {
    const req = {
      query: {
        page: '1',
        limit: '10',
        search: 'ladder'
      },
      user: {
        _id: '507f1f77bcf86cd799439012',
        role: 'worker'
      }
    };
    const res = createRes();

    const queryChain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ _id: 'incident-1' }])
    };

    Incident.find.mockReturnValue(queryChain);
    Incident.countDocuments.mockResolvedValue(1);

    await getAllIncidents(req, res);

    expect(Incident.find).toHaveBeenCalledWith(
      expect.objectContaining({
        reportedBy: '507f1f77bcf86cd799439012'
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('deleteIncident should block worker from deleting non-open incident', async () => {
    const req = {
      params: {
        id: '507f1f77bcf86cd799439013'
      },
      user: {
        _id: '507f1f77bcf86cd799439014',
        role: 'worker'
      }
    };
    const res = createRes();

    const incident = {
      _id: '507f1f77bcf86cd799439013',
      status: 'investigating',
      reportedBy: {
        toString: () => '507f1f77bcf86cd799439014'
      },
      deleteOne: jest.fn()
    };

    Incident.findById.mockResolvedValue(incident);

    await deleteIncident(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(incident.deleteOne).not.toHaveBeenCalled();
  });

  test('addComment should trim and append comment object', async () => {
    const req = {
      params: {
        id: '507f1f77bcf86cd799439015'
      },
      body: {
        comment: '  Please inspect site immediately.  '
      },
      user: {
        _id: '507f1f77bcf86cd799439099',
        firstName: 'Alex',
        lastName: 'Brown',
        role: 'officer'
      }
    };
    const res = createRes();

    const comments = [];
    const incident = {
      comments,
      save: jest.fn().mockResolvedValue(),
      populate: jest.fn().mockResolvedValue()
    };

    Incident.findById.mockResolvedValue(incident);

    await addComment(req, res);

    expect(comments).toHaveLength(1);
    expect(comments[0]).toEqual(
      expect.objectContaining({
        comment: 'Please inspect site immediately.',
        userRole: 'officer'
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
