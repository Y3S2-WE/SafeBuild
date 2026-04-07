const express = require('express');
const router = express.Router();
const { sendMessage, clearSession } = require('../controllers/chatController');

// POST /api/chat - Send a message to SafeBot
router.post('/', sendMessage);

// DELETE /api/chat/:sessionId - Clear a chat session
router.delete('/:sessionId', clearSession);

module.exports = router;
