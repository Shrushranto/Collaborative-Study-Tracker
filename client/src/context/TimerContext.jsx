import { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../api/axios.js';

const TimerContext = createContext(null);

const LS_KEY = 'study-tracker-timer';

export function TimerProvider({ children }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [goalId, setGoalId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [targetSeconds, setTargetSeconds] = useState(0);
  const startedAtRef = useRef(null);

  // Restore persisted timer on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const { seconds: s, running: r, subject: sub, notes: n, goalId: gi, startedAt: sa, targetSeconds: ts } = JSON.parse(raw);
      if (r && sa) {
        const elapsed = Math.floor((Date.now() - new Date(sa).getTime()) / 1000);
        setSeconds((s || 0) + elapsed);
        startedAtRef.current = new Date(sa);
        setRunning(true);
      } else {
        setSeconds(s || 0);
        if (sa) startedAtRef.current = new Date(sa);
      }
      setSubject(sub || '');
      setNotes(n || '');
      setGoalId(gi || '');
      setTargetSeconds(ts || 0);
    } catch { /* ignore parse errors */ }
  }, []);

  // Persist state on every change
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({
      seconds,
      running,
      subject,
      notes,
      goalId,
      startedAt: startedAtRef.current,
      targetSeconds,
    }));
  }, [seconds, running, subject, notes, goalId, targetSeconds]);

  // Run the interval at context level so it survives navigation
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  function start() {
    if (!startedAtRef.current) startedAtRef.current = new Date();
    setRunning(true);
    setError('');
  }

  function pause() {
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setSeconds(0);
    startedAtRef.current = null;
    setSubject('');
    setNotes('');
    setGoalId('');
    setError('');
    setTargetSeconds(0);
    localStorage.removeItem(LS_KEY);
  }

  async function save(onSuccess) {
    if (seconds < 1) {
      setError('Run the timer for at least 1 second before saving');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/sessions', {
        durationSeconds: seconds,
        subject,
        notes,
        goalId: goalId || undefined,
        startedAt: startedAtRef.current,
        endedAt: new Date(),
      });
      onSuccess?.();
      reset();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save session');
    } finally {
      setSaving(false);
    }
  }

  return (
    <TimerContext.Provider value={{
      seconds, running, subject, notes, goalId, saving, error, targetSeconds,
      setSubject, setNotes, setGoalId, setError, setTargetSeconds,
      start, pause, reset, save,
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => useContext(TimerContext);
