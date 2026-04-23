import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDisplayDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function MonthlyCalendar({ refreshKey }) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [days, setDays] = useState({});
  const [error, setError] = useState('');

  // Panel state
  const [panel, setPanel] = useState(null); // { date: 'YYYY-MM-DD', sessions: [], loading: bool }

  useEffect(() => {
    api.get('/sessions/calendar')
      .then((res) => {
        const map = {};
        res.data.days.forEach((d) => {
          map[d.date] = {
            totalSeconds: d.totalSeconds,
            subjects: (d.subjects || []).filter(Boolean),
          };
        });
        setDays(map);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load calendar'));
  }, [refreshKey]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  function prev() { setViewDate(new Date(year, month - 1, 1)); }
  function next() { setViewDate(new Date(year, month + 1, 1)); }
  function goToday() { setViewDate(new Date(today.getFullYear(), today.getMonth(), 1)); }

  const monthTotal = cells.reduce((sum, d) => {
    if (!d) return sum;
    return sum + (days[dateKey(d)]?.totalSeconds || 0);
  }, 0);

  async function openPanel(key) {
    setPanel({ date: key, sessions: [], loading: true });
    try {
      const res = await api.get(`/sessions/by-date?date=${key}`);
      setPanel({ date: key, sessions: res.data.sessions, loading: false });
    } catch {
      setPanel({ date: key, sessions: [], loading: false, error: 'Failed to load sessions.' });
    }
  }

  function closePanel() { setPanel(null); }

  return (
    <>
      <div className="card">
        <div className="calendar-header">
          <div>
            <h3 style={{ margin: 0 }}>{MONTH_NAMES[month]} {year}</h3>
            <p className="muted text-sm" style={{ margin: '4px 0 0' }}>
              {fmtDuration(monthTotal)} this month
            </p>
          </div>
          <div className="calendar-nav">
            <button className="secondary" onClick={prev} aria-label="Previous month">‹</button>
            <button className="secondary" onClick={goToday}>Today</button>
            <button className="secondary" onClick={next} aria-label="Next month">›</button>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="calendar-grid">
          {DOW.map((d) => <div key={d} className="calendar-dow">{d}</div>)}

          {cells.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} className="calendar-cell empty" />;
            const key = dateKey(d);
            const info = days[key];
            const seconds = info?.totalSeconds || 0;
            const subjects = info?.subjects || [];
            const isToday = d.getTime() === today.getTime();
            const studied = seconds > 0;

            return (
              <div
                key={key}
                className={`calendar-cell cal-cell-interactive ${studied ? 'has-study' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => studied && openPanel(key)}
                style={{ cursor: studied ? 'pointer' : 'default' }}
              >
                <span className="calendar-date">{d.getDate()}</span>
                {studied && <span className="calendar-amount">{fmtDuration(seconds)}</span>}

                {/* Hover tooltip */}
                {studied && (
                  <div className="cal-tooltip">
                    <div className="cal-tooltip-time">{fmtDuration(seconds)}</div>
                    {subjects.length > 0 && (
                      <div className="cal-tooltip-subjects">
                        {subjects.map((s) => (
                          <span key={s} className="cal-tooltip-subject">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="cal-tooltip-hint">Click to view details</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide-in panel */}
      {panel && (
        <>
          <div className="day-panel-backdrop" onClick={closePanel} />
          <div className="day-panel">
            <div className="day-panel-header">
              <div>
                <div className="day-panel-title">{fmtDisplayDate(panel.date)}</div>
                {!panel.loading && !panel.error && (
                  <div className="day-panel-meta muted text-sm">
                    {panel.sessions.length} session{panel.sessions.length !== 1 ? 's' : ''} &middot;{' '}
                    {fmtDuration(panel.sessions.reduce((s, x) => s + x.durationSeconds, 0))} total
                  </div>
                )}
              </div>
              <button className="ghost" onClick={closePanel} aria-label="Close">✕</button>
            </div>

            <div className="day-panel-body">
              {panel.loading && <p className="muted text-sm">Loading…</p>}
              {panel.error && <div className="error">{panel.error}</div>}
              {!panel.loading && !panel.error && panel.sessions.length === 0 && (
                <p className="muted text-sm">No sessions found for this day.</p>
              )}
              {!panel.loading && panel.sessions.map((s, idx) => (
                <div key={s._id} className="day-panel-session">
                  <div className="day-panel-session-header">
                    <span className="day-panel-session-subject">
                      {s.subject || <em className="muted">No subject</em>}
                    </span>
                    <span className="day-panel-session-duration">
                      {fmtDuration(s.durationSeconds)}
                    </span>
                  </div>
                  <div className="day-panel-session-time muted text-xs">
                    {fmtTime(s.startedAt)} – {fmtTime(s.endedAt)}
                  </div>
                  {s.notes ? (
                    <div className="day-panel-notes">
                      <div className="day-panel-notes-label">Notes / Reflection</div>
                      <div className="day-panel-notes-body">{s.notes}</div>
                    </div>
                  ) : (
                    <div className="day-panel-notes-empty muted text-xs">No notes recorded.</div>
                  )}
                  {idx < panel.sessions.length - 1 && <hr className="day-panel-divider" />}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
