import { useState, useRef, useEffect } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import ReactMarkdown from 'react-markdown';

export default function AIChatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I\'m your AI Study Assistant. Ask me to explain concepts, summarize notes, quiz you, or help you study.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  if (!user) return null;

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', text: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Pass conversation history (exclude the initial greeting)
      const history = newMessages.slice(1, -1); // all except first greeting and the new user msg
      const res = await api.post('/ai/chat', { message: trimmed, history });
      setMessages((prev) => [...prev, { role: 'bot', text: res.data.reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setMessages((prev) => [...prev, { role: 'bot', text: `⚠️ ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setMessages([
      { role: 'bot', text: 'Chat cleared! What would you like to study?' }
    ]);
  }

  return (
    <>
      <button
        className="ai-chat-fab"
        onClick={() => setOpen(!open)}
        title="AI Study Assistant"
      >
        ✨
      </button>

      {open && (
        <div className="ai-chat-panel">
          <div className="ai-chat-header">
            <div className="hstack" style={{ gap: 8 }}>
              <span style={{ fontSize: '1.1rem' }}>✨</span>
              <span style={{ fontWeight: 600 }}>Study Assistant</span>
            </div>
            <div className="hstack" style={{ gap: 6 }}>
              <button
                className="ghost"
                onClick={handleClear}
                title="Clear chat"
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                Clear
              </button>
              <button
                className="ghost"
                onClick={() => setOpen(false)}
                style={{ fontSize: '1.1rem', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="ai-chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-bubble ${msg.role}`}>
                {msg.role === 'bot' ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            ))}
            {loading && (
              <div className="ai-typing">
                <span /><span /><span />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="ai-chat-input">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <button type="submit" disabled={loading || !input.trim()} title="Send">
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
