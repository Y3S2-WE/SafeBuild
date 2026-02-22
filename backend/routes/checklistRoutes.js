const express = require('express');
const router = express.Router();
const {
  createChecklist,
  getAllChecklists,
  getChecklistById,
  updateChecklist,
  deleteChecklist
} = require('../controllers/checklistController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GET all checklists - All authenticated users
router.get('/', getAllChecklists);

// GET single checklist - All authenticated users
router.get('/:id', getChecklistById);

// POST create checklist - Manager, Officer only
router.post('/', authorize('manager', 'officer'), createChecklist);

// PUT update checklist - Manager, Officer only
router.put('/:id', authorize('manager', 'officer'), updateChecklist);

// DELETE checklist - Manager only
router.delete('/:id', authorize('manager'), deleteChecklist);

module.exports = router;