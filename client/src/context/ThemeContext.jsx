import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'study-tracker-theme';
const ACCENT_KEY  = 'study-tracker-accent';
const FONT_KEY    = 'study-tracker-font';

export const DEFAULT_ACCENT = '#6366f1';

export const THEME_OPTIONS = [
  { id: 'light',    label: 'Light',    icon: '☀' },
  { id: 'dark',     label: 'Dark',     icon: '☾' },
  { id: 'system',   label: 'System',   icon: '◐' },
  { id: 'sepia',    label: 'Sepia',    icon: '📜' },
  { id: 'midnight', label: 'Midnight', icon: '🌌' },
  { id: 'ocean',    label: 'Ocean',    icon: '🌊' },
  { id: 'forest',   label: 'Forest',   icon: '🌲' },
];

export const FONT_OPTIONS = [
  { id: 'system',  label: 'System default', stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  { id: 'serif',   label: 'Serif',          stack: 'Georgia, "Times New Roman", "Source Serif Pro", serif' },
  { id: 'mono',    label: 'Monospace',      stack: '"JetBrains Mono", "Fira Code", Menlo, Consolas, monospace' },
  { id: 'rounded', label: 'Rounded',        stack: '"Nunito", "Quicksand", system-ui, sans-serif' },
];

export const ACCENT_PRESETS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6',
];

function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(pref) {
  return pref === 'system' ? getSystemTheme() : pref;
}

function clamp(n) { return Math.max(0, Math.min(255, n)); }

function shadeHex(hex, delta) {
  const h = hex.replace('#', '');
  const r = clamp(parseInt(h.slice(0, 2), 16) + delta);
  const g = clamp(parseInt(h.slice(2, 4), 16) + delta);
  const b = clamp(parseInt(h.slice(4, 6), 16) + delta);
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyAll(pref, accent, fontId) {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(pref);

  if (accent && /^#[0-9a-fA-F]{6}$/.test(accent) && accent.toLowerCase() !== DEFAULT_ACCENT) {
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-hover', shadeHex(accent, -20));
    root.style.setProperty('--accent-soft', hexToRgba(accent, 0.15));
  } else {
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-hover');
    root.style.removeProperty('--accent-soft');
  }

  const font = FONT_OPTIONS.find((f) => f.id === fontId) || FONT_OPTIONS[0];
  root.style.setProperty('--font-family', font.stack);
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    return localStorage.getItem(STORAGE_KEY) || 'system';
  });
  const [accent, setAccent] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_ACCENT;
    return localStorage.getItem(ACCENT_KEY) || DEFAULT_ACCENT;
  });
  const [fontId, setFontId] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    return localStorage.getItem(FONT_KEY) || 'system';
  });

  useEffect(() => {
    applyAll(preference, accent, fontId);
    localStorage.setItem(STORAGE_KEY, preference);
    localStorage.setItem(ACCENT_KEY, accent);
    localStorage.setItem(FONT_KEY, fontId);
  }, [preference, accent, fontId]);

  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyAll('system', accent, fontId);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference, accent, fontId]);

  const value = {
    preference,
    theme: resolveTheme(preference),
    accent,
    fontId,
    setPreference,
    setAccent,
    setFontId,
    resetAccent: () => setAccent(DEFAULT_ACCENT),
    resetFont: () => setFontId('system'),
    cycleTheme() {
      const ids = THEME_OPTIONS.map((t) => t.id);
      const idx = ids.indexOf(preference);
      setPreference(ids[(idx + 1) % ids.length]);
    },
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
