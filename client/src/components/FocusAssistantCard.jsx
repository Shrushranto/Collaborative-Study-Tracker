import { useState, useEffect } from 'react';
import { PET_OPTIONS } from './FocusPet.jsx';

function dispatchPrefsChanged() {
  // Notify FocusPet in the same tab
  window.dispatchEvent(new Event('focus-pet-prefs-changed'));
}

export default function FocusAssistantCard() {
  const [enabled, setEnabled] = useState(true);
  const [intervalTime, setIntervalTime] = useState(10);
  const [petId, setPetId] = useState('owl');
  const [soundStyle, setSoundStyle] = useState('pet');

  useEffect(() => {
    const storedEnabled = localStorage.getItem('study-tracker-pet-enabled');
    const storedInterval = localStorage.getItem('study-tracker-pet-interval');
    const storedPet = localStorage.getItem('study-tracker-pet-type');
    const storedSound = localStorage.getItem('study-tracker-pet-sound');
    if (storedEnabled !== null) setEnabled(storedEnabled !== 'false');
    if (storedInterval !== null) setIntervalTime(Number(storedInterval) || 10);
    if (storedPet) setPetId(storedPet);
    if (storedSound) setSoundStyle(storedSound);
  }, []);

  function handleEnabledChange(e) {
    const checked = e.target.checked;
    setEnabled(checked);
    localStorage.setItem('study-tracker-pet-enabled', checked.toString());
    dispatchPrefsChanged();
  }

  function handleIntervalChange(val) {
    setIntervalTime(val);
    localStorage.setItem('study-tracker-pet-interval', val.toString());
    dispatchPrefsChanged();
  }

  function handlePetChange(id) {
    setPetId(id);
    localStorage.setItem('study-tracker-pet-type', id);
    dispatchPrefsChanged();
  }

  function handleSoundStyleChange(style) {
    setSoundStyle(style);
    localStorage.setItem('study-tracker-pet-sound', style);
    dispatchPrefsChanged();
  }

  const selectedPet = PET_OPTIONS.find((p) => p.id === petId) || PET_OPTIONS[0];

  return (
    <div className="card">
      <h3 className="card-title">Focus Assistant</h3>
      <p className="muted text-sm" style={{ marginBottom: 16 }}>
        A companion that pops up to keep you motivated while a study session is running.
      </p>

      <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <label className="cute-toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleEnabledChange}
          />
          <span className="cute-toggle-slider"></span>
        </label>
        <span style={{ margin: 0, fontWeight: 500 }}>Enable Focus Pet</span>
      </div>

      {enabled && (
        <>
          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Choose your pet</label>
            <div className="hstack" style={{ gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {PET_OPTIONS.map((pet) => (
                <button
                  key={pet.id}
                  className={`pet-option-btn ${petId === pet.id ? 'active' : ''}`}
                  onClick={() => handlePetChange(pet.id)}
                  title={pet.name}
                >
                  <span style={{ fontSize: '1.5rem' }}>{pet.emoji}</span>
                  <span className="text-xs" style={{ marginTop: 2 }}>{pet.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sound Style */}
          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Notification sound</label>
            <div className="hstack" style={{ gap: 8, marginTop: 8 }}>
              <button
                className={`time-preset-btn ${soundStyle === 'default' ? 'active' : ''}`}
                onClick={() => handleSoundStyleChange('default')}
              >
                <span>🔔</span> Default
              </button>
              <button
                className={`time-preset-btn ${soundStyle === 'pet' ? 'active' : ''}`}
                onClick={() => handleSoundStyleChange('pet')}
              >
                <span>{PET_OPTIONS.find(p => p.id === petId)?.emoji || '🦉'}</span> Pet sound
              </button>
            </div>
            <p className="muted text-xs" style={{ marginTop: 6 }}>
              {soundStyle === 'pet'
                ? `${PET_OPTIONS.find(p => p.id === petId)?.name || 'Owl'} has its own unique sound!`
                : 'A simple classic notification tone.'}
            </p>
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Appearance interval</label>
            <div className="hstack" style={{ gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {[5, 10, 15, 30, 60].map((mins) => (
                <button
                  key={mins}
                  className={`secondary ${intervalTime === mins ? 'active' : ''}`}
                  onClick={() => handleIntervalChange(mins)}
                  style={intervalTime === mins ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          <div className="hstack" style={{ marginTop: 20, gap: 12, alignItems: 'center' }}>
            <div className="focus-pet-card" style={{ position: 'static', animation: 'none', flex: 1 }}>
              <div className="focus-pet-avatar" style={{ animation: 'none' }}>{selectedPet.emoji}</div>
              <div className="focus-pet-message">You're doing great! Keep going 🚀</div>
            </div>
            <button
              className="secondary"
              style={{ flexShrink: 0 }}
              onClick={() => window.dispatchEvent(new Event('focus-pet-preview'))}
              title="Preview the pop-up right now"
            >
              Preview
            </button>
          </div>
        </>
      )}
    </div>
  );
}
