const Incident = require('../models/Incident');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Validate MongoDB ObjectId format
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-f\d]{24}$/i.test(id);
};

/**
 * @desc    Create new incident report
 * @route   POST /api/incidents
 * @access  Private (All authenticated users can report)
 */
const createIncident = async (req, res) => {
  try {
    const {
      title,
      type,
      severity,
      location,
      description,
      evidencePhotos,
      dateOccurred,
      assignedTo
    } = req.body;

    // Validate required fields
    if (!title || !type || !severity || !location || !description || !dateOccurred) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if assigned user exists (if assignedTo is provided)
    let assignedToName = null;
    if (assignedTo) {
      if (!isValidObjectId(assignedTo)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assignedTo user ID format'
        });
      }
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          message: 'Assigned user not found'
        });
      }
      assignedToName = `${assignedUser.firstName} ${assignedUser.lastName}`;
    }

    // Create incident
    const incident = await Incident.create({
      title,
      type,
      severity,
      location,
      description,
      evidencePhotos: evidencePhotos || [],
      dateOccurred,
      reportedBy: req.user._id,
      reportedByName: `${req.user.firstName} ${req.user.lastName}`,
      assignedTo: assignedTo || null,
      assignedToName
    });

    // Populate the references
    await incident.populate('reportedBy', 'firstName lastName email role');
    if (assignedTo) {
      await incident.populate('assignedTo', 'firstName lastName email role');
    }

    res.status(201).json({
      success: true,
      message: 'Incident reported successfully',
      data: incident
    });

  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create incident report',
      error: error.message
    });
  }
};

/**
 * @desc    Get all incidents with filtering
 * @route   GET /api/incidents
 * @access  Private (All authenticated users)
 */
const getAllIncidents = async (req, res) => {
  try {
    const { status, severity, type, search, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by severity
    if (severity) {
      query.severity = severity;
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } }
      ];
    }

    // If user is a worker, show only their own incidents (unless they're viewing all)
    if (req.user.role === 'worker') {
      query.reportedBy = req.user._id;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const incidents = await Incident.find(query)
      .populate('reportedBy', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Incident.countDocuments(query);

    res.status(200).json({
      success: true,
      count: incidents.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: incidents
    });

  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve incidents',
      error: error.message
    });
  }
};

/**
 * @desc    Get single incident by ID
 * @route   GET /api/incidents/:id
 * @access  Private
 */
const getIncidentById = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid incident ID format. Please provide a valid 24-character hexadecimal ID.'
      });
    }

    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'firstName lastName email role phone department')
      .populate('assignedTo', 'firstName lastName email role phone department')
      .populate('comments.user', 'firstName lastName role');

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    // Workers can only view their own incidents
    if (req.user.role === 'worker' && incident.reportedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this incident'
      });
    }

    res.status(200).json({
      success: true,
      data: incident
    });

  } catch (error) {
    console.error('Get incident by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve incident',
      error: error.message
    });
  }
};

/**
 * @desc    Update incident details
 * @route   PUT /api/incidents/:id
 * @access  Private (Workers can edit their own, Manager/Officer can edit any)
 */
const updateIncident = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid incident ID format. Please provide a valid 24-character hexadecimal ID.'
      });
    }

    const { 
      status, 
      severity, 
      assignedTo, 
      location,
      description,
      resolutionNotes,
      title,
      evidencePhotos,
      dateOccurred
    } = req.body;

    let incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    // Check permissions: workers can only edit their own incidents
    const isOwner = incident.reportedBy.toString() === req.user._id.toString();
    const isManagerOrOfficer = ['manager', 'officer'].includes(req.user.role);

    if (!isOwner && !isManagerOrOfficer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this incident'
      });
    }

    // Workers can only edit certain fields and only if status is 'open'
    if (req.user.role === 'worker') {
      if (incident.status !== 'open') {
        return res.status(403).json({
          success: false,
          message: 'Cannot edit incident that is no longer open'
        });
      }
      // Workers can only update these fields
      if (title) incident.title = title;
      if (severity) incident.severity = severity;
      if (location) incident.location = { ...incident.location, ...location };
      if (description) incident.description = description;
      if (evidencePhotos) incident.evidencePhotos = evidencePhotos;
      if (dateOccurred) incident.dateOccurred = dateOccurred;
    } else {
      // Manager/Officer can update all fields
      if (title) incident.title = title;
      if (status) incident.status = status;
      if (severity) incident.severity = severity;
      if (location) incident.location = { ...incident.location, ...location };
      if (description) incident.description = description;
      if (resolutionNotes) incident.resolutionNotes = resolutionNotes;
      if (evidencePhotos) incident.evidencePhotos = evidencePhotos;
      if (dateOccurred) incident.dateOccurred = dateOccurred;

      // Handle assigned user update (Manager/Officer only)
      if (assignedTo) {
        if (!isValidObjectId(assignedTo)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid assignedTo user ID format'
          });
        }
        const assignedUser = await User.findById(assignedTo);
        if (!assignedUser) {
          return res.status(404).json({
            success: false,
            message: 'Assigned user not found'
          });
        }
        incident.assignedTo = assignedTo;
        incident.assignedToName = `${assignedUser.firstName} ${assignedUser.lastName}`;
      }

      // If status is resolved or closed, set dateResolved
      if ((status === 'resolved' || status === 'closed') && !incident.dateResolved) {
        incident.dateResolved = new Date();
      }
    }

    await incident.save();

    // Populate the references
    await incident.populate('reportedBy', 'firstName lastName email role');
    await incident.populate('assignedTo', 'firstName lastName email role');

    res.status(200).json({
      success: true,
      message: 'Incident updated successfully',
      data: incident
    });

  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update incident',
      error: error.message
    });
  }
};

