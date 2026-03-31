const Incident = require('../models/Incident');
const User = require('../models/User');
const mongoose = require('mongoose');

// ==================== UTILITIES & HELPERS ====================

/**
 * Validate MongoDB ObjectId format
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid ObjectId format
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-f\d]{24}$/i.test(id);
};

/**
 * Format user's full name
 * @param {Object} user - User object with firstName and lastName
 * @returns {string} Full name
 */
const formatUserFullName = (user) => {
  return `${user.firstName} ${user.lastName}`;
};

// ==================== VALIDATION SERVICES ====================

/**
 * Validate required fields for incident creation
 * @param {Object} data - Request data to validate
 * @returns {Object} { isValid, error }
 */
const validateIncidentCreationData = (data) => {
  const { title, type, severity, location, description, dateOccurred } = data;
  
  if (!title || !type || !severity || !location || !description || !dateOccurred) {
    return {
      isValid: false,
      error: { status: 400, message: 'Please provide all required fields' }
    };
  }
  
  return { isValid: true };
};

/**
 * Validate incident status value
 * @param {string} status - Status to validate
 * @returns {Object} { isValid, error }
 */
const validateIncidentStatus = (status) => {
  const validStatuses = ['open', 'investigating', 'resolved', 'closed'];
  
  if (!status) {
    return {
      isValid: false,
      error: { status: 400, message: 'Please provide status' }
    };
  }
  
  if (!validStatuses.includes(status)) {
    return {
      isValid: false,
      error: { status: 400, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }
    };
  }
  
  return { isValid: true };
};

/**
 * Validate ObjectId and return standardized error
 * @param {string} id - ID to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} { isValid, error }
 */
const validateObjectIdFormat = (id, fieldName = 'ID') => {
  if (!isValidObjectId(id)) {
    return {
      isValid: false,
      error: { 
        status: 400, 
        message: `Invalid ${fieldName} format. Please provide a valid 24-character hexadecimal ID.` 
      }
    };
  }
  return { isValid: true };
};

/**
 * Validate comment input
 * @param {string} comment - Comment text
 * @returns {Object} { isValid, error }
 */
const validateComment = (comment) => {
  if (!comment || comment.trim() === '') {
    return {
      isValid: false,
      error: { status: 400, message: 'Please provide a comment' }
    };
  }
  return { isValid: true };
};

// ==================== PERMISSION SERVICES ====================

/**
 * Check if user can view specific incident
 * @param {Object} incident - Incident document
 * @param {Object} user - Authenticated user
 * @returns {Object} { authorized, error }
 */
const canViewIncident = (incident, user) => {
  if (user.role === 'worker' && incident.reportedBy._id.toString() !== user._id.toString()) {
    return {
      authorized: false,
      error: { status: 403, message: 'Not authorized to view this incident' }
    };
  }
  return { authorized: true };
};

/**
 * Check if user can update incident
 * @param {Object} incident - Incident document
 * @param {Object} user - Authenticated user
 * @returns {Object} { authorized, canUpdateAllFields, error }
 */
const canUpdateIncident = (incident, user) => {
  const isOwner = incident.reportedBy.toString() === user._id.toString();
  const isManagerOrOfficer = ['manager', 'officer'].includes(user.role);
  
  if (!isOwner && !isManagerOrOfficer) {
    return {
      authorized: false,
      error: { status: 403, message: 'Not authorized to update this incident' }
    };
  }
  
  // Workers can only edit if status is open
  if (user.role === 'worker' && incident.status !== 'open') {
    return {
      authorized: false,
      error: { status: 403, message: 'Cannot edit incident that is no longer open' }
    };
  }
  
  return { 
    authorized: true, 
    canUpdateAllFields: isManagerOrOfficer 
  };
};

/**
 * Check if user can delete incident
 * @param {Object} incident - Incident document
 * @param {Object} user - Authenticated user
 * @returns {Object} { authorized, error }
 */
