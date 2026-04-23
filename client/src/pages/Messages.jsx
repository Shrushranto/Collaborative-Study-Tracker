import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';
import Avatar from '../components/Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { loadPrivateKey, importPublicKey, deriveSharedKey, encryptMessage, decryptMessage } from '../utils/crypto.js';

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Messages() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [conversations, setConversations] = useState(null);
  const [following, setFollowing] = useState([]);
  const [thread, setThread] = useState(null);
  const [threadError, setThreadError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // E2E Keys
  const [sharedKey, setSharedKey] = useState(null);
  const [decryptedMessages, setDecryptedMessages] = useState({});

  // Load conversation list + following list
  async function loadConversations() {
    try {
      const res = await api.get('/messages');
      setConversations(res.data.conversations);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadConversations();
    const id = setInterval(loadConversations, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!me?._id) return;
    api.get(`/users/${me._id}/following`)
      .then(res => setFollowing(res.data.users || []))
      .catch(() => {});
  }, [me?._id]);

  // Load active thread
  useEffect(() => {
    if (!userId) { 
      setThread(null); 
      setSharedKey(null);
      setDecryptedMessages({});
      return; 
    }
    let cancelled = false;
    setThread(null);
    setThreadError('');
    setSharedKey(null);
    setDecryptedMessages({});

    async function load() {
      try {
        const res = await api.get(`/messages/${userId}`);
        if (cancelled) return;
        
        const newThread = res.data;
        setThread(newThread);
        
        // Init crypto if user has public key
        if (newThread.user?.publicKey) {
          try {
            const priv = await loadPrivateKey();
            if (priv) {
              const pub = await importPublicKey(newThread.user.publicKey);
              const key = await deriveSharedKey(priv, pub);
              setSharedKey(key);
              
              // Decrypt existing encrypted messages
              decryptThreadMessages(newThread.messages, key);
            }
          } catch (err) {
            console.error('Failed to initialize E2E keys', err);
          }
        }
      } catch (err) {
        if (!cancelled) setThreadError(err.response?.data?.message || 'Failed to load conversation');
      }
    }
    load();
    const id = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [userId]);
  
  // Also decrypt when thread is updated by polling
  useEffect(() => {
    if (thread && thread.messages && sharedKey) {
      decryptThreadMessages(thread.messages, sharedKey);
    }
  }, [thread, sharedKey]);

  async function decryptThreadMessages(messages, key) {
    const newDecrypted = { ...decryptedMessages };
    let changed = false;
    
    for (const m of messages) {
      if (m.encrypted && !newDecrypted[m._id]) {
        try {
          const pt = await decryptMessage(key, m.iv, m.text);
          newDecrypted[m._id] = pt;
          changed = true;
        } catch (e) {
          console.error('Decryption failed for msg', m._id, e);
          newDecrypted[m._id] = '[Decryption Failed]';
          changed = true;
        }
      }
    }
    if (changed) {
      setDecryptedMessages(newDecrypted);
    }
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thread?.messages?.length]);

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending || !userId) return;
    setSending(true);
    try {
      let payload = { text: trimmed };
      
      // E2E Encrypt if sharedKey is available
      if (sharedKey && thread?.user?.publicKey) {
        const { iv, ciphertext } = await encryptMessage(sharedKey, trimmed);
        payload = {
          text: ciphertext,
          iv: iv,
          encrypted: true
        };
      }
      
      const res = await api.post(`/messages/${userId}`, payload);
      setText('');
      
      const newMsg = res.data.message;
      setThread((prev) => prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev);
      
      if (newMsg.encrypted) {
        setDecryptedMessages(prev => ({ ...prev, [newMsg._id]: trimmed }));
      }
      
      loadConversations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container">
      <h2 style={{ marginBottom: 16 }}>Messages</h2>
      <div className={`messages-layout ${userId ? 'has-active' : ''}`}>
        <div className="conversations-pane">
          <div className="conversations-header">Messages</div>
          {!conversations && <p className="muted" style={{ padding: 16 }}>Loading…</p>}

          {conversations && (() => {
            const convIds = new Set(conversations.map(c => String(c.user._id)));
            const newChats = following.filter(f => !convIds.has(String(f._id)));

            if (conversations.length === 0 && newChats.length === 0) return (
              <div className="muted" style={{ padding: 16 }}>
                No conversations yet. Follow someone to start chatting.
                <div style={{ marginTop: 12 }}>
                  <Link to="/people"><button className="sm">Find people</button></Link>
                </div>
              </div>
            );

            return (
              <>
                {conversations.map((c) => (
                  <button
                    key={c.user._id}
                    className={`conversation-item ${String(userId) === String(c.user._id) ? 'active' : ''} ${c.unread > 0 ? 'unread' : ''}`}
                    onClick={() => navigate(`/messages/${c.user._id}`)}
                  >
                    <Avatar name={c.user.name} avatar={c.user.avatar} size="md" />
                    <div className="conv-info">
                      <div className="conv-name">{c.user.name}</div>
                      <div className="conv-preview">
                        {c.lastMessage.mine && 'You: '}
                        {c.lastMessage.encrypted ? '🔒 Encrypted Message' : c.lastMessage.text}
                      </div>
                    </div>
                    {c.unread > 0 && <span className="conv-unread-dot" aria-label={`${c.unread} unread`} />}
                  </button>
                ))}

                {newChats.length > 0 && (
                  <>
                    {conversations.length > 0 && <div className="conv-section-label">Following</div>}
                    {newChats.map((f) => (
                      <button
                        key={f._id}
                        className={`conversation-item ${String(userId) === String(f._id) ? 'active' : ''}`}
                        onClick={() => navigate(`/messages/${f._id}`)}
                      >
                        <Avatar name={f.name} avatar={f.avatar} size="md" />
                        <div className="conv-info">
                          <div className="conv-name">{f.name}</div>
                          <div className="conv-preview muted">Start a conversation</div>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </>
            );
          })()}
        </div>

        <div className="chat-pane">
          {!userId && (
            <div className="chat-empty">
              <div style={{ fontSize: '3rem', opacity: 0.4 }}>💬</div>
              <p>Select a conversation to start chatting.</p>
            </div>
          )}

          {userId && threadError && (
            <div className="chat-empty">
              <div className="error">{threadError}</div>
            </div>
          )}

          {userId && thread && (
            <>
              <div className="chat-header">
                <button className="back-link" onClick={() => navigate('/messages')} title="Back">←</button>
                <Avatar name={thread.user.name} avatar={thread.user.avatar} size="md" />
                <div>
                  <div className="chat-name">
                    <Link to={`/users/${thread.user._id}`}>{thread.user.name}</Link>
                    {sharedKey && <span className="e2e-badge" title="End-to-End Encrypted">🔒 E2E</span>}
                  </div>
                  {!thread.canMessage && (
                    <div className="muted text-xs">Not a mutual follow</div>
                  )}
                </div>
              </div>
              
              {sharedKey && (
                <div className="e2e-info">
                  Messages in this conversation are end-to-end encrypted.
                </div>
              )}

              <div className="chat-messages">
                {thread.messages.length === 0 && (
                  <div className="chat-empty">
                    <p className="muted">No messages yet. Say hi!</p>
                  </div>
                )}
                {thread.messages.map((m) => {
                  const displayMessage = m.encrypted 
                    ? (decryptedMessages[m._id] || '🔒 Decrypting...') 
                    : m.text;
                    
                  return (
                    <div key={m._id} className={`chat-bubble ${m.mine ? 'mine' : 'theirs'}`}>
                      {displayMessage}
                      <span className="chat-bubble-time">{formatTime(m.createdAt)}</span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {thread.canMessage ? (
                <form className="chat-input-row" onSubmit={handleSend}>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message…"
                    maxLength={2000}
                    autoFocus
                  />
                  <button type="submit" disabled={sending || !text.trim()}>
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </form>
              ) : (
                <div className="chat-locked">
                  You can only chat with people who follow you back.{' '}
                  <Link to={`/users/${thread.user._id}`}>View profile</Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
