export const checklistCategories = [
  'fire-safety',
  'electrical',
  'ppe',
  'machinery',
  'chemical',
  'general',
  'environmental',
  'emergency'
];

export const auditStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled'];

export const correctivePriorities = ['low', 'medium', 'high', 'critical'];

export const correctiveStatuses = ['open', 'in-progress', 'completed', 'verified', 'closed'];

export const managerAllowedCorrectiveTransitions = {
  open: [],
  'in-progress': [],
  completed: [],
  verified: [],
  closed: []
};

export const officerAllowedCorrectiveTransitions = {
  open: [],
  'in-progress': [],
  completed: ['verified', 'in-progress'],
  verified: [],
  closed: []
};

export const safetyComplianceManagerAllowedCorrectiveTransitions = {
  open: ['in-progress'],
  'in-progress': ['completed'],
  completed: [],
  verified: [],
  closed: []
};
