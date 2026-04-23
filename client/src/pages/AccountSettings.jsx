import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import Avatar from '../components/Avatar.jsx';
import AvatarPicker from '../components/AvatarPicker.jsx';
import PersonalizationCard from '../components/PersonalizationCard.jsx';
import FocusAssistantCard from '../components/FocusAssistantCard.jsx';
import NotificationsCard from '../components/NotificationsCard.jsx';

const SOCIAL_FIELDS = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
  { key: 'github',   label: 'GitHub',   placeholder: 'https://github.com/...' },
  { key: 'twitter',  label: 'Twitter',  placeholder: 'https://twitter.com/...' },
  { key: 'website',  label: 'Website',  placeholder: 'https://...' },
];

export default function AccountSettings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameSubmitting, setNameSubmitting] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const [bio, setBio] = useState(user?.bio || '');
  const [bioSubmitting, setBioSubmitting] = useState(false);
  const [bioError, setBioError] = useState('');
  const [bioSuccess, setBioSuccess] = useState('');

  const [links, setLinks] = useState({
    linkedin: user?.socialLinks?.linkedin || '',
    github:   user?.socialLinks?.github   || '',
    twitter:  user?.socialLinks?.twitter  || '',
    website:  user?.socialLinks?.website  || '',
  });
  const [linksSubmitting, setLinksSubmitting] = useState(false);
  const [linksError, setLinksError] = useState('');
  const [linksSuccess, setLinksSuccess] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function handleAvatarSelected(value) {
    setAvatarError('');
    setAvatarSaving(true);
    try {
      await api.put('/auth/profile', { avatar: value });
      await refreshUser();
      setPickerOpen(false);
    } catch (err) {
      setAvatarError(err.response?.data?.message || 'Failed to update avatar');
    } finally {
      setAvatarSaving(false);
    }
  }

  async function handleSaveBio(e) {
    e.preventDefault();
    setBioError('');
    setBioSuccess('');
    if (bio.length > 280) {
      setBioError('Bio must be at most 280 characters');
      return;
    }
    setBioSubmitting(true);
    try {
      await api.put('/auth/profile', { bio });
      await refreshUser();
      setBioSuccess('Bio updated');
    } catch (err) {
      setBioError(err.response?.data?.message || 'Failed to update bio');
    } finally {
      setBioSubmitting(false);
    }
  }

  async function handleSaveLinks(e) {
    e.preventDefault();
    setLinksError('');
    setLinksSuccess('');
    setLinksSubmitting(true);
    try {
      await api.put('/auth/profile', { socialLinks: links });
      await refreshUser();
      setLinksSuccess('Links updated');
    } catch (err) {
      setLinksError(err.response?.data?.message || 'Failed to update links');
    } finally {
      setLinksSubmitting(false);
    }
  }

  async function handleUpdateName(e) {
    e.preventDefault();
    setNameError('');
    setNameSuccess('');
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Username cannot be empty');
      return;
    }
    if (trimmed === user?.name) {
      setNameSuccess('No changes to save');
      return;
    }
    setNameSubmitting(true);
    try {
      await api.put('/auth/profile', { name: trimmed });
      await refreshUser();
      setNameSuccess('Username updated');
    } catch (err) {
      setNameError(err.response?.data?.message || 'Failed to update username');
    } finally {
      setNameSubmitting(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }
    setPwSubmitting(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setPwSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPwSubmitting(false);
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    setDeleteError('');
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Type DELETE in the confirmation field to proceed');
      return;
    }
    if (!deletePassword) {
      setDeleteError('Enter your password to confirm');
      return;
    }
    if (!confirm('This will permanently delete your account and all your data. Are you sure?')) {
      return;
    }
    setDeleting(true);
    try {
      await api.delete('/auth/account', { data: { password: deletePassword } });
      logout();
      navigate('/signup');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account');
      setDeleting(false);
    }
  }

  return (
    <div className="container container-narrow">
      <div className="card">
        <h2 className="card-title">Account Settings</h2>
        <div className="hstack" style={{ gap: 18, marginBottom: 18 }}>
          <Avatar user={user} size="xl" />
          <div>
            <button onClick={() => setPickerOpen(true)} disabled={avatarSaving}>
              {avatarSaving ? 'Saving…' : 'Change avatar'}
            </button>
            <p className="muted text-xs" style={{ marginTop: 6 }}>
              Pick a preset, build a custom one, or upload your own image.
            </p>
            {avatarError && <div className="error mt-2">{avatarError}</div>}
          </div>
        </div>
        <div className="account-summary">
          <div className="account-summary-row">
            <span className="account-summary-label">Username</span>
            <span className="account-summary-value">{user?.name}</span>
          </div>
          <div className="account-summary-row">
            <span className="account-summary-label">Email</span>
            <span className="account-summary-value">{user?.email}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Bio</h3>
        <form onSubmit={handleSaveBio}>
          <div className="form-group">
            <label>About you</label>
            <textarea
              value={bio}
              onChange={(e) => { setBio(e.target.value); setBioError(''); setBioSuccess(''); }}
              maxLength={280}
              placeholder="A short description — what you study, your goals, anything you want others to know."
              rows={3}
            />
            <div className="muted text-xs" style={{ marginTop: 4, textAlign: 'right' }}>
              {bio.length}/280
            </div>
          </div>
          {bioError && <div className="error">{bioError}</div>}
          {bioSuccess && <div className="success">{bioSuccess}</div>}
          <button type="submit" disabled={bioSubmitting}>
            {bioSubmitting ? 'Saving…' : 'Save bio'}
          </button>
        </form>
      </div>

      <PersonalizationCard />

      <FocusAssistantCard />

      <NotificationsCard />

      <div className="card">
        <h3 className="card-title">Social links</h3>
        <form onSubmit={handleSaveLinks}>
          {SOCIAL_FIELDS.map((f) => (
            <div key={f.key} className="social-row">
              <label>{f.label}</label>
              <input
                type="url"
                value={links[f.key]}
                onChange={(e) => {
                  setLinks((prev) => ({ ...prev, [f.key]: e.target.value }));
                  setLinksError(''); setLinksSuccess('');
                }}
                placeholder={f.placeholder}
                maxLength={200}
              />
            </div>
          ))}
          {linksError && <div className="error">{linksError}</div>}
          {linksSuccess && <div className="success">{linksSuccess}</div>}
          <button type="submit" disabled={linksSubmitting}>
            {linksSubmitting ? 'Saving…' : 'Save links'}
          </button>
        </form>
      </div>

      {pickerOpen && (
        <AvatarPicker
          name={user?.name}
          currentAvatar={user?.avatar || ''}
          onSelect={handleAvatarSelected}
          onCancel={() => setPickerOpen(false)}
        />
      )}

      <div className="card">
        <h3 className="card-title">Username</h3>
        <form onSubmit={handleUpdateName}>
          <div className="form-group">
            <label>Display name</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setNameSuccess(''); setNameError(''); }}
              maxLength={60}
              placeholder="Your display name"
              required
            />
          </div>
          {nameError && <div className="error">{nameError}</div>}
          {nameSuccess && <div className="success">{nameSuccess}</div>}
          <button type="submit" disabled={nameSubmitting}>
            {nameSubmitting ? 'Saving…' : 'Save username'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="card-title">Change password</h3>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Current password</label>
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="form-group">
            <label>New password</label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="At least 6 characters"
            />
          </div>
          <div className="form-group">
            <label>Confirm new password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {pwError && <div className="error">{pwError}</div>}
          {pwSuccess && <div className="success">{pwSuccess}</div>}
          <button type="submit" disabled={pwSubmitting}>
            {pwSubmitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>

      <div className="card danger-zone">
        <h3 className="card-title">Delete account</h3>
        <p className="muted text-sm">
          Permanently delete your account and all study sessions, goals, and history. This cannot be undone.
        </p>
        <form onSubmit={handleDeleteAccount}>
          <div className="form-group">
            <label>Confirm your password</label>
            <PasswordInput
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="form-group">
            <label>Type <strong>DELETE</strong> to confirm</label>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
            />
          </div>
          {deleteError && <div className="error">{deleteError}</div>}
          <button type="submit" className="danger" disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete my account'}
          </button>
        </form>
      </div>
    </div>
  );
}
