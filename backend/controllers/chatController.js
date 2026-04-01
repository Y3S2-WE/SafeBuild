const { GoogleGenAI } = require('@google/genai');

// ── Gemini Client ────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ── Safety Persona & System Instruction ──────────────────────────────────────
const SAFETY_SYSTEM_INSTRUCTION = `You are **SafeBot**, SafeBuild's AI Safety Assistant — an expert in construction site safety, occupational health, hazard prevention, and compliance.

## Your Role
- You help construction workers, safety officers, managers, and trainers with safety-related questions.
- You provide clear, concise, and actionable safety guidance.
- You always prioritize worker safety above everything else.

## Knowledge Domains
- Personal Protective Equipment (PPE) requirements and usage
- Fall protection and working at heights
- Scaffolding safety and inspection
- Electrical safety on construction sites
- Hazardous materials handling (asbestos, lead, silica, chemicals)
- Excavation and trenching safety
- Fire prevention and emergency response
- Heat stress and cold stress prevention
- Crane, hoist, and heavy equipment safety
- Confined space entry procedures
- Lockout/Tagout (LOTO) procedures
- First aid and emergency procedures
- OSHA regulations and compliance standards
- Safety training best practices
- Incident reporting and investigation
- Risk assessment and hazard identification
- Tool and machinery safety
- Construction site housekeeping

## Response Guidelines
1. Always answer safety questions with clear, practical advice
2. When relevant, cite OSHA standards or industry best practices
3. If someone describes a dangerous situation, prioritize their immediate safety — tell them to stop work if there's imminent danger
4. Use bullet points and numbered lists for procedures
5. Be empathetic and supportive — workers asking safety questions are doing the right thing
6. Keep answers concise but thorough — aim for 2-4 paragraphs max
7. If you're unsure about a specific regulation, say so and recommend they consult their safety officer
8. Use simple language — avoid jargon when possible
9. For the SafeBuild platform, you can guide users on: reporting incidents, taking training courses, certification quizzes, and compliance audits

## Personality
- Friendly, professional, and encouraging
- Always start responses with relevant, helpful content (no generic greetings unless the user greets first)
- Use safety-themed emoji occasionally (🦺 🔧 ⚠️ 🏗️ ✅ 🛑) to make messages approachable
- Sign off important safety reminders with encouragement like "Stay safe out there!" or "Safety first, always!"`;

// ── Guardrails ───────────────────────────────────────────────────────────────
const BLOCKED_TOPICS = [
  'politics', 'religion', 'dating', 'relationship',
  'gambling', 'cryptocurrency', 'stock market', 'investment advice',
  'write code', 'programming', 'javascript', 'python',
  'hack', 'exploit', 'bypass security',
  'weapons', 'explosives', 'drugs',
  'adult content', 'sexual', 'pornography'
];

const GUARDRAIL_PATTERNS = [
  /how\s+to\s+make\s+(a\s+)?bomb/i,
  /how\s+to\s+hack/i,
  /bypass\s+safety\s+(protocol|system|measure)/i,
  /ignore\s+(your|all|previous)\s+(instructions|rules|system\s+prompt)/i,
  /pretend\s+you\s+are\s+(not|no\s+longer)/i,
  /act\s+as\s+if\s+you/i,
  /you\s+are\s+now\s+/i,
  /forget\s+(your|all|previous)\s+(instructions|rules)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
];

const REDIRECTION_MESSAGE = `🦺 I'm SafeBot, your construction safety assistant! I'm specifically designed to help with workplace safety, hazard prevention, PPE guidance, incident reporting, and safety compliance questions.

I can't help with that particular topic, but I'd love to help you with any safety-related questions! For example:
• "What PPE do I need for welding?"
• "How do I report a near-miss incident?"
• "What are the fall protection requirements for working above 6 feet?"

How can I help you stay safe today?`;

/**
 * Checks if the user message violates guardrails
 */
