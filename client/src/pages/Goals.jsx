import { useEffect, useState } from 'react';
import api from '../api/axios.js';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [targetHours, setTargetHours] = useState('');
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/goals/me');
      setGoals(res.data.goals);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    if (!title.trim() || !targetHours) {
      setError('Please enter a title and target hours');
      return;
    }
    setCreating(true);
    try {
      await api.post('/goals', { title: title.trim(), targetHours: Number(targetHours) });
      setTitle('');
      setTargetHours('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create goal');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      setGoals((g) => g.filter((x) => x._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete goal');
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2 className="card-title">My Goals</h2>
        <p className="muted">
          Set personal study targets. You'll be grouped with others sharing the same goal on the leaderboard.
        </p>
      </div>

      <div className="card">
        <h3 className="card-title">Create a new goal</h3>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Goal title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Calculus, Pass MCAT"
              required
            />
          </div>
          <div className="form-group">
            <label>Target hours</label>
            <input
              type="number"
              min="1"
              value={targetHours}
              onChange={(e) => setTargetHours(e.target.value)}
              placeholder="e.g. 100"
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={creating}>
            {creating ? 'Creating…' : 'Add goal'}
          </button>
        </form>
      </div>

      <div className="section-grid">
        {loading ? (
          <div className="card muted">Loading goals…</div>
        ) : goals.length === 0 ? (
          <div className="card empty-state">
            <p>No goals yet. Create your first one above!</p>
          </div>
        ) : (
          goals.map((g) => {
            const achieved = g.progressPercent >= 100;
            const currentHours = (g.currentSeconds / 3600).toFixed(2);
            return (
              <div key={g._id} className={`card goal-card ${achieved ? 'achieved' : ''}`}>
                <div className="hstack" style={{ justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0 }}>
                    {achieved && '🏆 '}
                    {g.title}
                  </h3>
                  <button className="secondary" onClick={() => handleDelete(g._id)}>
                    Delete
                  </button>
                </div>
                <p className="muted text-sm mt-2">
                  {currentHours} / {g.targetHours} hrs · {g.progressPercent}%
                </p>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${Math.min(100, g.progressPercent)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
