import { useEffect, useRef, useState } from 'react';
import { useTimer } from '../context/TimerContext.jsx';

const MESSAGES = [
  "Are you still there? 👀",
  "Only a few minutes left, you can do it! 💪",
  "Take a deep breath, stay focused 🧘",
  "You're doing great! Keep going 🚀",
  "Stay on track! You got this! 🎯",
  "Small steps lead to big results 📈",
  "Your future self will thank you 🙌",
  "Focus is the key to unlock your potential 🔑",
  "Keep that momentum going! ⚡",
  "Don't stop until you're proud 🌟",
  "One task at a time, you're crushing it! 🔨",
  "Believe in yourself, you're a star! ⭐",
  "Almost there — keep pushing! 🏁",
  "No distractions, just progress! 🎓",
];

export const PET_OPTIONS = [
  { id: 'owl',   emoji: '🦉', name: 'Owl' },
  { id: 'dog',   emoji: '🐶', name: 'Dog' },
  { id: 'cat',   emoji: '🐱', name: 'Cat' },
  { id: 'fox',   emoji: '🦊', name: 'Fox' },
  { id: 'panda', emoji: '🐼', name: 'Panda' },
  { id: 'robot', emoji: '🤖', name: 'Robot' },
];

function loadPrefs() {
  return {
    enabled: localStorage.getItem('study-tracker-pet-enabled') !== 'false',
    intervalMinutes: Number(localStorage.getItem('study-tracker-pet-interval')) || 10,
    petId: localStorage.getItem('study-tracker-pet-type') || 'owl',
    soundStyle: localStorage.getItem('study-tracker-pet-sound') || 'pet',
  };
}

function randomMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

// ── Sound synthesis helpers ────────────────────────────────────────────────

function playDefaultSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.6);
    setTimeout(() => ctx.close(), 1000);
  } catch { /* ignore */ }
}

// Dog: two sharp "woof" barks — sawtooth with bandpass filter + pitch drop
function playDogSound(ctx) {
  [0, 0.28].forEach(offset => {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = 'bandpass'; filter.frequency.value = 700; filter.Q.value = 1.2;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, ctx.currentTime + offset);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + offset + 0.14);
    gain.gain.setValueAtTime(0, ctx.currentTime + offset);
    gain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + offset + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.2);
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime + offset); osc.stop(ctx.currentTime + offset + 0.22);
  });
}

// Cat: classic rising-then-falling meow — sine with vibrato LFO
function playCatSound(ctx) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 5; lfoGain.gain.value = 18;
  lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(380, ctx.currentTime + 0.04);
  osc.frequency.linearRampToValueAtTime(780, ctx.currentTime + 0.28);
  osc.frequency.linearRampToValueAtTime(460, ctx.currentTime + 0.72);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.28, ctx.currentTime + 0.62);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.88);
  osc.connect(gain); gain.connect(ctx.destination);
  lfo.start(ctx.currentTime); osc.start(ctx.currentTime);
  lfo.stop(ctx.currentTime + 0.92); osc.stop(ctx.currentTime + 0.92);
}

// Owl: two soft "hoo" notes with vibrato
function playOwlSound(ctx) {
  [0, 0.52].forEach((offset, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 5; lfoGain.gain.value = 7;
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
    osc.type = 'sine';
    osc.frequency.value = i === 0 ? 310 : 275;
    gain.gain.setValueAtTime(0, ctx.currentTime + offset);
    gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + offset + 0.06);
    gain.gain.setValueAtTime(0.22, ctx.currentTime + offset + 0.26);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.42);
    osc.connect(gain); gain.connect(ctx.destination);
    lfo.start(ctx.currentTime + offset); osc.start(ctx.currentTime + offset);
    lfo.stop(ctx.currentTime + offset + 0.46); osc.stop(ctx.currentTime + offset + 0.46);
  });
}

// Fox: sharp ascending yip — sawtooth with fast pitch sweep
function playFoxSound(ctx) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass'; filter.frequency.value = 1000; filter.Q.value = 1;
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(550, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + 0.07);
  osc.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 0.22);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.38, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
  osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
}

// Panda: low grunting rumble — sawtooth through low-pass filter
function playPandaSound(ctx) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  filter.type = 'lowpass'; filter.frequency.value = 450;
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(130, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(95, ctx.currentTime + 0.35);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.32, ctx.currentTime + 0.22);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.52);
  osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.56);
}

// Robot: three descending electronic blips — square wave
function playRobotSound(ctx) {
  [[0, 1100], [0.18, 880], [0.32, 660]].forEach(([offset, freq]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, ctx.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.13);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime + offset); osc.stop(ctx.currentTime + offset + 0.14);
  });
}

const PET_SOUND_FNS = {
  dog: playDogSound, cat: playCatSound, owl: playOwlSound,
  fox: playFoxSound, panda: playPandaSound, robot: playRobotSound,
};

function playPopSound(petId = 'owl') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const fn = PET_SOUND_FNS[petId] || playOwlSound;
    fn(ctx);
    setTimeout(() => ctx.close(), 2000);
  } catch { /* ignore if Web Audio unavailable */ }
}

