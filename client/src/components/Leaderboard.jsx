import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';

const CROWNS = { 1: '🥇', 2: '🥈', 3: '🥉' };

function rankBadge(rank) {
  if (rank <= 3) return CROWNS[rank];
  return `#${rank}`;
}

function TierBlock({ tier, user }) {
  return (
    <div className="tier">
      <div className="tier-header">
        <h4 style={{ margin: 0 }}>{tier.targetHours}h goal</h4>
        <span className="muted text-sm">
          {tier.memberCount} {tier.memberCount === 1 ? 'member' : 'members'}
        </span>
      </div>
      <div className="mt-2">
        {tier.members.map((m) => (
          <Link
            to={`/users/${m._id}`}
            key={`${tier.targetHours}-${m._id}-${m.goalId}`}
            className={`leaderboard-row ${user && String(m._id) === String(user._id) ? 'me' : ''}`}
          >
            <div className="hstack">
              <span className="rank">{rankBadge(m.rank)}</span>
              <Avatar name={m.name} avatar={m.avatar} size="sm" />
              <div>
                <div>{m.name}</div>
                <div className="muted text-sm">{m.goalTitle}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="progress-bar" style={{ width: 80, marginBottom: 4 }}>
                <div className="progress-bar-fill" style={{ width: `${m.progressPercent}%` }} />
              </div>
              <strong>{m.goalHours} / {tier.targetHours}h</strong>
              <div className="muted text-sm">{m.progressPercent}%</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Leaderboard({ refreshKey }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('tiers');
  const [showOtherTiers, setShowOtherTiers] = useState(false);

  useEffect(() => {
    api
      .get('/users/leaderboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load leaderboard'));
  }, [refreshKey]);

  if (error) return <div className="card error">{error}</div>;
  if (!data) return <div className="card muted">Loading leaderboard…</div>;

  const top3 = data.global.filter(p => p.rank <= 3);
  const rest = data.global.filter(p => p.rank > 3);

  // tiers already sorted by targetHours descending from backend
  const myTiers = data.tiers.filter(t => t.members.some(m => user && String(m._id) === String(user._id)));
  const primaryTier = myTiers[0] || null;
  const otherTiers = myTiers.slice(1);

  return (
    <div className="card">
      <div className="hstack" style={{ justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>🏆 Leaderboard</h3>
        <div className="hstack">
          <button
            className={view === 'tiers' ? '' : 'secondary'}
            onClick={() => setView('tiers')}
          >
            By goal
          </button>
          <button
            className={view === 'global' ? '' : 'secondary'}
            onClick={() => setView('global')}
          >
            Global
          </button>
        </div>
      </div>

      {view === 'tiers' && (
        <div className="mt-4">
          {!primaryTier ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏅</div>
              <p className="empty-state-title">No goals yet</p>
              <p className="empty-state-sub">Create a goal to start competing!</p>
              <Link to="/goals"><button className="secondary" style={{ marginTop: 12 }}>Create a goal →</button></Link>
            </div>
          ) : (
            <>
              <TierBlock tier={primaryTier} user={user} />
              {otherTiers.length > 0 && (
                <>
                  <button
                    className="secondary"
                    style={{ width: '100%', marginTop: 10 }}
                    onClick={() => setShowOtherTiers(v => !v)}
                  >
                    {showOtherTiers ? 'Hide other goals ▲' : `Show ${otherTiers.length} more goal${otherTiers.length > 1 ? 's' : ''} ▼`}
                  </button>
                  {showOtherTiers && otherTiers.map(t => (
                    <TierBlock key={t.targetHours} tier={t} user={user} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {view === 'global' && (
        <div className="mt-4">
          {data.global.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌍</div>
              <p className="empty-state-title">No participants yet</p>
              <p className="empty-state-sub">Log a session to appear on the global board!</p>
            </div>
          ) : (
            <>
              {/* Podium for top 3 */}
              {top3.length >= 2 && (
                <div className="leaderboard-podium">
                  {top3.map(p => (
                    <Link to={`/users/${p._id}`} key={p._id} className={`podium-card rank-${p.rank}`} style={{ textDecoration: 'none' }}>
                      <div className="podium-crown">{CROWNS[p.rank]}</div>
                      <Avatar name={p.name} avatar={p.avatar} size="sm" />
                      <div className="podium-name">{p.name}</div>
                      <div className="podium-hours">{p.totalHours} hrs</div>
                      <div className="podium-step" />
                    </Link>
                  ))}
                </div>
              )}

              {/* Remaining rows */}
              {rest.map((p) => (
                <Link
                  to={`/users/${p._id}`}
                  key={p._id}
                  className={`leaderboard-row ${user && p._id === user._id ? 'me' : ''}`}
                >
                  <div className="hstack">
                    <span className="rank">{rankBadge(p.rank)}</span>
                    <Avatar name={p.name} avatar={p.avatar} size="sm" />
                    <span>{p.name}</span>
                  </div>
                  <div className="hstack" style={{ gap: 16, alignItems: 'center' }}>
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div className="progress-bar-fill" style={{ width: `${Math.min(100, (p.totalHours / (data.global[0]?.totalHours || 1)) * 100)}%` }} />
                    </div>
                    <strong style={{ minWidth: 60, textAlign: 'right' }}>{p.totalHours} hrs</strong>
                  </div>
                </Link>
              ))}

              {/* If fewer than 3, just show all as rows */}
              {top3.length < 2 && data.global.map((p) => (
                <Link
                  to={`/users/${p._id}`}
                  key={p._id}
                  className={`leaderboard-row ${user && p._id === user._id ? 'me' : ''}`}
                >
                  <div className="hstack">
                    <span className="rank">{rankBadge(p.rank)}</span>
                    <Avatar name={p.name} avatar={p.avatar} size="sm" />
                    <span>{p.name}</span>
                  </div>
                  <strong>{p.totalHours} hrs</strong>
                </Link>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
