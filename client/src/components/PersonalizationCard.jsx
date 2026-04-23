import {
  useTheme,
  THEME_OPTIONS,
  FONT_OPTIONS,
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
} from '../context/ThemeContext.jsx';

export default function PersonalizationCard() {
  const {
    preference, setPreference,
    accent, setAccent, resetAccent,
    fontId, setFontId,
  } = useTheme();

  return (
    <div className="card">
      <h3 className="card-title">Personalization</h3>
      <p className="muted text-sm" style={{ marginTop: -4 }}>
        Make Study Buddy yours — pick a theme, accent color, and font.
      </p>

      <div className="form-group">
        <label>Theme</label>
        <div className="theme-grid">
          {THEME_OPTIONS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`theme-tile theme-tile-${t.id} ${preference === t.id ? 'active' : ''}`}
              onClick={() => setPreference(t.id)}
              title={t.label}
            >
              <span className="theme-tile-icon" aria-hidden="true">{t.icon}</span>
              <span className="theme-tile-label">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Accent color</label>
        <div className="accent-row">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              className={`accent-swatch ${accent.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => setAccent(c)}
              title={c}
              aria-label={`Accent color ${c}`}
            />
          ))}
          <label className="accent-custom" title="Custom color">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
            />
            <span aria-hidden="true">🎨</span>
          </label>
          {accent.toLowerCase() !== DEFAULT_ACCENT.toLowerCase() && (
            <button type="button" className="ghost sm" onClick={resetAccent}>
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Font style</label>
        <div className="font-grid">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`font-tile ${fontId === f.id ? 'active' : ''}`}
              onClick={() => setFontId(f.id)}
              style={{ fontFamily: f.stack }}
            >
              <span className="font-tile-name">{f.label}</span>
              <span className="font-tile-sample">Aa Bb Cc 123</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
