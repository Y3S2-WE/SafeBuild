const express = require('express');
const router = express.Router();
const {
  createAudit,
  getAllAudits,
  getAuditById,
  updateAudit,
  deleteAudit
} = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GET all audits - All authenticated users
router.get('/', getAllAudits);

// GET single audit - All authenticated users
router.get('/:id', getAuditById);

// POST create/schedule audit - Manager, Officer only
router.post('/', authorize('manager', 'officer'), createAudit);

// PUT update audit - Manager, Officer only
router.put('/:id', authorize('manager', 'officer'), updateAudit);

// DELETE audit - Manager only
router.delete('/:id', authorize('manager'), deleteAudit);

module.exports = router;