import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import Heatmap from '../components/Heatmap.jsx';
import Avatar from '../components/Avatar.jsx';
import FollowListModal from '../components/FollowListModal.jsx';

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const SOCIAL_META = {
  linkedin: { label: 'LinkedIn', icon: '🔗' },
  github:   { label: 'GitHub',   icon: '💻' },
  twitter:  { label: 'Twitter',  icon: '🐦' },
  website:  { label: 'Website',  icon: '🌐' },
};

export default function Profile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const userId = id || me?._id;
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [followBusy, setFollowBusy] = useState(false);
  const [showList, setShowList] = useState(null); // 'followers' | 'following' | null

  useEffect(() => {
    if (!userId) return;
    setData(null);
    setError('');
    api
      .get(`/users/${userId}/profile`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load profile'));
  }, [userId]);

  if (error) return <div className="container"><div className="card error">{error}</div></div>;
  if (!data) return <div className="container"><div className="card muted">Loading profile…</div></div>;

  const isMe = me && data.user._id === me._id;
  const earnedAchievements = data.achievements.filter((a) => a.earned);
  const social = data.social || { followersCount: 0, followingCount: 0, isFollowing: false, canMessage: false };
  const links = data.user.socialLinks || {};
  const linkEntries = Object.entries(links).filter(([, v]) => v);

  async function handleToggleFollow() {
    if (!me) { navigate('/login'); return; }
    setFollowBusy(true);
    try {
      const res = social.isFollowing
        ? await api.delete(`/users/${data.user._id}/follow`)
        : await api.post(`/users/${data.user._id}/follow`);
      setData((prev) => ({
        ...prev,
        social: {
          ...prev.social,
          isFollowing: res.data.isFollowing,
          followersCount: res.data.followersCount,
        },
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setFollowBusy(false);
    }
  }

  function openMessage() {
    navigate(`/messages/${data.user._id}`);
  }

  return (
    <div className="container">
      <div className="card profile-header">
        <Avatar name={data.user.name} avatar={data.user.avatar} size="xl" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0 }}>{data.user.name}</h2>
          <p className="muted text-sm" style={{ margin: '4px 0 0' }}>
            {isMe ? data.user.email : 'Member'} · Joined{' '}
            {new Date(data.user.joinedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
            })}
          </p>
          {data.user.bio && <p className="profile-bio">{data.user.bio}</p>}

          <div className="follow-stats">
            <button onClick={() => setShowList('followers')}>
              <strong>{social.followersCount}</strong>followers
            </button>
            <button onClick={() => setShowList('following')}>
              <strong>{social.followingCount}</strong>following
            </button>
          </div>

          {linkEntries.length > 0 && (
            <div className="profile-meta-row">
              {linkEntries.map(([k, v]) => (
                <a key={k} href={v} target="_blank" rel="noopener noreferrer">
                  <span>{SOCIAL_META[k]?.icon || '🔗'}</span>
                  <span>{SOCIAL_META[k]?.label || k}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="profile-actions">
          {isMe ? (
            <Link to="/settings"><button className="secondary">Edit profile</button></Link>
          ) : (
            <>
              <button
                className={social.isFollowing ? 'secondary' : ''}
                onClick={handleToggleFollow}
                disabled={followBusy}
              >
                {social.isFollowing ? 'Following' : 'Follow'}
              </button>
              {social.canMessage && (
                <button className="secondary" onClick={openMessage}>Message</button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Stats</h3>
        <div className="stat-grid">
          <div className="stat">
            <div className="stat-value">{data.user.totalHours}</div>
            <div className="stat-label">Total hours</div>
          </div>
          <div className="stat">
            <div className="stat-value">{data.stats.sessionCount}</div>
            <div className="stat-label">Sessions</div>
          </div>
          <div className="stat">
            <div className="stat-value">{data.stats.currentStreak}</div>
            <div className="stat-label">Current streak</div>
          </div>
          <div className="stat">
            <div className="stat-value">{data.stats.longestStreak}</div>
            <div className="stat-label">Longest streak</div>
          </div>
          <div className="stat">
            <div className="stat-value">{data.stats.activeDays}</div>
            <div className="stat-label">Active days</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Activity</h3>
        <Heatmap data={data.heatmap} />
      </div>

      <div className="card">
        <h3 className="card-title">
          Achievements <span className="muted text-sm">({earnedAchievements.length}/{data.achievements.length})</span>
        </h3>
        <div className="achievement-grid">
          {data.achievements.map((a) => (
            <div key={a.id} className={`achievement ${a.earned ? 'earned' : 'locked'}`}>
              <div className="achievement-icon">{a.icon}</div>
              <div className="achievement-name">{a.name}</div>
              <div className="achievement-desc">{a.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Goals</h3>
        {data.goals.length === 0 ? (
          <p className="muted">
            {isMe ? (
              <>No goals set. <Link to="/goals">Create one →</Link></>
            ) : (
              'No goals set.'
            )}
          </p>
        ) : (
          <div className="section-grid">
            {data.goals.map((g) => {
              const achieved = g.progressPercent >= 100;
              return (
                <div key={g._id} className={`goal-card ${achieved ? 'achieved' : ''}`}>
                  <h4 style={{ margin: 0 }}>
                    {achieved && '🏆 '}
                    {g.title}
                  </h4>
                  <p className="muted text-sm mt-2">
                    {g.targetHours} hrs target · {g.progressPercent}%
                  </p>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.min(100, g.progressPercent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">Recent sessions</h3>
        {data.recentSessions.length === 0 ? (
          <p className="muted">No sessions yet.</p>
        ) : (
          data.recentSessions.map((s) => (
            <div key={s._id} className="session-item">
              <div className="session-meta">
                <span>{s.subject || 'Untitled'}</span>
                <span>
                  {formatDuration(s.durationSeconds)} ·{' '}
                  {new Date(s.startedAt).toLocaleDateString()}
                </span>
              </div>
              {s.notes && <p className="text-sm muted">{s.notes}</p>}
            </div>
          ))
        )}
      </div>

      {showList && (
        <FollowListModal
          userId={data.user._id}
          which={showList}
          onClose={() => setShowList(null)}
        />
      )}
    </div>
  );
}
