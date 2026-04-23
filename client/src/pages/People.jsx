import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import Avatar from '../components/Avatar.jsx';

export default function People() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError('');
    const t = setTimeout(() => {
      api
        .get('/users/discover', { params: query ? { q: query } : {} })
        .then((res) => { if (!cancelled) setUsers(res.data.users); })
        .catch((err) => { if (!cancelled) setError(err.response?.data?.message || 'Failed to load people'); });
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  async function toggleFollow(u) {
    setBusyId(u._id);
    try {
      const res = u.isFollowing
        ? await api.delete(`/users/${u._id}/follow`)
        : await api.post(`/users/${u._id}/follow`);
      setUsers((prev) =>
        prev.map((x) =>
          x._id === u._id
            ? { ...x, isFollowing: res.data.isFollowing, followersCount: res.data.followersCount }
            : x
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container container-narrow">
      <div className="card">
        <h2 className="card-title">Discover people</h2>
        <input
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        {error && <div className="error">{error}</div>}
        {!users && !error && <p className="muted">Loading…</p>}
        {users && users.length === 0 && (
          <p className="muted">No people found{query && ` matching "${query}"`}.</p>
        )}
        {users && users.map((u) => (
          <div key={u._id} className="people-card">
            <Avatar name={u.name} avatar={u.avatar} size="md" />
            <div className="person-info">
              <div className="person-name">
                <Link to={`/users/${u._id}`}>{u.name}</Link>
              </div>
              {u.bio && <div className="person-bio">{u.bio}</div>}
              <div className="muted text-xs">
                {u.totalHours} hrs · {u.followersCount} followers
              </div>
            </div>
            <button
              className={u.isFollowing ? 'secondary sm' : 'sm'}
              disabled={busyId === u._id}
              onClick={() => toggleFollow(u)}
            >
              {u.isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
