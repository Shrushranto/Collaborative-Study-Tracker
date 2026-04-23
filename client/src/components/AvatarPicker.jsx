import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  PRESET_AVATARS,
  AVATAR_STYLES,
  avatarUrl,
  randomSeed,
  buildDicebearAvatar,
} from '../utils/avatars.js';
import Avatar from './Avatar.jsx';

const TABS = [
  { id: 'presets', label: 'Presets' },
  { id: 'create',  label: 'Create your own' },
  { id: 'upload',  label: 'Upload' },
];

const PRESET_THEMES = ['Cartoon', 'Anime', 'Adventure', 'Pixel', 'Robot'];

const MAX_UPLOAD_BYTES = 700 * 1024;
const TARGET_DIMENSION = 256;

function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = TARGET_DIMENSION;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const out = canvas.toDataURL('image/jpeg', 0.85);
        const approxBytes = Math.ceil((out.length * 3) / 4);
        if (approxBytes > MAX_UPLOAD_BYTES) {
          reject(new Error('Image is too large even after compression'));
          return;
        }
        resolve(out);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function AvatarPicker({ name, currentAvatar, onSelect, onCancel }) {
  const [tab, setTab] = useState('presets');
  const [selected, setSelected] = useState(currentAvatar || '');
  const [style, setStyle] = useState('avataaars');
  const [seed, setSeed] = useState(() => randomSeed());
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (tab === 'create') {
      setSelected(buildDicebearAvatar(style, seed));
    }
  }, [tab, style, seed]);

  async function handleFileChange(e) {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await resizeImageFile(file);
      setSelected(dataUrl);
    } catch (err) {
      setUploadError(err.message || 'Could not process image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleSave() {
    onSelect(selected || '');
  }

  function handleClear() {
    setSelected('');
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>Choose your avatar</h3>
          <button className="icon-button" onClick={onCancel} aria-label="Close">×</button>
        </div>

        <div className="avatar-preview-row">
          <Avatar name={name} avatar={selected} size="xl" />
          <div>
            <div className="text-sm muted">Preview</div>
            {selected ? (
              <button className="ghost sm" onClick={handleClear}>Use initials instead</button>
            ) : (
              <div className="text-sm muted">Initials fallback</div>
            )}
          </div>
        </div>

        <div className="modal-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`modal-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {tab === 'presets' && (
            <div className="preset-themes">
              {PRESET_THEMES.map((theme) => {
                const items = PRESET_AVATARS.filter((p) => p.theme === theme);
                if (!items.length) return null;
                return (
                  <div key={theme} className="preset-theme">
                    <div className="preset-theme-title">{theme}</div>
                    <div className="preset-grid">
                      {items.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`preset-tile ${selected === p.value ? 'selected' : ''}`}
                          onClick={() => setSelected(p.value)}
                          title={p.label}
                        >
                          <img src={avatarUrl(p.value, { size: 96 })} alt={p.label} loading="lazy" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              <p className="muted text-xs" style={{ marginTop: 8 }}>
                Procedurally generated avatars (we can't ship copyrighted characters
                like Tom &amp; Jerry or One Piece, but the styles below cover cartoon,
                anime, pixel and robot themes).
              </p>
            </div>
          )}

          {tab === 'create' && (
            <div className="create-avatar">
              <div className="form-group">
                <label>Style</label>
                <select value={style} onChange={(e) => setStyle(e.target.value)}>
                  {AVATAR_STYLES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Seed</label>
                <div className="hstack">
                  <input
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    placeholder="Any text — changes the look"
                  />
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setSeed(randomSeed())}
                  >
                    🎲 Shuffle
                  </button>
                </div>
              </div>
              <p className="muted text-xs">
                The seed deterministically generates a unique avatar in the chosen
                style. Tweak it until you find one you like.
              </p>
            </div>
          )}

          {tab === 'upload' && (
            <div className="upload-avatar">
              <p className="muted text-sm">
                Pick an image (JPG/PNG/WebP). It will be resized to 256×256 and
                stored as part of your profile.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {uploading && <p className="muted text-sm mt-2">Processing…</p>}
              {uploadError && <div className="error mt-2">{uploadError}</div>}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="secondary" onClick={onCancel}>Cancel</button>
          <button onClick={handleSave}>Save avatar</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
