import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTimer } from '../context/TimerContext.jsx';
import { FocusPetPortal } from './FocusPet.jsx';
import api from '../api/axios.js';

const POMODORO_PRESETS = [
  { label: '25 min', seconds: 25 * 60 },
  { label: '50 min', seconds: 50 * 60 },
  { label: '90 min', seconds: 90 * 60 },
];

function format(seconds) {
  const abs = Math.max(0, seconds);
  const h = String(Math.floor(abs / 3600)).padStart(2, '0');
  const m = String(Math.floor((abs % 3600) / 60)).padStart(2, '0');
  const s = String(abs % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function enterFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  if (el.mozRequestFullScreen) return el.mozRequestFullScreen();
  if (el.msRequestFullscreen) return el.msRequestFullscreen();
}

function exitFullscreen() {
  if (document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
  if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
  if (document.msExitFullscreen) return document.msExitFullscreen();
}

function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

export default function Timer({ onSessionSaved }) {
  const {
    seconds, running, subject, notes, goalId, saving, error, targetSeconds,
    setSubject, setNotes, setGoalId, setTargetSeconds,
    start, pause, reset, save,
  } = useTimer();

  const [focusMode, setFocusMode] = useState(false);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    api.get('/goals/me').then(res => setGoals(res.data.goals || [])).catch(() => {});
  }, []);

  function openFocus() {
    setFocusMode(true);
    enterFullscreen();
  }

  function closeFocus() {
    setFocusMode(false);
    if (isFullscreen()) exitFullscreen();
  }

  // Sync focus mode if user exits fullscreen via browser (F11 / Esc)
  useEffect(() => {
    function onFsChange() {
      if (!isFullscreen() && focusMode) setFocusMode(false);
    }
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    document.addEventListener('mozfullscreenchange', onFsChange);
    document.addEventListener('MSFullscreenChange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      document.removeEventListener('mozfullscreenchange', onFsChange);
      document.removeEventListener('MSFullscreenChange', onFsChange);
    };
  }, [focusMode]);

  // Keyboard shortcuts while in focus mode
  useEffect(() => {
    if (!focusMode) return;
    function onKey(e) {
      if (e.key === 'Escape') closeFocus();
      else if (e.key === ' ') {
        e.preventDefault();
        running ? pause() : start();
      }
    }
    window.addEventListener('keydown', onKey);
    document.body.classList.add('focus-mode-open');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('focus-mode-open');
    };
  }, [focusMode, running]);

  const remaining = targetSeconds > 0 ? targetSeconds - seconds : 0;
  const overTarget = targetSeconds > 0 && remaining < 0;
  const displaySeconds = targetSeconds > 0 ? Math.abs(remaining) : seconds;
  const progress = targetSeconds > 0 ? Math.min(100, (seconds / targetSeconds) * 100) : 0;

  return (
    <>
      <div className="card">
        <div className="timer-header">
          <h3 style={{ margin: 0 }}>⏱️ Study Timer</h3>
          <button
            className="icon-button"
            onClick={openFocus}
            title="Enter focus mode (fullscreen)"
            aria-label="Enter focus mode"
          >
            ⛶
          </button>
        </div>
        <div className="timer-display">{format(seconds)}</div>
        <div className="timer-controls">
          {!running ? (
            <button onClick={start}>{seconds === 0 ? 'Start' : 'Resume'}</button>
          ) : (
            <button className="secondary" onClick={pause}>Pause</button>
          )}
          <button className="secondary" onClick={reset} disabled={running}>Reset</button>
        </div>
        <div className="form-group">
          <label>Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Calculus, History"
          />
        </div>
        <div className="form-group">
          <label>Reflection / notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="What did you study? What clicked? What was hard?"
          />
        </div>
        {goals.length > 0 && (
          <div className="form-group">
            <label>Save toward goal <span className="muted text-xs">(optional)</span></label>
            <select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
              <option value="">— No goal —</option>
              {goals.map(g => (
                <option key={g._id} value={g._id}>{g.title} ({g.targetHours}h)</option>
              ))}
            </select>
          </div>
        )}
        {error && <div className="error">{error}</div>}
        <button onClick={() => save(onSessionSaved)} disabled={saving || seconds < 1} style={{ width: '100%' }}>
          {saving ? 'Saving…' : 'Save session'}
        </button>
      </div>

      {focusMode && createPortal(
        <div className="focus-overlay" role="dialog" aria-modal="true" aria-label="Focus mode">
          <button
            className="focus-exit"
            onClick={closeFocus}
            title="Exit focus mode (Esc)"
            aria-label="Exit focus mode"
          >
            ✕
          </button>

          <div className="focus-content">
            <div className="focus-presets">
              {POMODORO_PRESETS.map((p) => (
                <button
                  key={p.seconds}
                  className={`focus-preset ${targetSeconds === p.seconds ? 'active' : ''}`}
                  onClick={() => { if (!running) setTargetSeconds(p.seconds); }}
                  disabled={running}
                >
                  {p.label}
                </button>
              ))}
              <button
                className={`focus-preset ${targetSeconds === 0 ? 'active' : ''}`}
                onClick={() => { if (!running) setTargetSeconds(0); }}
                disabled={running}
              >
                Free
              </button>
            </div>

            {subject && <div className="focus-subject">{subject}</div>}

            <div className={`focus-timer ${overTarget ? 'over' : ''}`}>
              {overTarget && <span className="focus-over-label">+</span>}
              {format(displaySeconds)}
            </div>

            {targetSeconds > 0 && (
              <div className="focus-progress" aria-hidden="true">
                <div className="focus-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            )}

            <div className="focus-controls">
              {!running ? (
                <button className="focus-btn primary" onClick={start}>
                  {seconds === 0 ? 'Start' : 'Resume'}
                </button>
              ) : (
                <button className="focus-btn" onClick={pause}>Pause</button>
              )}
              <button className="focus-btn" onClick={reset} disabled={running}>Reset</button>
            </div>

            <div className="focus-hint">
              Space — start/pause · Esc — exit
            </div>
          </div>

          <FocusPetPortal />
        </div>,
        document.body
      )}
    </>
  );
}
