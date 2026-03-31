const express = require('express');
const router = express.Router();
const { getDashboardAnalytics, getAnalyticsChartsOnly } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('manager'));

router.get('/dashboard', getDashboardAnalytics);
router.get('/charts', getAnalyticsChartsOnly);

module.exports = router;