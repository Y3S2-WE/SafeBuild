import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Trash2,
  Minimize2,
  HardHat,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';

const WELCOME_MESSAGE = {
  role: 'bot',
  text: `🦺 **Hey there! I'm SafeBot** — your AI construction safety assistant.\n\nI can help you with:\n• PPE requirements & usage guidelines\n• Hazard identification & risk assessment\n• Incident reporting guidance\n• Safety regulations & OSHA compliance\n• Emergency procedures\n• Training course recommendations\n\nAsk me anything about workplace safety! 🏗️`,
  timestamp: new Date()
};

const QUICK_PROMPTS = [
  { label: '🦺 PPE Requirements', prompt: 'What PPE do I need for general construction work?' },
  { label: '⚠️ Report Hazard', prompt: 'How do I properly report a safety hazard on site?' },
  { label: '🏗️ Fall Protection', prompt: 'What are the fall protection requirements for working at heights?' },
  { label: '🔥 Fire Safety', prompt: 'What fire safety measures should be in place on a construction site?' }
];

/**
 * Parse simple markdown in bot messages 
 */
function parseMarkdown(text) {
  if (!text) return '';
  
  let html = text
    // Bold **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    // Bullet points
    .replace(/^[•●]\s*(.*)$/gm, '<li>$1</li>')
    .replace(/^[-]\s+(.*)$/gm, '<li>$1</li>')
    // Numbered lists
    .replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>')
    // Headers
    .replace(/^### (.*$)/gm, '<h4 class="safebot-h4">$1</h4>')
    .replace(/^## (.*$)/gm, '<h3 class="safebot-h3">$1</h3>')
    // Line breaks
    .replace(/\n/g, '<br/>');

  // Wrap consecutive <li> tags in <ul>
  html = html.replace(/((?:<li>.*?<\/li><br\/>?)+)/g, (match) => {
    const cleaned = match.replace(/<br\/?>/g, '');
    return `<ul class="safebot-list">${cleaned}</ul>`;
  });

  return html;
}

export const SafeBotChat = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pulseIcon, setPulseIcon] = useState(true);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  // Disable icon pulse after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setPulseIcon(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Detect scroll position for scroll-to-bottom button
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
    setShowScrollBtn(!isNearBottom);
  };

  const handleSend = async (messageText) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage = { role: 'user', text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.sendChatMessage({
        message: text,
        sessionId
      });

      if (response.success) {
        const botMessage = {
          role: 'bot',
          text: response.data.reply,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, botMessage]);

        if (!sessionId) {
          setSessionId(response.data.sessionId);
        }

        // If minimized or closed, show unread
        if (isMinimized || !isOpen) {
          setUnreadCount((c) => c + 1);
        }
      }
    } catch (error) {
      const errorMessage = {
        role: 'bot',
        text: '⚠️ Sorry, I encountered an error. Please try again in a moment.',
        timestamp: new Date(),
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = async () => {
    if (sessionId) {
      try {
        await api.clearChatSession(sessionId);
      } catch {
        // silently ignore
      }
    }
    setMessages([WELCOME_MESSAGE]);
    setSessionId(null);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setUnreadCount(0);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Hide the chatbot on the Quiz Workspace page to prevent cheating/distractions
  if (location.pathname.includes('/quiz-workspace')) {
    return null;
  }

  return (
    <>
      {/* ── Floating Action Button ── */}
      {!isOpen && (
        <button
          id="safebot-fab"
          onClick={toggleOpen}
          className="safebot-fab"
          aria-label="Open SafeBot Chat"
        >
          <div className={`safebot-fab-inner ${pulseIcon ? 'safebot-pulse' : ''}`}>
            <HardHat size={26} />
          </div>
          {unreadCount > 0 && (
            <span className="safebot-badge">{unreadCount}</span>
          )}
          <div className="safebot-fab-ring" />
        </button>
      )}

      {/* ── Chat Window ── */}
      {isOpen && (
        <div className={`safebot-window ${isMinimized ? 'safebot-minimized' : ''}`}>
          {/* Header */}
          <div className="safebot-header" onClick={isMinimized ? toggleMinimize : undefined}>
            <div className="safebot-header-left">
              <div className="safebot-avatar">
                <Bot size={20} />
                <span className="safebot-status-dot" />
              </div>
              <div>
                <h3 className="safebot-title">SafeBot</h3>
                <p className="safebot-subtitle">
                  {isLoading ? (
                    <span className="safebot-typing-indicator">
                      <span />
                      <span />
                      <span />
                      Thinking...
                    </span>
                  ) : (
                    'AI Safety Assistant'
                  )}
                </p>
              </div>
            </div>
            <div className="safebot-header-actions">
              <button onClick={handleClearChat} className="safebot-header-btn" title="Clear chat" aria-label="Clear chat">
                <Trash2 size={15} />
              </button>
              <button onClick={toggleMinimize} className="safebot-header-btn" title="Minimize" aria-label="Minimize">
                <Minimize2 size={15} />
              </button>
              <button onClick={toggleOpen} className="safebot-header-btn safebot-close-btn" title="Close" aria-label="Close chat">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          {!isMinimized && (
            <>
              <div
                className="safebot-messages"
                ref={messagesContainerRef}
                onScroll={handleScroll}
              >
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`safebot-msg ${msg.role === 'user' ? 'safebot-msg-user' : 'safebot-msg-bot'} ${msg.isError ? 'safebot-msg-error' : ''}`}
                  >
                    {msg.role === 'bot' && (
                      <div className="safebot-msg-avatar">
                        <Bot size={14} />
                      </div>
                    )}
                    <div className={`safebot-bubble ${msg.role === 'user' ? 'safebot-bubble-user' : 'safebot-bubble-bot'}`}>
                      {msg.role === 'bot' ? (
                        <div
                          className="safebot-markdown"
                          dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }}
                        />
                      ) : (
                        <p>{msg.text}</p>
                      )}
                      <span className="safebot-time">{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="safebot-msg safebot-msg-bot">
                    <div className="safebot-msg-avatar">
                      <Bot size={14} />
                    </div>
                    <div className="safebot-bubble safebot-bubble-bot safebot-bubble-loading">
                      <div className="safebot-dots">
                        <span /><span /><span />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to bottom button */}
              {showScrollBtn && (
                <button className="safebot-scroll-btn" onClick={() => scrollToBottom()}>
                  <ChevronDown size={16} />
                </button>
              )}

              {/* Quick Prompts (show only when there's just the welcome message) */}
              {messages.length === 1 && (
                <div className="safebot-quick-prompts">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.label}
                      className="safebot-quick-btn"
                      onClick={() => handleSend(qp.prompt)}
                      disabled={isLoading}
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="safebot-input-area">
                <div className="safebot-input-wrapper">
                  <textarea
                    ref={inputRef}
                    id="safebot-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a safety question..."
                    rows={1}
                    className="safebot-textarea"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="safebot-send-btn"
                    aria-label="Send message"
                  >
                    {isLoading ? <Sparkles size={18} className="safebot-spin" /> : <Send size={18} />}
                  </button>
                </div>
                <p className="safebot-disclaimer">
                  SafeBot may provide general guidance. Always follow your site-specific safety protocols.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
