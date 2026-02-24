const express = require('express');
const router = express.Router();
const {
  getMyCertificates,
  getCertificateById,
  verifyCertificate,
  getAllCertificates,
  revokeCertificate,
  getCertificateStats
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');

// Public route - Certificate verification (no authentication required)
router.get('/verify/:code', verifyCertificate);

// Protected routes - All authenticated users
router.get('/my-certificates', protect, getMyCertificates);
router.get('/:id', protect, getCertificateById);

// Admin routes - Manager, Officer, Trainer only
router.get('/', protect, authorize('manager', 'officer', 'trainer'), getAllCertificates);
router.put('/:id/revoke', protect, authorize('manager', 'officer', 'trainer'), revokeCertificate);
router.get('/stats/overview', protect, authorize('manager', 'officer', 'trainer'), getCertificateStats);

module.exports = router;