function checkGuardrails(message) {
  const lowerMessage = message.toLowerCase();

  // Check blocked topic keywords
  for (const topic of BLOCKED_TOPICS) {
    if (lowerMessage.includes(topic)) {
      return { blocked: true, reason: `off-topic: ${topic}` };
    }
  }

  // Check regex guardrail patterns
  for (const pattern of GUARDRAIL_PATTERNS) {
    if (pattern.test(message)) {
      return { blocked: true, reason: 'prompt injection attempt' };
    }
  }

  return { blocked: false };
}

// ── Stateful Session Management ──────────────────────────────────────────────
// In-memory session store (keyed by sessionId)
// Each session stores the conversation history for Gemini's multi-turn chat
const sessions = new Map();

const SESSION_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_HISTORY_TURNS = 20; // Max pairs of user/model turns to keep

/**
 * Clean up expired sessions periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastActive > SESSION_TTL) {
      sessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

/**
 * Get or create a session
 */
function getSession(sessionId) {
  if (sessions.has(sessionId)) {
    const session = sessions.get(sessionId);
    session.lastActive = Date.now();
    return session;
  }

  const session = {
    history: [],
    lastActive: Date.now(),
    messageCount: 0
  };
  sessions.set(sessionId, session);
  return session;
}

// ── Chat Controller ──────────────────────────────────────────────────────────

/**
 * POST /api/chat
 * Body: { message: string, sessionId: string }
 * Response: { success: true, data: { reply: string, sessionId: string } }
 */
const sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a non-empty string.'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message is too long. Please keep it under 2000 characters.'
      });
    }

    // Generate a sessionId if none provided
    const activeSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // ── Guardrail Check ──
    const guardrailResult = checkGuardrails(message);
    if (guardrailResult.blocked) {
      return res.status(200).json({
        success: true,
        data: {
          reply: REDIRECTION_MESSAGE,
          sessionId: activeSessionId
        }
      });
    }

    // ── Get/Create Session ──
    const session = getSession(activeSessionId);

    // ── Build chat history for Gemini ──
    const contents = [];

    // Add existing history
    for (const turn of session.history) {
      contents.push(turn);
    }

    // Add new user message
    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }]
    });

    // ── Call Gemini API ──
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: contents,
      config: {
        systemInstruction: SAFETY_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });

    const reply = response.text || 'I apologize, but I was unable to generate a response. Please try again.';

    // ── Update session history ──
    session.history.push({
      role: 'user',
      parts: [{ text: message.trim() }]
    });
    session.history.push({
      role: 'model',
      parts: [{ text: reply }]
    });

    // Trim history if it exceeds max turns
    if (session.history.length > MAX_HISTORY_TURNS * 2) {
      session.history = session.history.slice(-MAX_HISTORY_TURNS * 2);
    }

    session.messageCount++;

    return res.status(200).json({
      success: true,
      data: {
        reply,
        sessionId: activeSessionId
      }
    });
  } catch (error) {
    console.error('Chat error:', error);

    // Handle Gemini rate limit / quota errors
    if (error.status === 429 || error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('quota')) {
      return res.status(200).json({
        success: true,
        data: {
          reply: '⏳ I\'m getting a lot of questions right now! Please wait a moment and try again. Our AI service has temporary rate limits.\n\nIn the meantime, you can check out SafeBuild\'s training courses or contact your safety officer for urgent questions. 🦺',
          sessionId: req.body.sessionId || null
        }
      });
    }

    // Handle Gemini API key errors
    if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID')) {
      return res.status(500).json({
        success: false,
        message: 'AI service configuration error. Please contact support.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your message. Please try again.'
    });
  }
};

/**
 * DELETE /api/chat/:sessionId
 * Clears a chat session
 */
const clearSession = (req, res) => {
  const { sessionId } = req.params;

  if (sessions.has(sessionId)) {
    sessions.delete(sessionId);
  }

  return res.status(200).json({
    success: true,
    message: 'Chat session cleared successfully.'
  });
};

module.exports = {
  sendMessage,
  clearSession
};
