import { useEffect, useState } from 'react';
import api from '../api/axios.js';

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function SessionLog({ refreshKey }) {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/sessions/me')
      .then((res) => setSessions(res.data.sessions))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load sessions'));
  }, [refreshKey]);

  return (
    <div className="card">
      <h3>📝 Recent Sessions</h3>
      {error && <div className="error">{error}</div>}
      {sessions.length === 0 ? (
        <p className="muted">No sessions logged yet. Start the timer to begin!</p>
      ) : (
        sessions.slice(0, 10).map((s) => (
          <div key={s._id} className="session-item">
            <div className="session-meta">
              <span>{s.subject || 'Untitled'}</span>
              <span>{formatDuration(s.durationSeconds)} · {new Date(s.startedAt).toLocaleDateString()}</span>
            </div>
            {s.notes && <p style={{ fontSize: '0.9rem' }}>{s.notes}</p>}
          </div>
        ))
      )}
    </div>
  );
}
