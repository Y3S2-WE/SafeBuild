const CorrectiveAction = require('../models/CorrectiveAction');
const User = require('../models/User');

/**
 * Priority and due date mapping for corrective actions
 */
const categoryPriorityMap = {
  emergency: 'critical',
  'fire-safety': 'high',
  electrical: 'high',
  chemical: 'high',
  machinery: 'medium',
  ppe: 'medium',
  environmental: 'medium',
  general: 'low'
};

const priorityDueDaysMap = {
  critical: 1,
  high: 3,
  medium: 7,
  low: 14
};

const allowedPriorities = new Set(Object.keys(priorityDueDaysMap));

/**
 * Build due date based on priority and base date
 * @param {Date} baseDate - Starting date for calculation
 * @param {number} days - Number of days to add
 * @returns {Date} Calculated due date
 */
const buildDueDate = (baseDate = new Date(), days = 7) => {
  const dueDate = new Date(baseDate);
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate;
};

/**
 * Resolve priority level based on checklist category
 * @param {string} category - Checklist category
 * @returns {string} Priority level (critical, high, medium, low)
 */
const resolvePriorityForCategory = (category = 'general') => {
  return categoryPriorityMap[category] || 'medium';
};

/**
 * Build map of corrective action assignments from request data
 * @param {Array} assignments - Assignment data from request
 * @returns {Map} Map of questionId -> { assignedTo, priority }
 */
const buildCorrectiveAssignmentMap = (assignments = []) => {
  const map = new Map();

  if (!Array.isArray(assignments)) {
    return map;
  }

  assignments.forEach((item) => {
    if (!item?.questionId) {
      return;
    }

    map.set(String(item.questionId), {
      assignedTo: item.assignedTo ? String(item.assignedTo) : '',
      priority: item.priority || ''
    });
  });

  return map;
};

/**
 * Validate all corrective action assignments
 * @param {Array} failedResponses - Failed audit items
 * @param {Map} correctiveAssignmentMap - Assignment map
 * @returns {Object} { isValid, error, validComplianceManagerIdSet }
 */
const validateCorrectiveAssignments = async (failedResponses, correctiveAssignmentMap) => {
  // Check each failed item has assignment and priority
  const missingAssignment = failedResponses.find((response) => {
    const assignment = correctiveAssignmentMap.get(response.questionId.toString()) || {};
    return !assignment.assignedTo || !assignment.priority;
  });

  if (missingAssignment) {
    return {
      isValid: false,
      error: {
        status: 400,
        message: 'Every failed audit item must include assigned safety compliance manager and priority before submitting.'
      }
    };
  }

  // Validate all priorities
  const invalidPriority = failedResponses.find((response) => {
    const assignment = correctiveAssignmentMap.get(response.questionId.toString()) || {};
    return !allowedPriorities.has(assignment.priority);
  });

  if (invalidPriority) {
    return {
      isValid: false,
      error: {
        status: 400,
        message: 'Invalid priority in corrective action assignments.'
      }
    };
  }

  // Validate all assigned compliance managers exist and are active
  const assignedComplianceManagerIds = [
    ...new Set(
      failedResponses
        .map((response) => correctiveAssignmentMap.get(response.questionId.toString())?.assignedTo)
        .filter(Boolean)
    )
  ];

  const complianceManagers = await User.find({
    _id: { $in: assignedComplianceManagerIds },
    role: 'safety-compliance-manager',
    isActive: true
  }).select('_id');

  const validComplianceManagerIdSet = new Set(
    complianceManagers.map((manager) => manager._id.toString())
  );

  const invalidComplianceManager = assignedComplianceManagerIds.find(
    (id) => !validComplianceManagerIdSet.has(String(id))
  );

  if (invalidComplianceManager) {
    return {
      isValid: false,
      error: {
        status: 400,
        message: 'Corrective action assignee must be an active safety compliance manager.'
      }
    };
  }

  return {
    isValid: true,
    validComplianceManagerIdSet
  };
};

/**
 * Create corrective actions from failed audit responses
 * @param {Object} options - Options object
 * @param {Object} options.audit - Audit document
 * @param {Array} options.failedResponses - Array of failed responses
 * @param {string} options.createdBy - User ID of creator
 * @param {string} options.templateCategory - Category of the checklist template
 * @param {Map} options.correctiveAssignmentMap - Assignment map
 * @returns {Promise<number>} Number of corrective actions created
 */
const createCorrectiveActionsForFailedResponses = async ({
  audit,
  failedResponses,
  createdBy,
  templateCategory,
  correctiveAssignmentMap
}) => {
  if (!failedResponses.length) {
    return 0;
  }

  const failedQuestionIds = failedResponses
    .map((response) => response.questionId)
    .filter(Boolean);

  // Find existing corrective actions for these questions in this audit
  const existingActions = await CorrectiveAction.find({
    audit: audit._id,
    'relatedQuestion.questionId': { $in: failedQuestionIds }
  }).select('relatedQuestion.questionId');

  const existingQuestionIds = new Set(
    existingActions
      .map((action) => action.relatedQuestion?.questionId?.toString())
      .filter(Boolean)
  );

  // Build corrective actions for new failures
  const actionsToCreate = failedResponses
    .filter((response) => !existingQuestionIds.has(response.questionId.toString()))
    .map((response) => {
      const assignment = correctiveAssignmentMap.get(response.questionId.toString()) || {};
      const priority = assignment.priority || resolvePriorityForCategory(templateCategory);
      const dueDays = priorityDueDaysMap[priority] || 7;

      return {
        title: `Corrective Action - ${audit.site}`,
        description: response.comments
          ? `Failed audit item: ${response.question}. Notes: ${response.comments}`
          : `Failed audit item: ${response.question}`,
        audit: audit._id,
        relatedQuestion: {
          questionId: response.questionId,
          question: response.question
        },
        assignedTo: assignment.assignedTo,
        priority,
        dueDate: buildDueDate(new Date(), dueDays),
        createdBy
      };
    });

  if (!actionsToCreate.length) {
    return 0;
  }

  await CorrectiveAction.insertMany(actionsToCreate);
  return actionsToCreate.length;
};

module.exports = {
  buildDueDate,
  resolvePriorityForCategory,
  buildCorrectiveAssignmentMap,
  validateCorrectiveAssignments,
  createCorrectiveActionsForFailedResponses,
  categoryPriorityMap,
  priorityDueDaysMap,
  allowedPriorities
};
