const CorrectiveAction = require('../models/CorrectiveAction');

const populateCorrectiveAction = async (correctiveAction) => {
  await correctiveAction.populate([
    { path: 'audit', select: 'site auditDate status findings' },
    { path: 'assignedTo', select: 'firstName lastName email' },
    { path: 'createdBy', select: 'firstName lastName' },
    { path: 'verifiedBy', select: 'firstName lastName' }
  ]);
};

/**
 * @desc    Get all corrective actions with filters
 * @route   GET /api/corrective-actions
 * @access  Private (Manager, Officer see all; Safety Compliance Manager sees only assigned)
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

    // Safety Compliance Managers can only see their own assigned corrective actions.
    if (req.user.role === 'safety-compliance-manager') {
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
      .populate('audit', 'site auditDate status findings')
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
        select: 'site auditDate status checklistTemplate responses score findings',
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

    // Safety Compliance Managers can only view their own assigned corrective actions.
    if (req.user.role === 'safety-compliance-manager' && 
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
 * @access  Private (Safety Compliance Manager executes own actions; Officer verifies/rejects completed actions; Manager view-only)
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
      completionReport,
      completionSummary,
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

    // Managers have read-only access for corrective actions in this workflow.
    if (req.user.role === 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Managers have view-only access for corrective actions'
      });
    }

    // Safety Compliance Managers can only update status for actions assigned to them.
    if (req.user.role === 'safety-compliance-manager') {
      if (correctiveAction.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update corrective actions assigned to you'
        });
      }
      
      // Safety Compliance Managers can only update status to 'in-progress' or 'completed'.
      if (status) {
        const allowedExecutionStatuses = ['in-progress', 'completed'];
        const allowedExecutionTransitions = {
          'open': ['in-progress'],
          'in-progress': ['completed']
        };

        if (!allowedExecutionStatuses.includes(status)) {
          return res.status(403).json({
            success: false,
            message: 'Safety compliance managers can only update status to in-progress or completed'
          });
        }

        if (!allowedExecutionTransitions[correctiveAction.status]?.includes(status)) {
          return res.status(400).json({
            success: false,
            message: `Cannot change status from '${correctiveAction.status}' to '${status}'`
          });
        }

        correctiveAction.status = status;

        if (status === 'in-progress') {
          correctiveAction.completedAt = null;
        }
        
        if (status === 'completed') {
          const submittedReport = typeof completionReport === 'string' ? completionReport.trim() : '';
          const submittedSummary =
            typeof completionSummary === 'string' && completionSummary.trim()
              ? completionSummary.trim()
              : typeof completionNotes === 'string'
                ? completionNotes.trim()
                : '';

          if (!submittedSummary) {
            return res.status(400).json({
              success: false,
              message: 'Summary note is required when submitting for verification'
            });
          }

          if (!correctiveAction.completionDocument?.url) {
            return res.status(400).json({
              success: false,
              message: 'Upload a PDF, DOC, or DOCX completion report before submitting for verification'
            });
          }

          correctiveAction.completedAt = new Date();
          correctiveAction.completionReport = submittedReport;
          correctiveAction.completionSummary = submittedSummary;
          correctiveAction.completionNotes = submittedSummary;
        }
      }

      // Safety Compliance Managers can update draft completion report/summary while in progress.
      if (typeof completionReport === 'string' && completionReport.trim() && status !== 'completed') {
        correctiveAction.completionReport = completionReport.trim();
      }

      if (typeof completionSummary === 'string' && completionSummary.trim() && status !== 'completed') {
        correctiveAction.completionSummary = completionSummary.trim();
        correctiveAction.completionNotes = completionSummary.trim();
      }

      // Backward-compatible summary note support.
      if (typeof completionNotes === 'string' && completionNotes.trim() && status !== 'completed') {
        correctiveAction.completionNotes = completionNotes.trim();
        if (!correctiveAction.completionSummary) {
          correctiveAction.completionSummary = completionNotes.trim();
        }
      }

    } else {
      // Officer can only review a safety-compliance-manager-completed action.
      if (title || description || assignedTo || priority || dueDate || completionNotes || completionReport || completionSummary) {
        return res.status(403).json({
          success: false,
          message: 'Officers can only review completed corrective actions'
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required for officer review'
        });
      }

      if (!['verified', 'in-progress'].includes(status)) {
        return res.status(403).json({
          success: false,
          message: 'Officers can only set status to verified or in-progress'
        });
      }

      if (correctiveAction.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: `Cannot review action while status is '${correctiveAction.status}'. Safety compliance manager must complete it first.`
        });
      }

      if (status === 'verified') {
        if (!correctiveAction.completionDocument?.url || !correctiveAction.completionSummary) {
          return res.status(400).json({
            success: false,
            message: 'Cannot verify without submitted completion document and summary note'
          });
        }

        correctiveAction.status = 'verified';
        correctiveAction.verifiedBy = req.user._id;
        correctiveAction.verifiedAt = new Date();
        correctiveAction.verificationNotes = verificationNotes || '';
      }

      if (status === 'in-progress') {
        if (!verificationNotes || !verificationNotes.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Rejection reason is required when sending action back to in-progress'
          });
        }

        correctiveAction.status = 'in-progress';
        correctiveAction.completedAt = null;
        correctiveAction.verifiedBy = null;
        correctiveAction.verifiedAt = null;
        correctiveAction.verificationNotes = verificationNotes.trim();
      }
    }

    await correctiveAction.save();

    await populateCorrectiveAction(correctiveAction);

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
 * @access  Private
 */
const deleteCorrectiveAction = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Deleting corrective actions is disabled in this workflow'
  });
};

/**
 * @desc    Get corrective actions statistics/dashboard
 * @route   GET /api/corrective-actions/stats
 * @access  Private (Manager)
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

/**
 * @desc    Upload completion report document (PDF/DOC/DOCX)
 * @route   POST /api/corrective-actions/:id/completion-document
 * @access  Private (Safety Compliance Manager)
 */
const uploadCompletionDocument = async (req, res) => {
  try {
    const correctiveAction = await CorrectiveAction.findById(req.params.id);

    if (!correctiveAction) {
      return res.status(404).json({
        success: false,
        message: 'Corrective action not found'
      });
    }

    if (correctiveAction.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only upload documents for corrective actions assigned to you'
      });
    }

    if (!['in-progress', 'completed'].includes(correctiveAction.status)) {
      return res.status(400).json({
        success: false,
        message: 'Completion document can only be uploaded when action is in-progress or completed'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF, DOC, or DOCX file'
      });
    }

    const documentUrl = `${req.protocol}://${req.get('host')}/uploads/completion-reports/${req.file.filename}`;

    correctiveAction.completionDocument = {
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: documentUrl,
      uploadedAt: new Date()
    };

    await correctiveAction.save();
    await populateCorrectiveAction(correctiveAction);

    return res.status(200).json({
      success: true,
      message: 'Completion document uploaded successfully',
      data: correctiveAction
    });
  } catch (error) {
    console.error('Upload completion document error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading completion document',
      error: error.message
    });
  }
};

module.exports = {
  getAllCorrectiveActions,
  getCorrectiveActionById,
  uploadCompletionDocument,
  updateCorrectiveAction,
  deleteCorrectiveAction,
  getCorrectiveActionStats
};