const canDeleteIncident = (incident, user) => {
  const isOwner = incident.reportedBy.toString() === user._id.toString();
  const isManager = user.role === 'manager';
  
  if (!isOwner && !isManager) {
    return {
      authorized: false,
      error: { status: 403, message: 'Not authorized to delete this incident' }
    };
  }
  
  // Workers can only delete open incidents
  if (user.role === 'worker' && incident.status !== 'open') {
    return {
      authorized: false,
      error: { status: 403, message: 'Cannot delete incident that is no longer open' }
    };
  }
  
  return { authorized: true };
};

// ==================== DATA SERVICES ====================

/**
 * Find user by ID and validate existence
 * @param {string} userId - User ID to find
 * @returns {Promise<Object>} { user, error }
 */
const findUserById = async (userId) => {
  const validation = validateObjectIdFormat(userId, 'user ID');
  if (!validation.isValid) {
    return { user: null, error: validation.error };
  }
  
  const user = await User.findById(userId);
  if (!user) {
    return { 
      user: null, 
      error: { status: 404, message: 'User not found' } 
    };
  }
  
  return { user, error: null };
};

/**
 * Find incident by ID with population
 * @param {string} incidentId - Incident ID
 * @param {Array} populateFields - Fields to populate
 * @returns {Promise<Object>} { incident, error }
 */
const findIncidentById = async (incidentId, populateFields = []) => {
  const validation = validateObjectIdFormat(incidentId, 'incident ID');
  if (!validation.isValid) {
    return { incident: null, error: validation.error };
  }
  
  let query = Incident.findById(incidentId);
  
  populateFields.forEach(field => {
    query = query.populate(field.path, field.select);
  });
  
  const incident = await query;
  
  if (!incident) {
    return { 
      incident: null, 
      error: { status: 404, message: 'Incident not found' } 
    };
  }
  
  return { incident, error: null };
};

/**
 * Build query filter for incidents
 * @param {Object} queryParams - Query parameters
 * @param {Object} user - Authenticated user
 * @returns {Object} MongoDB query object
 */
const buildIncidentQuery = (queryParams, user) => {
  const { status, severity, type, search } = queryParams;
  const query = {};
  
  if (status) query.status = status;
  if (severity) query.severity = severity;
  if (type) query.type = type;
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'location.address': { $regex: search, $options: 'i' } }
    ];
  }
  
  // Workers can only see their own incidents
  if (user.role === 'worker') {
    query.reportedBy = user._id;
  }
  
  return query;
};

/**
 * Create new incident in database
 * @param {Object} incidentData - Incident data
 * @param {Array} populateFields - Fields to populate after creation
 * @returns {Promise<Object>} Created incident
 */
const createIncidentRecord = async (incidentData, populateFields = []) => {
  const incident = await Incident.create(incidentData);
  
  for (const field of populateFields) {
    await incident.populate(field.path, field.select);
  }
  
  return incident;
};

// ==================== BUSINESS LOGIC SERVICES ====================

/**
 * Prepare incident data for creation
 * @param {Object} requestBody - Request body
 * @param {Object} user - Authenticated user
 * @param {Object} assignedUserData - Optional assigned user data
 * @returns {Object} Prepared incident data
 */
const prepareIncidentData = (requestBody, user, assignedUserData = null) => {
  const {
    title,
    type,
    severity,
    location,
    description,
    evidencePhotos,
    dateOccurred,
    assignedTo
  } = requestBody;
  
  return {
    title,
    type,
    severity,
    location,
    description,
    evidencePhotos: evidencePhotos || [],
    dateOccurred,
    reportedBy: user._id,
    reportedByName: formatUserFullName(user),
    assignedTo: assignedTo || null,
    assignedToName: assignedUserData ? formatUserFullName(assignedUserData) : null
  };
};