export default function FocusPet() {
  const { seconds, running, targetSeconds } = useTimer();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [prefs, setPrefs] = useState(loadPrefs);

  // Always-current ref so stale closures inside effects read the latest prefs
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  // Track which second last triggered so we never double-fire on re-renders
  const lastFiredSecRef = useRef(-1);
  const dismissRef = useRef(null);

  // Re-read prefs on same-tab or cross-tab changes
  useEffect(() => {
    function onPrefsChanged() { setPrefs(loadPrefs()); }
    window.addEventListener('storage', onPrefsChanged);
    window.addEventListener('focus-pet-prefs-changed', onPrefsChanged);
    return () => {
      window.removeEventListener('storage', onPrefsChanged);
      window.removeEventListener('focus-pet-prefs-changed', onPrefsChanged);
    };
  }, []);

  // Preview event — fires instantly without needing the timer running
  useEffect(() => {
    function onPreview() { show(randomMessage()); }
    window.addEventListener('focus-pet-preview', onPreview);
    return () => window.removeEventListener('focus-pet-preview', onPreview);
  }, []);

  // Hide when timer stops or pet is disabled
  useEffect(() => {
    if (!running || !prefs.enabled) {
      clearTimeout(dismissRef.current);
      setVisible(false);
      lastFiredSecRef.current = -1;
    }
  }, [running, prefs.enabled]);

  // Watch the timer's exact second count and fire at precise interval marks
  useEffect(() => {
    if (!running || !prefs.enabled || seconds <= 0) return;
    if (lastFiredSecRef.current === seconds) return; // already handled this second

    const intervalSec = prefs.intervalMinutes * 60;

    // Fire at every exact interval mark (5:00, 10:00, 15:00 …)
    if (seconds % intervalSec === 0) {
      lastFiredSecRef.current = seconds;
      show(randomMessage());
      return;
    }

    // Fire once when exactly 1 minute remains before the goal
    if (targetSeconds > 0 && targetSeconds - seconds === 60) {
      lastFiredSecRef.current = seconds;
      show("⏰ 1 minute left to reach your goal! Finish strong!");
    }
  }, [seconds, running, prefs.enabled, prefs.intervalMinutes, targetSeconds]);

  function show(msg) {
    const p = prefsRef.current;
    if (p.soundStyle === 'default') {
      playDefaultSound();
    } else {
      playPopSound(p.petId);
    }
    setMessage(msg);
    setVisible(true);
    clearTimeout(dismissRef.current);
    dismissRef.current = setTimeout(() => setVisible(false), 8000);
  }

  if (!visible || !prefs.enabled) return null;

  const pet = PET_OPTIONS.find((p) => p.id === prefs.petId) || PET_OPTIONS[0];

  return (
    <div className="focus-pet">
      <div className="focus-pet-card">
        <button
          className="focus-pet-dismiss"
          onClick={() => { clearTimeout(dismissRef.current); setVisible(false); }}
          title="Dismiss"
        >
          ×
        </button>
        <div className="focus-pet-avatar">{pet.emoji}</div>
        <div className="focus-pet-message">{message}</div>
      </div>
    </div>
  );
}

/**
 * FocusPetPortal - renders the pet directly inside the focus-mode overlay.
 * Mirrors FocusPet state but renders inline (not fixed-position) so z-index
 * inside the overlay stacking context works correctly.
 */
export function FocusPetPortal() {
  const { seconds, running, targetSeconds } = useTimer();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [prefs, setPrefs] = useState(loadPrefs);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const lastFiredSecRef = useRef(-1);
  const dismissRef = useRef(null);

  useEffect(() => {
    function onPrefsChanged() { setPrefs(loadPrefs()); }
    window.addEventListener('storage', onPrefsChanged);
    window.addEventListener('focus-pet-prefs-changed', onPrefsChanged);
    return () => {
      window.removeEventListener('storage', onPrefsChanged);
      window.removeEventListener('focus-pet-prefs-changed', onPrefsChanged);
    };
  }, []);

  useEffect(() => {
    function onPreview() { show(randomMessage()); }
    window.addEventListener('focus-pet-preview', onPreview);
    return () => window.removeEventListener('focus-pet-preview', onPreview);
  }, []);

  useEffect(() => {
    if (!running || !prefs.enabled) {
      clearTimeout(dismissRef.current);
      setVisible(false);
      lastFiredSecRef.current = -1;
    }
  }, [running, prefs.enabled]);

  useEffect(() => {
    if (!running || !prefs.enabled || seconds <= 0) return;
    if (lastFiredSecRef.current === seconds) return;
    const intervalSec = prefs.intervalMinutes * 60;
    if (seconds % intervalSec === 0) {
      lastFiredSecRef.current = seconds;
      show(randomMessage());
      return;
    }
    if (targetSeconds > 0 && targetSeconds - seconds === 60) {
      lastFiredSecRef.current = seconds;
      show("⏰ 1 minute left to reach your goal! Finish strong!");
    }
  }, [seconds, running, prefs.enabled, prefs.intervalMinutes, targetSeconds]);

  function show(msg) {
    const p = prefsRef.current;
    if (p.soundStyle === 'default') {
      playDefaultSound();
    } else {
      playPopSound(p.petId);
    }
    setMessage(msg);
    setVisible(true);
    clearTimeout(dismissRef.current);
    dismissRef.current = setTimeout(() => setVisible(false), 8000);
  }

  if (!visible || !prefs.enabled) return null;

  const pet = PET_OPTIONS.find((p) => p.id === prefs.petId) || PET_OPTIONS[0];

  return (
    <div style={{ position: 'absolute', bottom: 24, right: 24, zIndex: 10 }}>
      <div className="focus-pet-card">
        <button
          className="focus-pet-dismiss"
          onClick={() => { clearTimeout(dismissRef.current); setVisible(false); }}
          title="Dismiss"
        >
          ×
        </button>
        <div className="focus-pet-avatar">{pet.emoji}</div>
        <div className="focus-pet-message">{message}</div>
      </div>
    </div>
  );
}
