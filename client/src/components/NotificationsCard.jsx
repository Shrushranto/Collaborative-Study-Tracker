import { useState, useEffect } from 'react';
import { requestPermission, scheduleLocalReminder } from '../utils/notifications.js';

export default function NotificationsCard() {
  const [permission, setPermission] = useState('default');
  const [reminderTime, setReminderTime] = useState('');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    } else {
      setPermission('unsupported');
    }
    
    const savedTime = localStorage.getItem('study-tracker-reminder-time');
    if (savedTime) setReminderTime(savedTime);
  }, []);

  async function handleEnable() {
    const p = await requestPermission();
    setPermission(p);
  }

  function handleTimeChange(e) {
    const t = e.target.value;
    setReminderTime(t);
    if (t) {
      localStorage.setItem('study-tracker-reminder-time', t);
      scheduleLocalReminder(t);
    } else {
      localStorage.removeItem('study-tracker-reminder-time');
    }
  }

  const statusLabel = 
    permission === 'granted' ? <span className="success" style={{ padding: 0 }}>Granted</span> :
    permission === 'denied' ? <span className="error" style={{ padding: 0 }}>Denied</span> :
    permission === 'unsupported' ? <span className="muted">Unsupported</span> :
    <span className="muted">Not requested</span>;

  return (
    <div className="card">
      <h3 className="card-title">Notifications</h3>
      <p className="muted text-sm" style={{ marginBottom: 16 }}>
        Get daily reminders to study and updates when your study buddies are online.
      </p>

      <div className="form-group">
        <label>Browser permission: {statusLabel}</label>
        {permission !== 'granted' && permission !== 'unsupported' && (
          <button className="secondary" onClick={handleEnable} style={{ width: 'fit-content' }}>
            Enable notifications
          </button>
        )}
      </div>

      <div className="form-group" style={{ marginTop: 16 }}>
        <label>Daily study reminder</label>
        <div className="time-presets">
          {[
            { label: 'Morning', icon: '🌅', time: '09:00' },
            { label: 'Afternoon', icon: '☀️', time: '14:00' },
            { label: 'Evening', icon: '🌙', time: '20:00' },
          ].map(preset => (
            <button
              key={preset.time}
              className={`time-preset-btn ${reminderTime === preset.time ? 'active' : ''}`}
              onClick={() => handleTimeChange({ target: { value: preset.time }})}
            >
              <span>{preset.icon}</span>
              {preset.label}
            </button>
          ))}
          <div className={`time-custom-input ${reminderTime && !['09:00', '14:00', '20:00'].includes(reminderTime) ? 'active' : ''}`}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>⏱️ Custom:</span>
            <input 
              type="time" 
              value={reminderTime} 
              onChange={handleTimeChange}
            />
          </div>
        </div>
        <div className="muted text-xs" style={{ marginTop: 6 }}>
          Set a time to get a daily reminder to log your study session.
        </div>
      </div>
    </div>
  );
}
