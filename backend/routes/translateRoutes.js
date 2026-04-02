const express = require('express');
const router = express.Router();
const { translate } = require('../controllers/translateController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// POST /api/translate — Translate text to Sinhala or Tamil
router.post('/', translate);

module.exports = router;
