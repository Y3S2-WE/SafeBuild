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
const { checklistValidation } = require('../middleware/validator');

// All routes require authentication
router.use(protect);

// GET all checklists - All authenticated users
router.get('/', getAllChecklists);

// GET single checklist - All authenticated users
router.get('/:id', getChecklistById);

// POST create checklist - Manager only
router.post('/', authorize('manager'), checklistValidation, createChecklist);

// PUT update checklist - Manager only
router.put('/:id', authorize('manager'), checklistValidation, updateChecklist);

// DELETE checklist - Manager only
router.delete('/:id', authorize('manager'), deleteChecklist);

module.exports = router;