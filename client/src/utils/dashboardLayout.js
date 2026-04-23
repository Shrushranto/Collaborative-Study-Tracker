export const DEFAULT_LAYOUT = [
  { id: 'timer', span: 1 },
  { id: 'leaderboard', span: 1 },
  { id: 'calendar', span: 1 },
  { id: 'sessions', span: 1 }
];

export function loadLayout() {
  const saved = localStorage.getItem('study-tracker-layout');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Migrate old array of strings
        if (parsed.length > 0 && typeof parsed[0] === 'string') {
          return parsed.map(id => ({ id, span: 1 }));
        }
        // Basic validation
        if (parsed.length === DEFAULT_LAYOUT.length && parsed[0].id) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse layout', e);
    }
  }
  return DEFAULT_LAYOUT;
}

export function saveLayout(layout) {
  localStorage.setItem('study-tracker-layout', JSON.stringify(layout));
}

export function resetLayout() {
  localStorage.removeItem('study-tracker-layout');
}
