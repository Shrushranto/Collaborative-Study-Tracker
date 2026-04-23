import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

const PERKS = [
  { icon: '📅', label: 'Daily streaks & monthly heatmap' },
  { icon: '🧠', label: 'Auto-generated quizzes & flashcards' },
  { icon: '🦉', label: 'Focus pet companion while you study' },
  { icon: '📁', label: 'Share study files with your group' },
];

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 6)  score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak',   color: 'var(--danger)' };
  if (score <= 3) return { score, label: 'Fair',   color: 'var(--warning)' };
  return              { score, label: 'Strong', color: 'var(--success)' };
}

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const strength = getPasswordStrength(password);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSubmitting(true);
    try {
      await signup(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
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
            <h2 className="auth-brand-headline">Join thousands of<br />focused learners.</h2>
            <p className="auth-brand-sub">
              Free forever. No credit card needed. Start tracking your study journey today.
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
            <div className="auth-form-icon">🚀</div>
            <h2>Create your account</h2>
            <p className="muted">Free forever. Start tracking today.</p>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="form-group">
            <label>Full name</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">👤</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
                autoComplete="name"
                className="auth-has-icon"
              />
            </div>
          </div>

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
              minLength={6}
              autoComplete="new-password"
              placeholder="At least 6 characters"
            />
            {password && (
              <div className="pw-strength">
                <div className="pw-strength-bars">
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className="pw-strength-bar"
                      style={{ background: n <= strength.score ? strength.color : 'var(--border)' }} />
                  ))}
                </div>
                <span className="pw-strength-label" style={{ color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} className="auth-submit-btn">
            {submitting ? <><span className="auth-spinner" /> Creating account…</> : 'Create account →'}
          </button>

          <div className="auth-form-footer">
            <span className="muted text-sm">Already have an account?</span>
            <Link to="/login" className="auth-switch-link">Log in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
