import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  {
    icon: '⏱️',
    title: 'Focus timer',
    desc: 'Pomodoro presets and a distraction-free full-screen mode with your personal focus pet.',
  },
  {
    icon: '🏆',
    title: 'Live leaderboard',
    desc: 'Race friends toward shared goals and climb the weekly rankings together.',
  },
  {
    icon: '📅',
    title: 'Streaks & heatmap',
    desc: 'See your daily consistency at a glance across every month of the year.',
  },
  {
    icon: '🧠',
    title: 'Quiz & flashcards',
    desc: 'Auto-generated weekly quizzes and flippable flashcards for your study topics.',
  },
  {
    icon: '💬',
    title: 'Encrypted chat',
    desc: 'End-to-end encrypted messaging so your study conversations stay private.',
  },
  {
    icon: '✨',
    title: 'AI study assistant',
    desc: 'Ask questions, get explanations, and summarise notes with Gemini AI built in.',
  },
];

export default function Welcome() {
  const { user, loading } = useAuth();
  if (loading) return <div className="container">Loading…</div>;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="welcome-screen">
      <div className="welcome-inner">
        <span className="welcome-badge">📚 Study Buddy · Free forever</span>
        <h1 className="welcome-title">
          Study smarter,<br />
          together with <span className="accent">Study Buddy</span>
        </h1>
        <p className="welcome-tagline">
          Track sessions, build daily streaks, quiz yourself, and stay motivated
          with friends — all in one beautifully focused space.
        </p>
        <div className="welcome-cta">
          <Link to="/signup">
            <button className="btn-large">Get Started for free →</button>
          </Link>
          <Link to="/login">
            <button className="secondary btn-large">Sign in</button>
          </Link>
        </div>
        <div className="welcome-features">
          {FEATURES.map((f) => (
            <div key={f.title} className="welcome-feature">
              <div className="welcome-feature-icon">{f.icon}</div>
              <div className="welcome-feature-title">{f.title}</div>
              <div className="welcome-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
