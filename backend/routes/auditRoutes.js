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
const { auditCreateValidation, auditExecutionValidation } = require('../middleware/validator');

// All routes require authentication
router.use(protect);

// GET all audits - All authenticated users
router.get('/', getAllAudits);

// GET single audit - All authenticated users
router.get('/:id', getAuditById);

// POST create/schedule audit - Manager only
router.post('/', authorize('manager'), auditCreateValidation, createAudit);

// PUT update audit - Manager, Officer only
router.put('/:id', authorize('manager', 'officer'), auditExecutionValidation, updateAudit);

// DELETE audit - Manager only
router.delete('/:id', authorize('manager'), deleteAudit);

module.exports = router;