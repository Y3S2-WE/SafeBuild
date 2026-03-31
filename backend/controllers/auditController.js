const Audit = require('../models/Audit');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const CorrectiveAction = require('../models/CorrectiveAction');
const User = require('../models/User');
const {
  buildCorrectiveAssignmentMap,
  validateCorrectiveAssignments,
  createCorrectiveActionsForFailedResponses,
  allowedPriorities
} = require('../services/correctiveActionService');

/**
 * @desc    Create/Schedule new audit
 * @route   POST /api/audits
 * @access  Private (Manager)
 */
const createAudit = async (req, res) => {
  try {
    const { site, auditDate, checklistTemplate, assignedAuditor } = req.body;

    // Verify checklist template exists and is active
    const template = await ChecklistTemplate.findById(checklistTemplate);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Checklist template not found'
      });
    }

    if (!template.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot use inactive checklist template'
      });
    }

    const auditorUser = await User.findById(assignedAuditor).select('role isActive');
    if (!auditorUser) {
      return res.status(404).json({
        success: false,
        message: 'Assigned auditor not found'
      });
    }

    if (auditorUser.role !== 'officer' || !auditorUser.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Assigned auditor must be an active officer'
      });
    }

    const audit = await Audit.create({
      site,
      auditDate,
      checklistTemplate,
      assignedAuditor,
      createdBy: req.user._id
    });

    await audit.populate([
      { path: 'checklistTemplate', select: 'title category items' },
      { path: 'assignedAuditor', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Audit scheduled successfully',
      data: audit
    });
  } catch (error) {
    console.error('Create audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling audit',
      error: error.message
    });
  }
};

/**
 * @desc    Get all audits with filters
 * @route   GET /api/audits
 * @access  Private
 */
const getAllAudits = async (req, res) => {
  try {
    const { status, site, assignedAuditor, checklistTemplate, startDate, endDate } = req.query;
    
    const filter = {};
    
    if (status) filter.status = status;
    if (site) filter.site = { $regex: site, $options: 'i' };
    if (assignedAuditor) filter.assignedAuditor = assignedAuditor;
    if (checklistTemplate) filter.checklistTemplate = checklistTemplate;
    
    if (startDate || endDate) {
      filter.auditDate = {};
      if (startDate) filter.auditDate.$gte = new Date(startDate);
      if (endDate) filter.auditDate.$lte = new Date(endDate);
    }

    const audits = await Audit.find(filter)
      .populate('checklistTemplate', 'title category')
      .populate('assignedAuditor', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ auditDate: -1 });

    res.status(200).json({
      success: true,
      count: audits.length,
      data: audits
    });
  } catch (error) {
    console.error('Get audits error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audits',
      error: error.message
    });
  }
};

/**
 * @desc    Get audit by ID
 * @route   GET /api/audits/:id
 * @access  Private
 */
const getAuditById = async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id)
      .populate('checklistTemplate')
      .populate('assignedAuditor', 'firstName lastName email role')
      .populate('createdBy', 'firstName lastName email');

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found'
      });
    }

    // Get related corrective actions count
    const correctiveActionsCount = await CorrectiveAction.countDocuments({ 
      audit: req.params.id 
    });

    res.status(200).json({
      success: true,
      data: {
        ...audit.toObject(),
        correctiveActionsCount
      }
    });
  } catch (error) {
    console.error('Get audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit',
      error: error.message
    });
  }
};

/**
 * @desc    Update audit (reschedule, reassign, update status, submit responses)
 * @route   PUT /api/audits/:id
 * @access  Private (Manager, Officer)
 */
