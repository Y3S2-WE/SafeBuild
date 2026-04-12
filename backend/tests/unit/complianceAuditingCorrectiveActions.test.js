jest.mock('../../models/CorrectiveAction', () => ({
  find: jest.fn(),
  insertMany: jest.fn()
}));

jest.mock('../../models/User', () => ({
  find: jest.fn()
}));

const CorrectiveAction = require('../../models/CorrectiveAction');
const User = require('../../models/User');

const {
  buildCorrectiveAssignmentMap,
  validateCorrectiveAssignments,
  createCorrectiveActionsForFailedResponses,
  resolvePriorityForCategory,
  buildDueDate
} = require('../../services/correctiveActionService');

describe('Compliance Auditing & Corrective Actions unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('buildCorrectiveAssignmentMap should normalize valid assignment entries', () => {
    const map = buildCorrectiveAssignmentMap([
      { questionId: 101, assignedTo: 999, priority: 'high' },
      { assignedTo: 'missing-question', priority: 'low' }
    ]);

    expect(map.size).toBe(1);
    expect(map.get('101')).toEqual({ assignedTo: '999', priority: 'high' });
  });

  test('validateCorrectiveAssignments should fail when failed items miss assignment fields', async () => {
    const failedResponses = [{ questionId: 'q1', question: 'Q1' }];
    const map = buildCorrectiveAssignmentMap([]);

    const result = await validateCorrectiveAssignments(failedResponses, map);

    expect(result.isValid).toBe(false);
    expect(result.error.status).toBe(400);
  });

  test('validateCorrectiveAssignments should fail when priority is invalid', async () => {
    const failedResponses = [{ questionId: 'q1', question: 'Q1' }];
    const map = buildCorrectiveAssignmentMap([
      { questionId: 'q1', assignedTo: '507f1f77bcf86cd799439020', priority: 'urgent' }
    ]);

    const result = await validateCorrectiveAssignments(failedResponses, map);

    expect(result.isValid).toBe(false);
    expect(result.error.message).toMatch(/Invalid priority/i);
  });

  test('validateCorrectiveAssignments should fail for non-compliance-manager assignee', async () => {
    const failedResponses = [{ questionId: 'q1', question: 'Q1' }];
    const map = buildCorrectiveAssignmentMap([
      { questionId: 'q1', assignedTo: '507f1f77bcf86cd799439021', priority: 'high' }
    ]);

    const select = jest.fn().mockResolvedValue([]);
    User.find.mockReturnValue({ select });

    const result = await validateCorrectiveAssignments(failedResponses, map);

    expect(User.find).toHaveBeenCalled();
    expect(result.isValid).toBe(false);
    expect(result.error.message).toMatch(/active safety compliance manager/i);
  });

  test('createCorrectiveActionsForFailedResponses should insert only non-duplicate failed responses', async () => {
    const failedResponses = [
      {
        questionId: 'q-existing',
        question: 'Fire extinguisher available?',
        comments: 'Missing on level 2'
      },
      {
        questionId: 'q-new',
        question: 'Emergency exits clear?',
        comments: 'Blocked by boxes'
      }
    ];

    const select = jest.fn().mockResolvedValue([
      {
        relatedQuestion: {
          questionId: 'q-existing'
        }
      }
    ]);
    CorrectiveAction.find.mockReturnValue({ select });
    CorrectiveAction.insertMany.mockResolvedValue([]);

    const assignmentMap = buildCorrectiveAssignmentMap([
      {
        questionId: 'q-new',
        assignedTo: '507f1f77bcf86cd799439022',
        priority: 'critical'
      }
    ]);

    const createdCount = await createCorrectiveActionsForFailedResponses({
      audit: { _id: 'audit-1', site: 'Main Site' },
      failedResponses,
      createdBy: '507f1f77bcf86cd799439023',
      templateCategory: 'general',
      correctiveAssignmentMap: assignmentMap
    });

    expect(createdCount).toBe(1);
    expect(CorrectiveAction.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          audit: 'audit-1',
          assignedTo: '507f1f77bcf86cd799439022',
          priority: 'critical'
        })
      ])
    );
  });

  test('resolvePriorityForCategory and buildDueDate should return deterministic outputs', () => {
    expect(resolvePriorityForCategory('emergency')).toBe('critical');
    expect(resolvePriorityForCategory('unknown-category')).toBe('medium');

    const start = new Date('2026-01-01T00:00:00.000Z');
    const due = buildDueDate(start, 3);
    expect(due.toISOString()).toBe('2026-01-04T00:00:00.000Z');
  });
});
