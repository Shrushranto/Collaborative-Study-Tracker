import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import Avatar from './Avatar.jsx';

export default function FollowListModal({ userId, which, onClose }) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setUsers(null);
    setError('');
    api
      .get(`/users/${userId}/${which}`)
      .then((res) => setUsers(res.data.users))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load list'));
  }, [userId, which]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0, textTransform: 'capitalize' }}>{which}</h3>
          <button className="icon-button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          {error && <div className="error">{error}</div>}
          {!users && !error && <p className="muted">Loading…</p>}
          {users && users.length === 0 && (
            <p className="muted">No {which} yet.</p>
          )}
          {users && users.map((u) => (
            <Link key={u._id} to={`/users/${u._id}`} className="people-card" onClick={onClose}>
              <Avatar name={u.name} avatar={u.avatar} size="md" />
              <div className="person-info">
                <div className="person-name">{u.name}</div>
                {u.bio && <div className="person-bio">{u.bio}</div>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
