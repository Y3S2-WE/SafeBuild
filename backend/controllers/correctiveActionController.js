const CorrectiveAction = require('../models/CorrectiveAction');
const Audit = require('../models/Audit');

/**
 * @desc    Create new corrective action
 * @route   POST /api/corrective-actions
 * @access  Private (Manager, Officer)
 */
const createCorrectiveAction = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      audit, 
      relatedQuestion,
      assignedTo, 
      priority, 
      dueDate 
    } = req.body;

    // Verify audit exists
    const auditExists = await Audit.findById(audit);
    if (!auditExists) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found'
      });
    }

    // Validate related question if provided
    if (relatedQuestion && relatedQuestion.questionId) {
      const failedResponse = auditExists.responses.find(
        r => r.questionId.toString() === relatedQuestion.questionId && !r.passed
      );
      
      if (!failedResponse) {
        return res.status(400).json({
          success: false,
          message: 'Related question must be a failed item from the audit'
        });
      }
    }

    const correctiveAction = await CorrectiveAction.create({
      title,
      description,
      audit,
      relatedQuestion,
      assignedTo,
      priority,
      dueDate,
      createdBy: req.user._id
    });

    await correctiveAction.populate([
      { path: 'audit', select: 'site auditDate status score' },
      { path: 'assignedTo', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Corrective action created successfully',
      data: correctiveAction
    });
  } catch (error) {
    console.error('Create corrective action error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating corrective action',
      error: error.message
    });
  }
};

/**
 * @desc    Get all corrective actions with filters
 * @route   GET /api/corrective-actions
 * @access  Private (Manager, Officer see all; Worker sees only assigned)
 */
const getAllCorrectiveActions = async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      assignedTo, 
      audit, 
      overdue,
      startDate,
      endDate 
    } = req.query;
    
    const filter = {};

    // Workers can only see their own assigned corrective actions
    if (req.user.role === 'worker') {
      filter.assignedTo = req.user._id;
    } else {
      if (assignedTo) filter.assignedTo = assignedTo;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (audit) filter.audit = audit;
    
    // Filter overdue items
    if (overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $nin: ['completed', 'verified', 'closed'] };
    }

    // Filter by due date range
    if (startDate || endDate) {
      filter.dueDate = filter.dueDate || {};
      if (startDate) filter.dueDate.$gte = new Date(startDate);
      if (endDate) filter.dueDate.$lte = new Date(endDate);
    }

    const correctiveActions = await CorrectiveAction.find(filter)
      .populate('audit', 'site auditDate status')
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('verifiedBy', 'firstName lastName')
      .sort({ dueDate: 1, priority: -1 });

    res.status(200).json({
      success: true,
      count: correctiveActions.length,
      data: correctiveActions
    });
  } catch (error) {
    console.error('Get corrective actions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching corrective actions',
      error: error.message
    });
  }
};

/**
 * @desc    Get corrective action by ID
 * @route   GET /api/corrective-actions/:id
 * @access  Private
 */
const getCorrectiveActionById = async (req, res) => {
  try {
    const correctiveAction = await CorrectiveAction.findById(req.params.id)
      .populate({
        path: 'audit',
        select: 'site auditDate status checklistTemplate responses score',
        populate: {
          path: 'checklistTemplate',
          select: 'title category'
        }
      })
      .populate('assignedTo', 'firstName lastName email role')
      .populate('createdBy', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName email');

    if (!correctiveAction) {
      return res.status(404).json({
        success: false,
        message: 'Corrective action not found'
      });
    }

    // Workers can only view their own assigned corrective actions
    if (req.user.role === 'worker' && 
        correctiveAction.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view corrective actions assigned to you'
      });
    }

    res.status(200).json({
      success: true,
      data: correctiveAction
    });
  } catch (error) {
    console.error('Get corrective action error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching corrective action',
      error: error.message
    });
  }
};

/**
 * @desc    Update corrective action
 * @route   PUT /api/corrective-actions/:id
 * @access  Private (Manager, Officer can update all; Worker can update status of own)
 */
