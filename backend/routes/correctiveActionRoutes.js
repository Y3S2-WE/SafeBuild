const express = require('express');
const router = express.Router();
const {
  getAllCorrectiveActions,
  getCorrectiveActionById,
  uploadCompletionDocument,
  updateCorrectiveAction,
  deleteCorrectiveAction,
  getCorrectiveActionStats
} = require('../controllers/correctiveActionController');
const { protect, authorize } = require('../middleware/auth');
const { completionReportUpload } = require('../middleware/upload');
const { correctiveActionUpdateValidation } = require('../middleware/validator');

// All routes require authentication
router.use(protect);

// GET statistics - Manager only (place before /:id route)
router.get('/stats', authorize('manager'), getCorrectiveActionStats);

// GET all corrective actions - Manager, Officer, Safety Compliance Manager
router.get('/', authorize('manager', 'officer', 'safety-compliance-manager'), getAllCorrectiveActions);

// POST completion document upload - Safety Compliance Manager only
router.post(
  '/:id/completion-document',
  authorize('safety-compliance-manager'),
  completionReportUpload.single('reportFile'),
  uploadCompletionDocument
);

// GET single corrective action - Manager, Officer, Safety Compliance Manager (own only)
router.get('/:id', authorize('manager', 'officer', 'safety-compliance-manager'), getCorrectiveActionById);

// PUT update corrective action - Manager, Officer, Safety Compliance Manager (limited)
router.put('/:id', authorize('manager', 'officer', 'safety-compliance-manager'), correctiveActionUpdateValidation, updateCorrectiveAction);

// DELETE corrective action - Manager only
router.delete('/:id', authorize('manager'), deleteCorrectiveAction);

module.exports = router;