/**
 * Update incident fields based on user permissions
 * @param {Object} incident - Incident to update
 * @param {Object} updateData - Data to update
 * @param {boolean} canUpdateAllFields - Whether user can update all fields
 * @returns {Object} Updated incident
 */
const applyIncidentUpdates = (incident, updateData, canUpdateAllFields) => {
  const {
    title,
    status,
    severity,
    location,
    description,
    resolutionNotes,
    evidencePhotos,
    dateOccurred
  } = updateData;
  
  // Fields all users can update
  if (title) incident.title = title;
  if (severity) incident.severity = severity;
  if (location?.address !== undefined) incident.location.address = location.address;
  if (description) incident.description = description;
  if (evidencePhotos) incident.evidencePhotos = evidencePhotos;
  if (dateOccurred) incident.dateOccurred = dateOccurred;
  
  // Fields only managers/officers can update
  if (canUpdateAllFields) {
    if (status) incident.status = status;
    if (resolutionNotes) incident.resolutionNotes = resolutionNotes;
    
    // Set dateResolved when status changes to resolved/closed
    if ((status === 'resolved' || status === 'closed') && !incident.dateResolved) {
      incident.dateResolved = new Date();
    }
  }
  
  return incident;
};

/**
 * Handle assignment of user to incident
 * @param {Object} incident - Incident to update
 * @param {string} assignedToId - User ID to assign
 * @returns {Promise<Object>} { success, error }
 */
const handleIncidentAssignment = async (incident, assignedToId) => {
  const { user, error } = await findUserById(assignedToId);
  
  if (error) {
    return { success: false, error };
  }
  
  incident.assignedTo = assignedToId;
  incident.assignedToName = formatUserFullName(user);
  
  return { success: true };
};

/**
 * Create comment object for incident
 * @param {Object} user - User creating comment
 * @param {string} commentText - Comment text
 * @returns {Object} Comment object
 */
const createCommentObject = (user, commentText) => {
  return {
    user: user._id,
    userName: formatUserFullName(user),
    userRole: user.role,
    comment: commentText.trim()
  };
};

// ==================== RESPONSE SERVICES ====================

/**
 * Send success response
 * @param {Object} res - Response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Response data
 */
const sendSuccessResponse = (res, statusCode, message, data = null) => {
  const response = { success: true, message };
  if (data) response.data = data;
  res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string} errorDetail - Optional error detail
 */
const sendErrorResponse = (res, statusCode, message, errorDetail = null) => {
  const response = { success: false, message };
  if (errorDetail) response.error = errorDetail;
  res.status(statusCode).json(response);
};

/**
 * Send paginated response
 * @param {Object} res - Response object
 * @param {Array} data - Data array
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 */
const sendPaginatedResponse = (res, data, total, page, limit) => {
  res.status(200).json({
    success: true,
    count: data.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data
  });
};

// ==================== CONTROLLER HANDLERS ====================

/**
 * @desc    Create new incident report
 * @route   POST /api/incidents
 * @access  Private (All authenticated users can report)
 */
const createIncident = async (req, res) => {
  try {
    // Validate input
    const validation = validateIncidentCreationData(req.body);
    if (!validation.isValid) {
      return sendErrorResponse(res, validation.error.status, validation.error.message);
    }
    
    // Handle optional assignment
    let assignedUserData = null;
    if (req.body.assignedTo) {
      const { user, error } = await findUserById(req.body.assignedTo);
      if (error) {
        return sendErrorResponse(res, error.status, error.message);
      }
      assignedUserData = user;
    }
    
    // Prepare and create incident
    const incidentData = prepareIncidentData(req.body, req.user, assignedUserData);
    const populateFields = [
      { path: 'reportedBy', select: 'firstName lastName email role' },
      { path: 'assignedTo', select: 'firstName lastName email role' }
    ];
    
    const incident = await createIncidentRecord(incidentData, populateFields);
    
    sendSuccessResponse(res, 201, 'Incident reported successfully', incident);
    
  } catch (error) {
    console.error('Create incident error:', error);
    sendErrorResponse(res, 500, 'Failed to create incident report', error.message);
  }
};