const updateCorrectiveAction = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      assignedTo, 
      priority, 
      status, 
      dueDate,
      completionNotes,
      verificationNotes
    } = req.body;

    const correctiveAction = await CorrectiveAction.findById(req.params.id);

    if (!correctiveAction) {
      return res.status(404).json({
        success: false,
        message: 'Corrective action not found'
      });
    }

    // Prevent modifying closed corrective actions
    if (correctiveAction.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify a closed corrective action'
      });
    }

    // Workers can only update status of their own assigned corrective actions
    if (req.user.role === 'worker') {
      if (correctiveAction.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update corrective actions assigned to you'
        });
      }
      
      // Workers can only update status to 'in-progress' or 'completed'
      if (status) {
        const allowedWorkerStatuses = ['in-progress', 'completed'];
        const allowedWorkerTransitions = {
          'open': ['in-progress'],
          'in-progress': ['completed']
        };

        if (!allowedWorkerStatuses.includes(status)) {
          return res.status(403).json({
            success: false,
            message: 'Workers can only update status to in-progress or completed'
          });
        }

        if (!allowedWorkerTransitions[correctiveAction.status]?.includes(status)) {
          return res.status(400).json({
            success: false,
            message: `Cannot change status from '${correctiveAction.status}' to '${status}'`
          });
        }

        correctiveAction.status = status;
        
        if (status === 'completed') {
          correctiveAction.completedAt = new Date();
        }
      }

      // Workers can add completion notes
      if (completionNotes) {
        correctiveAction.completionNotes = completionNotes;
      }

    } else {
      // Manager/Officer can update all fields
      if (title) correctiveAction.title = title;
      if (description) correctiveAction.description = description;
      if (assignedTo) correctiveAction.assignedTo = assignedTo;
      if (priority) correctiveAction.priority = priority;
      if (dueDate) correctiveAction.dueDate = dueDate;
      if (completionNotes) correctiveAction.completionNotes = completionNotes;
      if (verificationNotes) correctiveAction.verificationNotes = verificationNotes;
      
      if (status) {
        // Validate status transitions for Manager/Officer
        const validTransitions = {
          'open': ['in-progress', 'closed'],
          'in-progress': ['completed', 'open', 'closed'],
          'completed': ['verified', 'in-progress', 'closed'],
          'verified': ['closed']
        };

        if (!validTransitions[correctiveAction.status]?.includes(status)) {
          return res.status(400).json({
            success: false,
            message: `Cannot change status from '${correctiveAction.status}' to '${status}'`
          });
        }

        correctiveAction.status = status;
        
        if (status === 'completed') {
          correctiveAction.completedAt = new Date();
        }
        
        if (status === 'verified') {
          correctiveAction.verifiedBy = req.user._id;
          correctiveAction.verifiedAt = new Date();
        }
      }
    }

    await correctiveAction.save();

    await correctiveAction.populate([
      { path: 'audit', select: 'site auditDate status' },
      { path: 'assignedTo', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName' },
      { path: 'verifiedBy', select: 'firstName lastName' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Corrective action updated successfully',
      data: correctiveAction
    });
  } catch (error) {
    console.error('Update corrective action error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating corrective action',
      error: error.message
    });
  }
};

/**
 * @desc    Delete corrective action
 * @route   DELETE /api/corrective-actions/:id
 * @access  Private (Manager only)
 */
const deleteCorrectiveAction = async (req, res) => {
  try {
    const correctiveAction = await CorrectiveAction.findById(req.params.id);

    if (!correctiveAction) {
      return res.status(404).json({
        success: false,
        message: 'Corrective action not found'
      });
    }

    // Prevent deleting verified or closed corrective actions
    if (['verified', 'closed'].includes(correctiveAction.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete a ${correctiveAction.status} corrective action`
      });
    }

    await CorrectiveAction.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Corrective action deleted successfully'
    });
  } catch (error) {
    console.error('Delete corrective action error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting corrective action',
      error: error.message
    });
  }
};

/**
 * @desc    Get corrective actions statistics/dashboard
 * @route   GET /api/corrective-actions/stats
 * @access  Private (Manager, Officer)
 */
const getCorrectiveActionStats = async (req, res) => {
  try {
    const stats = await CorrectiveAction.aggregate([
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } }
          ],
          overdue: [
            {
              $match: {
                dueDate: { $lt: new Date() },
                status: { $nin: ['completed', 'verified', 'closed'] }
              }
            },
            { $count: 'count' }
          ],
          total: [
            { $count: 'count' }
          ]
        }
      }
    ]);

    const result = stats[0];
    
    res.status(200).json({
      success: true,
      data: {
        total: result.total[0]?.count || 0,
        overdue: result.overdue[0]?.count || 0,
        byStatus: result.byStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byPriority: result.byPriority.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

module.exports = {
  createCorrectiveAction,
  getAllCorrectiveActions,
  getCorrectiveActionById,
  updateCorrectiveAction,
  deleteCorrectiveAction,
  getCorrectiveActionStats
};