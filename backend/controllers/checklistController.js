const ChecklistTemplate = require('../models/ChecklistTemplate');

/**
 * @desc    Create new checklist template
 * @route   POST /api/checklists
 * @access  Private (Manager, Officer)
 */
const createChecklist = async (req, res) => {
  try {
    const { title, description, category, items } = req.body;

    const checklist = await ChecklistTemplate.create({
      title,
      description,
      category,
      items,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Checklist template created successfully',
      data: checklist
    });
  } catch (error) {
    console.error('Create checklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating checklist template',
      error: error.message
    });
  }
};

/**
 * @desc    Get all checklist templates
 * @route   GET /api/checklists
 * @access  Private
 */
const getAllChecklists = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const checklists = await ChecklistTemplate.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: checklists.length,
      data: checklists
    });
  } catch (error) {
    console.error('Get checklists error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching checklist templates',
      error: error.message
    });
  }
};

/**
 * @desc    Get checklist template by ID
 * @route   GET /api/checklists/:id
 * @access  Private
 */
const getChecklistById = async (req, res) => {
  try {
    const checklist = await ChecklistTemplate.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: 'Checklist template not found'
      });
    }

    res.status(200).json({
      success: true,
      data: checklist
    });
  } catch (error) {
    console.error('Get checklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching checklist template',
      error: error.message
    });
  }
};

/**
 * @desc    Update checklist template
 * @route   PUT /api/checklists/:id
 * @access  Private (Manager, Officer)
 */
const updateChecklist = async (req, res) => {
  try {
    const { title, description, category, items, isActive } = req.body;

    const checklist = await ChecklistTemplate.findById(req.params.id);

    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: 'Checklist template not found'
      });
    }

    // Update fields
    if (title) checklist.title = title;
    if (description !== undefined) checklist.description = description;
    if (category) checklist.category = category;
    if (items) checklist.items = items;
    if (isActive !== undefined) checklist.isActive = isActive;

    await checklist.save();

    res.status(200).json({
      success: true,
      message: 'Checklist template updated successfully',
      data: checklist
    });
  } catch (error) {
    console.error('Update checklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating checklist template',
      error: error.message
    });
  }
};

/**
 * @desc    Delete checklist template
 * @route   DELETE /api/checklists/:id
 * @access  Private (Manager)
 */
const deleteChecklist = async (req, res) => {
  try {
    const checklist = await ChecklistTemplate.findById(req.params.id);

    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: 'Checklist template not found'
      });
    }

    await ChecklistTemplate.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Checklist template deleted successfully'
    });
  } catch (error) {
    console.error('Delete checklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting checklist template',
      error: error.message
    });
  }
};

module.exports = {
  createChecklist,
  getAllChecklists,
  getChecklistById,
  updateChecklist,
  deleteChecklist
};