import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

const PERKS = [
  { icon: '⏱️', label: 'Focus timer with Pomodoro presets' },
  { icon: '🏆', label: 'Live leaderboard with your study group' },
  { icon: '🔒', label: 'End-to-end encrypted group chat' },
  { icon: '📅', label: 'Daily streaks & activity heatmap' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-split">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      {/* ── Left branding panel ── */}
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <Link to="/welcome" className="auth-brand-logo">📚 Study Buddy</Link>
          <div>
            <h2 className="auth-brand-headline">Your study journey<br />starts here.</h2>
            <p className="auth-brand-sub">
              Track sessions, build streaks, quiz yourself, and grow together with your study group.
            </p>
          </div>
          <ul className="auth-perks">
            {PERKS.map(p => (
              <li key={p.label} className="auth-perk">
                <span className="auth-perk-icon">{p.icon}</span>
                <span>{p.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <div className="auth-form-header">
            <div className="auth-form-icon">👋</div>
            <h2>Welcome back</h2>
            <p className="muted">Log in to continue your study journey.</p>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="form-group">
            <label>Email address</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">@</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="auth-has-icon"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" disabled={submitting} className="auth-submit-btn">
            {submitting ? <><span className="auth-spinner" /> Logging in…</> : 'Log in →'}
          </button>

          <div className="auth-form-footer">
            <span className="muted text-sm">New here?</span>
            <Link to="/signup" className="auth-switch-link">Create a free account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