/**
 * @desc    Get all incidents with filtering
 * @route   GET /api/incidents
 * @access  Private (All authenticated users)
 */
const getAllIncidents = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Build query based on filters and user permissions
    const query = buildIncidentQuery(req.query, req.user);
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query
    const incidents = await Incident.find(query)
      .populate('reportedBy', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    // Get total count
    const total = await Incident.countDocuments(query);
    
    sendPaginatedResponse(res, incidents, total, pageNum, limitNum);
    
  } catch (error) {
    console.error('Get incidents error:', error);
    sendErrorResponse(res, 500, 'Failed to retrieve incidents', error.message);
  }
};

/**
 * @desc    Get single incident by ID
 * @route   GET /api/incidents/:id
 * @access  Private
 */
const getIncidentById = async (req, res) => {
  try {
    const populateFields = [
      { path: 'reportedBy', select: 'firstName lastName email role phone department' },
      { path: 'assignedTo', select: 'firstName lastName email role phone department' },
      { path: 'comments.user', select: 'firstName lastName role' }
    ];
    
    const { incident, error } = await findIncidentById(req.params.id, populateFields);
    
    if (error) {
      return sendErrorResponse(res, error.status, error.message);
    }
    
    // Check view permissions
    const permission = canViewIncident(incident, req.user);
    if (!permission.authorized) {
      return sendErrorResponse(res, permission.error.status, permission.error.message);
    }
    
    sendSuccessResponse(res, 200, null, incident);
    
  } catch (error) {
    console.error('Get incident by ID error:', error);
    sendErrorResponse(res, 500, 'Failed to retrieve incident', error.message);
  }
};

/**
 * @desc    Update incident details
 * @route   PUT /api/incidents/:id
 * @access  Private (Workers can edit their own, Manager/Officer can edit any)
 */
const updateIncident = async (req, res) => {
  try {
    const populateFields = [
      { path: 'reportedBy', select: 'firstName lastName email role' },
      { path: 'assignedTo', select: 'firstName lastName email role' }
    ];
    
    let { incident, error } = await findIncidentById(req.params.id, []);
    
    if (error) {
      return sendErrorResponse(res, error.status, error.message);
    }
    
    // Check update permissions
    const permission = canUpdateIncident(incident, req.user);
    if (!permission.authorized) {
      return sendErrorResponse(res, permission.error.status, permission.error.message);
    }
    
    // Apply field updates based on permissions
    incident = applyIncidentUpdates(incident, req.body, permission.canUpdateAllFields);
    
    // Handle user assignment (Manager/Officer only)
    if (permission.canUpdateAllFields && req.body.assignedTo) {
      const assignmentResult = await handleIncidentAssignment(incident, req.body.assignedTo);
      if (!assignmentResult.success) {
        return sendErrorResponse(res, assignmentResult.error.status, assignmentResult.error.message);
      }
    }
    
    await incident.save();
    
    // Populate references
    for (const field of populateFields) {
      await incident.populate(field.path, field.select);
    }
    
    sendSuccessResponse(res, 200, 'Incident updated successfully', incident);
    
  } catch (error) {
    console.error('Update incident error:', error);
    sendErrorResponse(res, 500, 'Failed to update incident', error.message);
  }
};

/**
 * @desc    Delete incident
 * @route   DELETE /api/incidents/:id
 * @access  Private (Workers can delete their own open incidents, Manager can delete any)
 */