const updateAudit = async (req, res) => {
  try {
    const { 
      site, 
      auditDate, 
      checklistTemplate, 
      assignedAuditor, 
      status, 
      responses, 
      findings,
      cancelReason,
      correctiveAssignments
    } = req.body;

    const audit = await Audit.findById(req.params.id);

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found'
      });
    }

    // Prevent modifying completed or cancelled audits (except findings)
    if (['completed', 'cancelled'].includes(audit.status)) {
      // Only allow adding findings to completed audits
      if (audit.status === 'completed' && findings && Object.keys(req.body).length === 1) {
        audit.findings = findings;
        await audit.save();
        
        await audit.populate([
          { path: 'checklistTemplate', select: 'title category' },
          { path: 'assignedAuditor', select: 'firstName lastName email' },
          { path: 'createdBy', select: 'firstName lastName' }
        ]);

        return res.status(200).json({
          success: true,
          message: 'Audit findings updated successfully',
          data: audit
        });
      }

      return res.status(400).json({
        success: false,
        message: `Cannot modify a ${audit.status} audit`
      });
    }

    // Manager handles planning/cancellation and must not submit conduct responses.
    if (req.user.role === 'manager') {
      const hasConductPayload = Array.isArray(responses) || correctiveAssignments !== undefined;
      if (hasConductPayload) {
        return res.status(403).json({
          success: false,
          message: 'Managers cannot conduct audits. Officers must submit audit responses.'
        });
      }

      if (status && ['in-progress', 'completed'].includes(status)) {
        return res.status(403).json({
          success: false,
          message: 'Managers can schedule or cancel audits, but cannot run conduct status transitions.'
        });
      }
    }

    // Officer can conduct audits, but cannot reschedule/reassign/cancel audits.
    if (req.user.role === 'officer') {
      const hasSchedulingChanges =
        site !== undefined ||
        auditDate !== undefined ||
        checklistTemplate !== undefined ||
        assignedAuditor !== undefined ||
        cancelReason !== undefined;

      if (hasSchedulingChanges) {
        return res.status(403).json({
          success: false,
          message: 'Officers can conduct audits but cannot reschedule, reassign, or cancel audits.'
        });
      }

      if (status && !['in-progress', 'completed'].includes(status)) {
        return res.status(403).json({
          success: false,
          message: 'Officers can only move audit status through conduct flow.'
        });
      }
    }

    // Update basic fields
    if (site) audit.site = site;
    if (auditDate) audit.auditDate = auditDate;
    if (assignedAuditor) {
      const auditorUser = await User.findById(assignedAuditor).select('role isActive');
      if (!auditorUser) {
        return res.status(404).json({
          success: false,
          message: 'Assigned auditor not found'
        });
      }

      if (auditorUser.role !== 'officer' || !auditorUser.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Assigned auditor must be an active officer'
        });
      }

      audit.assignedAuditor = assignedAuditor;
    }
    if (typeof findings === 'string' && findings.trim()) {
      audit.findings = findings.trim();
    }
    
    // Update checklist template (only if audit hasn't started)
    if (checklistTemplate && audit.status === 'scheduled') {
      const template = await ChecklistTemplate.findById(checklistTemplate);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Checklist template not found'
        });
      }
      if (!template.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Cannot use inactive checklist template'
        });
      }
      audit.checklistTemplate = checklistTemplate;
    }

    // Handle status change
    if (status) {
      // Validate status transition
      const validTransitions = {
        'scheduled': ['in-progress', 'cancelled'],
        'in-progress': ['completed', 'cancelled']
      };

      if (!validTransitions[audit.status]?.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change status from '${audit.status}' to '${status}'`
        });
      }

      if (status === 'cancelled') {
        if (req.user.role !== 'manager') {
          return res.status(403).json({
            success: false,
            message: 'Only managers can cancel audits.'
          });
        }

        if (!cancelReason || !String(cancelReason).trim()) {
          return res.status(400).json({
            success: false,
            message: 'Cancellation reason is required when cancelling an audit.'
          });
        }
        audit.cancelReason = String(cancelReason).trim();
      }

      audit.status = status;

      if (status === 'completed') {
        audit.completedAt = new Date();
      }
    }

    let autoCorrectiveActionsCreated = 0;

    // Handle responses submission (when completing audit)
    if (responses && Array.isArray(responses)) {
      const findingsSummary = typeof findings === 'string' ? findings.trim() : '';
      if (!findingsSummary) {
        return res.status(400).json({
          success: false,
          message: 'Findings summary is required when submitting audit responses.'
        });
      }

      audit.findings = findingsSummary;

      // Get checklist template for validation
      const template = await ChecklistTemplate.findById(audit.checklistTemplate);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Associated checklist template not found'
        });
      }

      // Process responses
      const processedResponses = [];
      let passedCount = 0;
      let failedCount = 0;

      for (const response of responses) {
        const checklistItem = template.items.id(response.questionId);
        
        if (!checklistItem) {
          return res.status(400).json({
            success: false,
            message: `Invalid question ID: ${response.questionId}`
          });
        }

        const passed = response.actualAnswer === checklistItem.expectedAnswer;
        
        if (passed) {
          passedCount++;
        } else {
          failedCount++;
        }

        processedResponses.push({
          questionId: response.questionId,
          question: checklistItem.question,
          expectedAnswer: checklistItem.expectedAnswer,
          actualAnswer: response.actualAnswer,
          passed,
          comments: response.comments || ''
        });
      }

      audit.responses = processedResponses;
      
      // Calculate score
      const total = processedResponses.length;
      audit.score = {
        total,
        passed: passedCount,
        failed: failedCount,
        percentage: total > 0 ? Math.round((passedCount / total) * 100) : 0
      };

      const failedResponses = processedResponses.filter((response) => !response.passed);
      const correctiveAssignmentMap = buildCorrectiveAssignmentMap(correctiveAssignments);

      if (failedResponses.length > 0) {
        // Validate all corrective action assignments using service
        const validation = await validateCorrectiveAssignments(failedResponses, correctiveAssignmentMap);
        if (!validation.isValid) {
          return res.status(validation.error.status).json({
            success: false,
            message: validation.error.message
          });
        }
      }

      autoCorrectiveActionsCreated = await createCorrectiveActionsForFailedResponses({
        audit,
        failedResponses,
        createdBy: req.user._id,
        templateCategory: template.category,
        correctiveAssignmentMap
      });

      // Auto-complete if all responses submitted
      if (processedResponses.length === template.items.length && audit.status === 'in-progress') {
        audit.status = 'completed';
        audit.completedAt = new Date();
      }
    }

    await audit.save();

    await audit.populate([
      { path: 'checklistTemplate', select: 'title category items' },
      { path: 'assignedAuditor', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Audit updated successfully',
      data: {
        ...audit.toObject(),
        autoCorrectiveActionsCreated
      }
    });
  } catch (error) {
    console.error('Update audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating audit',
      error: error.message
    });
  }
};

/**
 * @desc    Delete audit
 * @route   DELETE /api/audits/:id
 * @access  Private (Manager)
 */
const deleteAudit = async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id);

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found'
      });
    }

    // Prevent deleting completed audits
    if (audit.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a completed audit'
      });
    }

    // Check for related corrective actions
    const correctiveActionsCount = await CorrectiveAction.countDocuments({ 
      audit: req.params.id 
    });

    if (correctiveActionsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete. This audit has ${correctiveActionsCount} corrective action(s) linked to it.`
      });
    }

    await Audit.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Audit deleted successfully'
    });
  } catch (error) {
    console.error('Delete audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting audit',
      error: error.message
    });
  }
};

module.exports = {
  createAudit,
  getAllAudits,
  getAuditById,
  updateAudit,
  deleteAudit
};