/**
 * @desc    Delete incident
 * @route   DELETE /api/incidents/:id
 * @access  Private (Workers can delete their own open incidents, Manager can delete any)
 */
const deleteIncident = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid incident ID format. Please provide a valid 24-character hexadecimal ID.'
      });
    }

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    // Check permissions
    const isOwner = incident.reportedBy.toString() === req.user._id.toString();
    const isManager = req.user.role === 'manager';

    if (!isOwner && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this incident'
      });
    }

    // Workers can only delete their own incidents if status is 'open'
    if (req.user.role === 'worker') {
      if (incident.status !== 'open') {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete incident that is no longer open'
        });
      }
    }

    await incident.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Incident deleted successfully'
    });

  } catch (error) {
    console.error('Delete incident error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete incident',
      error: error.message
    });
  }
};

/**
 * @desc    Add investigation comment to incident
 * @route   POST /api/incidents/:id/comments
 * @access  Private (Manager/Officer only)
 */
const addComment = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid incident ID format. Please provide a valid 24-character hexadecimal ID.'
      });
    }

    const { comment } = req.body;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a comment'
      });
    }

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    // Add comment
    incident.comments.push({
      user: req.user._id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      userRole: req.user.role,
      comment: comment.trim()
    });

    await incident.save();

    // Populate the new comment's user
    await incident.populate('comments.user', 'firstName lastName role');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: incident
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

/**
 * @desc    Update incident status
 * @route   PATCH /api/incidents/:id/status
 * @access  Private (Manager/Officer only)
 */
const updateIncidentStatus = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid incident ID format. Please provide a valid 24-character hexadecimal ID.'
      });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status'
      });
    }

    const validStatuses = ['open', 'investigating', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    incident.status = status;

    // Set dateResolved when status changes to resolved or closed
    if ((status === 'resolved' || status === 'closed') && !incident.dateResolved) {
      incident.dateResolved = new Date();
    }

    await incident.save();

    await incident.populate('reportedBy', 'firstName lastName email role');
    await incident.populate('assignedTo', 'firstName lastName email role');

    res.status(200).json({
      success: true,
      message: 'Incident status updated successfully',
      data: incident
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update incident status',
      error: error.message
    });
  }
};

/**
 * @desc    Get incident statistics
 * @route   GET /api/incidents/stats/summary
 * @access  Private (Manager/Officer only)
 */
const getIncidentStats = async (req, res) => {
  try {
    const totalIncidents = await Incident.countDocuments();
    const openIncidents = await Incident.countDocuments({ status: 'open' });
    const investigatingIncidents = await Incident.countDocuments({ status: 'investigating' });
    const resolvedIncidents = await Incident.countDocuments({ status: 'resolved' });
    const closedIncidents = await Incident.countDocuments({ status: 'closed' });

    const bySeverity = await Incident.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    const byType = await Incident.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalIncidents,
        byStatus: {
          open: openIncidents,
          investigating: investigatingIncidents,
          resolved: resolvedIncidents,
          closed: closedIncidents
        },
        bySeverity: bySeverity.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve incident statistics',
      error: error.message
    });
  }
};

module.exports = {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident,
  addComment,
  updateIncidentStatus,
  getIncidentStats
};
