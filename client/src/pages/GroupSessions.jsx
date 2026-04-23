import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import Avatar from '../components/Avatar.jsx';

function formatGoal(minutes) {
  if (!minutes) return '0m';
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  if (minutes > 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export default function GroupSessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goalValue, setGoalValue] = useState(60);
  const [goalUnit, setGoalUnit] = useState('minutes');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  async function load() {
    try {
      const res = await api.get('/group-sessions');
      setSessions(res.data.sessions);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load group sessions');
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError('');
    if (!name.trim()) { setCreateError('Name is required'); return; }
    const raw = Number(goalValue);
    if (!raw || raw <= 0) { setCreateError('Goal must be greater than 0'); return; }
    const goalMinutes = Math.round(goalUnit === 'hours' ? raw * 60 : raw);
    if (goalMinutes < 1 || goalMinutes > 600) {
      setCreateError('Goal must be between 1 minute and 10 hours');
      return;
    }
    setCreating(true);
    try {
      const res = await api.post('/group-sessions', {
        name: name.trim(),
        description: description.trim(),
        goalMinutes,
      });
      navigate(`/group-sessions/${res.data.session._id}`);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    setJoinError('');
    const code = joinCode.trim().toUpperCase();
    if (!code) { setJoinError('Enter a code'); return; }
    setJoining(true);
    try {
      const res = await api.post('/group-sessions/join', { code });
      navigate(`/group-sessions/${res.data.session._id}`);
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Failed to join');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2 className="card-title">Group Study Sessions</h2>
        <p className="muted text-sm" style={{ marginTop: -4 }}>
          Study together in real time. Create a room, share the join code, and watch each other's
          contributions add up toward a shared goal.
        </p>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="card">
          <h3 className="card-title">Create a session</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Session name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Calculus crunch"
                maxLength={80}
                required
              />
            </div>
            <div className="form-group">
              <label>Description (optional)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are we studying?"
                maxLength={280}
              />
            </div>
            <div className="form-group">
              <label>Goal</label>
              <div className="goal-input">
                <input
                  type="number"
                  value={goalValue}
                  onChange={(e) => setGoalValue(e.target.value)}
                  min={goalUnit === 'hours' ? 0.25 : 1}
                  max={goalUnit === 'hours' ? 10 : 600}
                  step={goalUnit === 'hours' ? 0.25 : 1}
                  className="goal-input-number"
                />
                <div className="goal-unit-toggle" role="group" aria-label="Goal unit">
                  <button
                    type="button"
                    className={goalUnit === 'minutes' ? 'active' : ''}
                    onClick={() => setGoalUnit('minutes')}
                  >
                    min
                  </button>
                  <button
                    type="button"
                    className={goalUnit === 'hours' ? 'active' : ''}
                    onClick={() => setGoalUnit('hours')}
                  >
                    hr
                  </button>
                </div>
              </div>
              <p className="muted text-xs" style={{ marginTop: 6 }}>
                Up to 10 hours.
              </p>
            </div>
            {createError && <div className="error">{createError}</div>}
            <button type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create session'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Join with code</h3>
          <form onSubmit={handleJoin}>
            <div className="form-group">
              <label>Session code</label>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                maxLength={12}
                style={{ textTransform: 'uppercase', letterSpacing: '0.15em' }}
              />
            </div>
            {joinError && <div className="error">{joinError}</div>}
            <button type="submit" disabled={joining}>
              {joining ? 'Joining…' : 'Join session'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Your active sessions</h3>
        {error && <div className="error">{error}</div>}
        {!sessions && !error && <p className="muted">Loading…</p>}
        {sessions && sessions.length === 0 && (
          <p className="muted">You're not in any group sessions yet. Create one or join with a code above.</p>
        )}
        {sessions && sessions.map((s) => (
          <Link
            key={s._id}
            to={`/group-sessions/${s._id}`}
            className="group-session-row"
          >
            <div className="group-session-row-main">
              <div className="hstack" style={{ gap: 8, alignItems: 'center' }}>
                <span className={`gs-status gs-status-${s.status}`}>{s.status}</span>
                <strong>{s.name}</strong>
              </div>
              {s.description && <div className="muted text-sm">{s.description}</div>}
              <div className="muted text-xs" style={{ marginTop: 4 }}>
                Code <strong>{s.code}</strong> · {s.members.length} member{s.members.length === 1 ? '' : 's'} · Goal {formatGoal(s.goalMinutes)}
              </div>
            </div>
            <div className="group-session-row-avatars">
              {s.members.slice(0, 5).map((m) => (
                <Avatar key={m._id} name={m.name} avatar={m.avatar} size="sm" />
              ))}
              {s.members.length > 5 && (
                <span className="muted text-xs">+{s.members.length - 5}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