const deleteIncident = async (req, res) => {
  try {
    const { incident, error } = await findIncidentById(req.params.id, []);
    
    if (error) {
      return sendErrorResponse(res, error.status, error.message);
    }
    
    // Check delete permissions
    const permission = canDeleteIncident(incident, req.user);
    if (!permission.authorized) {
      return sendErrorResponse(res, permission.error.status, permission.error.message);
    }
    
    await incident.deleteOne();
    
    sendSuccessResponse(res, 200, 'Incident deleted successfully');
    
  } catch (error) {
    console.error('Delete incident error:', error);
    sendErrorResponse(res, 500, 'Failed to delete incident', error.message);
  }
};

/**
 * @desc    Add investigation comment to incident
 * @route   POST /api/incidents/:id/comments
 * @access  Private (Manager/Officer only)
 */
const addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    
    // Validate comment
    const validation = validateComment(comment);
    if (!validation.isValid) {
      return sendErrorResponse(res, validation.error.status, validation.error.message);
    }
    
    const { incident, error } = await findIncidentById(req.params.id, []);
    
    if (error) {
      return sendErrorResponse(res, error.status, error.message);
    }
    
    // Add comment to incident
    const commentObject = createCommentObject(req.user, comment);
    incident.comments.push(commentObject);
    
    await incident.save();
    await incident.populate('comments.user', 'firstName lastName role');
    
    sendSuccessResponse(res, 201, 'Comment added successfully', incident);
    
  } catch (error) {
    console.error('Add comment error:', error);
    sendErrorResponse(res, 500, 'Failed to add comment', error.message);
  }
};

/**
 * @desc    Update incident status
 * @route   PATCH /api/incidents/:id/status
 * @access  Private (Manager/Officer only)
 */
const updateIncidentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validation = validateIncidentStatus(status);
    if (!validation.isValid) {
      return sendErrorResponse(res, validation.error.status, validation.error.message);
    }
    
    const populateFields = [
      { path: 'reportedBy', select: 'firstName lastName email role' },
      { path: 'assignedTo', select: 'firstName lastName email role' }
    ];
    
    const { incident, error } = await findIncidentById(req.params.id, []);
    
    if (error) {
      return sendErrorResponse(res, error.status, error.message);
    }
    
    // Update status
    incident.status = status;
    
    // Set dateResolved when status changes to resolved or closed
    if ((status === 'resolved' || status === 'closed') && !incident.dateResolved) {
      incident.dateResolved = new Date();
    }
    
    await incident.save();
    
    // Populate references
    for (const field of populateFields) {
      await incident.populate(field.path, field.select);
    }
    
    sendSuccessResponse(res, 200, 'Incident status updated successfully', incident);
    
  } catch (error) {
    console.error('Update status error:', error);
    sendErrorResponse(res, 500, 'Failed to update incident status', error.message);
  }
};

/**
 * @desc    Get incident statistics
 * @route   GET /api/incidents/stats/summary
 * @access  Private (Manager/Officer only)
 */
const getIncidentStats = async (req, res) => {
  try {
    // Count incidents by status
    const [
      totalIncidents,
      openIncidents,
      investigatingIncidents,
      resolvedIncidents,
      closedIncidents,
      bySeverity,
      byType
    ] = await Promise.all([
      Incident.countDocuments(),
      Incident.countDocuments({ status: 'open' }),
      Incident.countDocuments({ status: 'investigating' }),
      Incident.countDocuments({ status: 'resolved' }),
      Incident.countDocuments({ status: 'closed' }),
      Incident.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      Incident.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);
    
    // Transform aggregation results
    const severityStats = bySeverity.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    
    const typeStats = byType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    
    const statsData = {
      total: totalIncidents,
      byStatus: {
        open: openIncidents,
        investigating: investigatingIncidents,
        resolved: resolvedIncidents,
        closed: closedIncidents
      },
      bySeverity: severityStats,
      byType: typeStats
    };
    
    sendSuccessResponse(res, 200, null, statsData);
    
  } catch (error) {
    console.error('Get stats error:', error);
    sendErrorResponse(res, 500, 'Failed to retrieve incident statistics', error.message);
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
