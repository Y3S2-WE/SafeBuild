const fs = require('fs');
const path = require('path');
const multer = require('multer');

const completionReportDir = path.join(__dirname, '..', 'uploads', 'completion-reports');
fs.mkdirSync(completionReportDir, { recursive: true });

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, completionReportDir);
  },
  filename: (req, file, cb) => {
    const originalExt = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.pdf', '.doc', '.docx'].includes(originalExt) ? originalExt : '';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `completion-report-${uniqueSuffix}${safeExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
  }

  cb(null, true);
};

const completionReportUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

module.exports = {
  completionReportUpload
};