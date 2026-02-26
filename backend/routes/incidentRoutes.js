const express = require('express');
const router = express.Router();
const {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident,
  addComment,
  updateIncidentStatus,
  getIncidentStats
} = require('../controllers/incidentController');
const { protect, authorize } = require('../middleware/auth');

// Statistics route (must be before /:id routes)
router.get('/stats/summary', protect, authorize('manager', 'officer'), getIncidentStats);

// Routes for all authenticated users
router.post('/', protect, createIncident);
router.get('/', protect, getAllIncidents);
router.get('/:id', protect, getIncidentById);

// Update and Delete: Workers can edit/delete their own (open incidents only), Manager/Officer can edit any
router.put('/:id', protect, updateIncident);
router.delete('/:id', protect, deleteIncident);

// Routes for Manager and Officer only
router.patch('/:id/status', protect, authorize('manager', 'officer'), updateIncidentStatus);
router.post('/:id/comments', protect, authorize('manager', 'officer'), addComment);

module.exports = router;
