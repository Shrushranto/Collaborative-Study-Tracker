import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';

function fmt(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export default function GroupSessionRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [studying, setStudying] = useState(false);
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [liveTotal, setLiveTotal] = useState(0);
  const [liveMine, setLiveMine] = useState(0);
  const tickRef = useRef(null);

  async function load() {
    try {
      const res = await api.get(`/group-sessions/${id}`);
      setSession(res.data.session);
      const me = res.data.session.members.find((m) => m.isMe);
      if (me) setStudying(me.isStudying);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load session');
    }
  }

  useEffect(() => {
    load();
    const poll = setInterval(load, 5000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Recalibrate the live counters each time we get fresh server data.
  useEffect(() => {
    if (!session) return;
    setLiveTotal(session.totalSeconds || 0);
    const me = session.members.find((m) => m.isMe);
    setLiveMine(me?.secondsContributed || 0);
  }, [session]);

  // Dashboard-style 1-second tick while the session is active.
  useEffect(() => {
    if (!session || session.status !== 'active') return;
    const studyingCount = session.members.filter((m) => m.isStudying).length;
    if (studyingCount === 0 && !studying) return;
    const id = setInterval(() => {
      if (studyingCount > 0) setLiveTotal((t) => t + studyingCount);
      if (studying) setLiveMine((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [session, studying]);

  // Heartbeat tick: when "studying" is true and status active, send a tick every 20s
  useEffect(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    if (!session || session.status !== 'active' || !studying) return;
    async function sendTick() {
      try {
        const res = await api.post(`/group-sessions/${id}/tick`, { studying: true });
        setSession(res.data.session);
      } catch (err) {
        console.error(err);
      }
    }
    sendTick();
    tickRef.current = setInterval(sendTick, 20000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studying, session?.status, id]);

  async function toggleStudy() {
    if (!session || session.status !== 'active') return;
    setBusy(true);
    try {
      const next = !studying;
      const res = await api.post(`/group-sessions/${id}/tick`, { studying: next });
      setSession(res.data.session);
      setStudying(next);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function startSession() {
    setBusy(true);
    try {
      const res = await api.post(`/group-sessions/${id}/start`);
      setSession(res.data.session);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function endSession() {
    if (!confirm('End this session for everyone? Contributions will be saved as personal study time.')) return;
    setBusy(true);
    try {
      const res = await api.post(`/group-sessions/${id}/end`);
      setSession(res.data.session);
      await refreshUser();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function leaveSession() {
    if (!confirm('Leave this session?')) return;
    setBusy(true);
    try {
      await api.delete(`/group-sessions/${id}/leave`);
      navigate('/group-sessions');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
      setBusy(false);
    }
  }

  async function handleInvite(e) {
    e.preventDefault();
    setInviteMsg('');
    const q = inviteQuery.trim();
    if (!q) return;
    setBusy(true);
    try {
      const res = await api.post(`/group-sessions/${id}/invite`, { query: q });
      setSession(res.data.session);
      setInviteMsg(`Added ${res.data.invited.name} to the session.`);
      setInviteQuery('');
    } catch (err) {
      setInviteMsg(err.response?.data?.message || 'Failed to invite');
    } finally {
      setBusy(false);
    }
  }

  function copyCode() {
    if (!session) return;
    navigator.clipboard?.writeText(session.code);
    setInviteMsg(`Copied code ${session.code}`);
  }

  if (error) return <div className="container"><div className="card error">{error}</div></div>;
  if (!session) return <div className="container"><div className="card muted">Loading session…</div></div>;

  const goalSeconds = session.goalMinutes * 60;
  const displayTotal = session.status === 'active' ? liveTotal : session.totalSeconds;
  const pct = Math.min(100, Math.round((displayTotal / goalSeconds) * 100));
  const me = session.members.find((m) => m.isMe);
  const displayMine = session.status === 'active' ? liveMine : (me?.secondsContributed || 0);
  const goalLabel = session.goalMinutes % 60 === 0
    ? `${session.goalMinutes / 60}h`
    : session.goalMinutes > 60
      ? `${Math.floor(session.goalMinutes / 60)}h ${session.goalMinutes % 60}m`
      : `${session.goalMinutes}m`;

  return (
    <div className="container">
      <div className="card">
        <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="hstack" style={{ gap: 8, alignItems: 'center' }}>
              <span className={`gs-status gs-status-${session.status}`}>{session.status}</span>
              <h2 style={{ margin: 0 }}>{session.name}</h2>
            </div>
            {session.description && <p className="muted" style={{ marginTop: 4 }}>{session.description}</p>}
            <div className="muted text-xs">
              Hosted by <Link to={`/users/${session.host._id}`}>{session.host.name}</Link>
            </div>
          </div>
          <div className="hstack" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className="secondary" onClick={copyCode} title="Copy join code">
              Code: <strong style={{ marginLeft: 4, letterSpacing: '0.15em' }}>{session.code}</strong>
            </button>
            {session.isHost && session.status === 'waiting' && (
              <button onClick={startSession} disabled={busy}>Start session</button>
            )}
            {session.isHost && session.status === 'active' && (
              <button className="danger" onClick={endSession} disabled={busy}>End session</button>
            )}
            {!session.isHost && session.status !== 'ended' && (
              <button className="secondary" onClick={leaveSession} disabled={busy}>Leave</button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Group progress</h3>
        <div className="group-progress-numbers">
          <div className={`group-timer-display ${session.status === 'active' && studying ? 'live' : ''}`}>
            {fmt(displayTotal)}
          </div>
          <div className="muted">of {goalLabel} goal</div>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="muted text-sm" style={{ marginTop: 6 }}>{pct}% complete</div>

        {session.status === 'waiting' && (
          <p className="muted text-sm" style={{ marginTop: 12 }}>
            Waiting for the host to start the session.
          </p>
        )}
        {session.status === 'active' && me && (
          <div style={{ marginTop: 16 }}>
            <div className="group-my-timer">
              <div className="muted text-xs">Your session time</div>
              <div className={`timer-display ${studying ? 'live' : ''}`}>{fmt(displayMine)}</div>
            </div>
            <button
              className={studying ? 'danger' : ''}
              onClick={toggleStudy}
              disabled={busy}
              style={{ minWidth: 180, marginTop: 12 }}
            >
              {studying ? '⏸ I am taking a break' : '▶ I am studying'}
            </button>
          </div>
        )}
        {session.status === 'ended' && (
          <p className="muted text-sm" style={{ marginTop: 12 }}>
            Session ended. Contributions of one minute or more were saved to each member's study log.
          </p>
        )}
      </div>

      <div className="card">
        <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title" style={{ marginBottom: 0 }}>
            Members <span className="muted text-sm">({session.members.length})</span>
          </h3>
        </div>
        <div className="group-members">
          {session.members
            .slice()
            .sort((a, b) => (b.secondsContributed || 0) - (a.secondsContributed || 0))
            .map((m) => (
              <div key={m._id} className={`group-member ${m.isStudying ? 'studying' : ''}`}>
                <Avatar name={m.name} avatar={m.avatar} size="md" />
                <div className="group-member-info">
                  <div className="group-member-name">
                    <Link to={`/users/${m._id}`}>{m.name}</Link>
                    {m.isMe && <span className="muted text-xs"> · you</span>}
                    {String(m._id) === String(session.host?._id) && (
                      <span className="muted text-xs"> · host</span>
                    )}
                  </div>
                  <div className="muted text-xs">
                    {m.isStudying ? '🟢 studying' : 'idle'} · {fmt(m.secondsContributed)}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {session.isHost && session.status !== 'ended' && (
        <div className="card">
          <h3 className="card-title">Invite by username, email, or user id</h3>
          <form onSubmit={handleInvite} className="hstack" style={{ gap: 8 }}>
            <input
              value={inviteQuery}
              onChange={(e) => setInviteQuery(e.target.value)}
              placeholder="username, email, or 24-char id"
              style={{ flex: 1 }}
              maxLength={120}
            />
            <button type="submit" disabled={busy || !inviteQuery.trim()}>Invite</button>
          </form>
          {inviteMsg && <p className="muted text-sm" style={{ marginTop: 8 }}>{inviteMsg}</p>}
          <p className="muted text-xs" style={{ marginTop: 8 }}>
            Or share the join code <strong>{session.code}</strong> with anyone — they can paste it on the Group Sessions page.
          </p>
        </div>
      )}
      
    </div>
  );
}
