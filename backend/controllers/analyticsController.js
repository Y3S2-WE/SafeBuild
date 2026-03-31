const Audit = require('../models/Audit');
const CorrectiveAction = require('../models/CorrectiveAction');
const {
  correctiveStatusChart,
  correctivePriorityChart,
  auditsTimelineChart
} = require('../services/quickChartService');

/**
 * @desc    Dashboard analytics summary + chart URLs
 * @route   GET /api/analytics/dashboard
 * @access  Private (Manager only)
 * @details Aggregates corrective action status/priority and audit timeline data.
 *          Generates QuickChart URLs for real-time visualization on manager dashboard.
 *          Future optimization: Consider caching this endpoint with 5-minute TTL for high-traffic scenarios.
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    const [statusAgg, priorityAgg, overdueAgg, auditsTimelineAgg] = await Promise.all([
      CorrectiveAction.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      CorrectiveAction.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      CorrectiveAction.countDocuments({
        dueDate: { $lt: new Date() },
        status: { $nin: ['completed', 'verified', 'closed'] }
      }),
      Audit.aggregate([
        { $match: { status: 'completed', auditDate: { $exists: true } } },
        {
          $group: {
            _id: { year: { $year: '$auditDate' }, month: { $month: '$auditDate' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    const statusMap = statusAgg.reduce((acc, cur) => ({ ...acc, [cur._id]: cur.count }), {});
    const priorityMap = priorityAgg.reduce((acc, cur) => ({ ...acc, [cur._id]: cur.count }), {});

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const timelineRows = auditsTimelineAgg.slice(-6).map((r) => ({
      label: `${monthNames[r._id.month - 1]} ${r._id.year}`,
      count: r.count
    }));

    const charts = {
      correctiveStatus: correctiveStatusChart(statusMap),
      correctivePriority: correctivePriorityChart(priorityMap),
      auditsTimeline: auditsTimelineChart(timelineRows)
    };

    const chartMeta = {
      correctiveStatusTotal: Object.values(statusMap).reduce((sum, value) => sum + Number(value || 0), 0),
      correctivePriorityTotal: Object.values(priorityMap).reduce((sum, value) => sum + Number(value || 0), 0),
      auditsTimelineTotal: timelineRows.reduce((sum, row) => sum + Number(row.count || 0), 0)
    };

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          correctiveByStatus: statusMap,
          correctiveByPriority: priorityMap,
          overdueCorrectiveActions: overdueAgg
        },
        charts,
        chartMeta
      }
    });
  } catch (error) {
    // Log analytics errors for debugging QuickChart integration issues
    console.error('Analytics dashboard error:', {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to load analytics dashboard',
      error: error.message,
      suggestion: 'Verify QuickChart API is accessible and database connection is healthy.'
    });
  }
};

/**
 * @desc    Only chart URLs (quick use for frontend)
 * @route   GET /api/analytics/charts
 * @access  Private (Manager)
 */
const getAnalyticsChartsOnly = async (req, res) => {
  try {
    const [statusAgg, priorityAgg, timelineAgg] = await Promise.all([
      CorrectiveAction.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      CorrectiveAction.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Audit.aggregate([
        { $match: { status: 'completed', auditDate: { $exists: true } } },
        {
          $group: {
            _id: { year: { $year: '$auditDate' }, month: { $month: '$auditDate' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    const statusMap = statusAgg.reduce((acc, cur) => ({ ...acc, [cur._id]: cur.count }), {});
    const priorityMap = priorityAgg.reduce((acc, cur) => ({ ...acc, [cur._id]: cur.count }), {});
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const timelineRows = timelineAgg.slice(-6).map((r) => ({
      label: `${monthNames[r._id.month - 1]} ${r._id.year}`,
      count: r.count
    }));

    const chartMeta = {
      correctiveStatusTotal: Object.values(statusMap).reduce((sum, value) => sum + Number(value || 0), 0),
      correctivePriorityTotal: Object.values(priorityMap).reduce((sum, value) => sum + Number(value || 0), 0),
      auditsTimelineTotal: timelineRows.reduce((sum, row) => sum + Number(row.count || 0), 0)
    };

    return res.status(200).json({
      success: true,
      data: {
        correctiveStatus: correctiveStatusChart(statusMap),
        correctivePriority: correctivePriorityChart(priorityMap),
        auditsTimeline: auditsTimelineChart(timelineRows),
        chartMeta
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate chart URLs',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardAnalytics,
  getAnalyticsChartsOnly
};