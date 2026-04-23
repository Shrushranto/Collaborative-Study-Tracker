import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Timer from '../components/Timer.jsx';
import Leaderboard from '../components/Leaderboard.jsx';
import MonthlyCalendar from '../components/MonthlyCalendar.jsx';
import SessionLog from '../components/SessionLog.jsx';
import QuoteOfTheDay from '../components/QuoteOfTheDay.jsx';
import DraggableCard from '../components/DraggableCard.jsx';
import api from '../api/axios.js';
import { loadLayout, saveLayout, resetLayout, DEFAULT_LAYOUT } from '../utils/dashboardLayout.js';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [editMode, setEditMode] = useState(false);
  const [goalProgress, setGoalProgress] = useState(null);

  useEffect(() => {
    setLayout(loadLayout());
  }, []);

  useEffect(() => {
    api.get('/goals/mine').then(res => {
      const goals = res.data.goals || [];
      if (goals.length > 0) {
        const g = goals[0];
        const pct = Math.min(100, Math.round(((user?.totalSeconds || 0) / 3600 / g.targetHours) * 100));
        setGoalProgress({ title: g.title, pct, target: g.targetHours });
      }
    }).catch(() => {});
  }, [user]);

  function handleSessionSaved() {
    setRefreshKey((k) => k + 1);
    refreshUser();
  }

  function handleReorder(draggedId, targetId) {
    const newLayout = [...layout];
    const draggedIdx = newLayout.findIndex(item => item.id === draggedId);
    const targetIdx = newLayout.findIndex(item => item.id === targetId);
    if (draggedIdx !== -1 && targetIdx !== -1) {
      const [draggedItem] = newLayout.splice(draggedIdx, 1);
      newLayout.splice(targetIdx, 0, draggedItem);
      setLayout(newLayout);
      saveLayout(newLayout);
    }
  }

  function handleToggleSpan(id) {
    const newLayout = layout.map(item =>
      item.id === id ? { ...item, span: item.span === 1 ? 2 : 1 } : item
    );
    setLayout(newLayout);
    saveLayout(newLayout);
  }

  function handleResetLayout() {
    resetLayout();
    setLayout(DEFAULT_LAYOUT);
    setEditMode(false);
  }

  const totalHours = user ? (user.totalSeconds / 3600).toFixed(1) : 0;
  const streak = user?.currentStreak || 0;

  const components = {
    timer: <Timer onSessionSaved={handleSessionSaved} />,
    leaderboard: <Leaderboard refreshKey={refreshKey} />,
    calendar: <MonthlyCalendar refreshKey={refreshKey} />,
    sessions: <SessionLog refreshKey={refreshKey} />
  };

  return (
    <div className="container">
      {/* Welcome Card */}
      <div className="card welcome-card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>Welcome back, {user?.name} 👋</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              You've logged <strong>{totalHours} hours</strong> of focused study.
            </p>
          </div>
          {/* Streak badge */}
          {streak > 0 && (
            <div className="streak-badge">
              <span className="streak-flame">🔥</span>
              <div>
                <div className="streak-count">{streak}-day streak</div>
                <div className="streak-sub">Keep it going!</div>
              </div>
            </div>
          )}
        </div>

        {/* Goal progress bar */}
        {goalProgress && (
          <div className="welcome-goal-progress">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="text-sm" style={{ fontWeight: 600 }}>{goalProgress.title}</span>
              <span className="muted text-xs">{goalProgress.pct}% · {goalProgress.target}h goal</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${goalProgress.pct}%`, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }}
              />
            </div>
          </div>
        )}

        <div className="hstack" style={{ marginTop: 16 }}>
          <Link to="/goals"><button className="secondary">Manage goals</button></Link>
          <Link to="/profile"><button>View profile</button></Link>
          {editMode && (
            <button className="secondary danger-text" onClick={handleResetLayout}>Reset layout</button>
          )}
        </div>
      </div>

      <QuoteOfTheDay />

      <div className="dashboard-grid">
        {layout.map((item, index) => (
          components[item.id] ? (
            <DraggableCard
              key={item.id}
              id={item.id}
              span={item.span}
              editMode={editMode}
              onReorder={handleReorder}
              onEnterEditMode={() => setEditMode(true)}
              onToggleSpan={handleToggleSpan}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {components[item.id]}
            </DraggableCard>
          ) : null
        ))}
      </div>

      {editMode && (
        <button className="done-editing-fab" onClick={() => setEditMode(false)}>
          Done Editing
        </button>
      )}
    </div>
  );
}



