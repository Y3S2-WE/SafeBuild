const express = require('express');
const router = express.Router();
const {
  createCorrectiveAction,
  getAllCorrectiveActions,
  getCorrectiveActionById,
  updateCorrectiveAction,
  deleteCorrectiveAction,
  getCorrectiveActionStats
} = require('../controllers/correctiveActionController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GET statistics - Manager, Officer only (place before /:id route)
router.get('/stats', authorize('manager', 'officer'), getCorrectiveActionStats);

// GET all corrective actions - Manager, Officer, Worker (filtered)
router.get('/', authorize('manager', 'officer', 'worker'), getAllCorrectiveActions);

// GET single corrective action - Manager, Officer, Worker (own only)
router.get('/:id', authorize('manager', 'officer', 'worker'), getCorrectiveActionById);

// POST create corrective action - Manager, Officer only
router.post('/', authorize('manager', 'officer'), createCorrectiveAction);

// PUT update corrective action - Manager, Officer, Worker (limited)
router.put('/:id', authorize('manager', 'officer', 'worker'), updateCorrectiveAction);

// DELETE corrective action - Manager only
router.delete('/:id', authorize('manager'), deleteCorrectiveAction);

module.exports = router;