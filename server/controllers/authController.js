import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Goal from '../models/Goal.js';
import StudySession from '../models/StudySession.js';

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export async function signup(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const user = await User.create({ name, email, password });
  res.status(201).json({ user, token: signToken(user._id) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  res.json({ user, token: signToken(user._id) });
}

export async function me(req, res) {
  res.json({ user: req.user });
}

const SOCIAL_KEYS = ['linkedin', 'github', 'twitter', 'website'];
const MAX_AVATAR_BYTES = 1024 * 1024; // 1 MB after base64 decode budget

export async function updateProfile(req, res) {
  const { name, bio, avatar, socialLinks } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const trimmed = name.trim();
    if (trimmed.length > 60) {
      return res.status(400).json({ message: 'Name is too long (max 60 characters)' });
    }
    user.name = trimmed;
  }

  if (bio !== undefined) {
    if (typeof bio !== 'string') {
      return res.status(400).json({ message: 'Bio must be a string' });
    }
    if (bio.length > 280) {
      return res.status(400).json({ message: 'Bio is too long (max 280 characters)' });
    }
    user.bio = bio;
  }

  if (avatar !== undefined) {
    if (typeof avatar !== 'string') {
      return res.status(400).json({ message: 'Avatar must be a string' });
    }
    if (avatar.startsWith('data:image/')) {
      const approxBytes = Math.ceil((avatar.length * 3) / 4);
      if (approxBytes > MAX_AVATAR_BYTES) {
        return res.status(413).json({ message: 'Avatar image too large (max ~1 MB)' });
      }
    }
    user.avatar = avatar;
  }

  if (socialLinks !== undefined) {
    if (typeof socialLinks !== 'object' || socialLinks === null) {
      return res.status(400).json({ message: 'socialLinks must be an object' });
    }
    user.socialLinks = user.socialLinks || {};
    for (const key of SOCIAL_KEYS) {
      if (socialLinks[key] !== undefined) {
        if (typeof socialLinks[key] !== 'string') {
          return res.status(400).json({ message: `${key} must be a string` });
        }
        const v = socialLinks[key].trim();
        if (v.length > 200) {
          return res.status(400).json({ message: `${key} URL is too long` });
        }
        user.socialLinks[key] = v;
      }
    }
  }

  await user.save();
  res.json({ user });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both passwords are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }
  const user = await User.findById(req.user._id);
  const ok = await user.comparePassword(currentPassword);
  if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
}

export async function updatePublicKey(req, res) {
  const { publicKey } = req.body;
  if (!publicKey || typeof publicKey !== 'string') {
    return res.status(400).json({ message: 'publicKey is required' });
  }
  await User.findByIdAndUpdate(req.user._id, { publicKey });
  res.json({ message: 'Public key updated' });
}

export async function deleteAccount(req, res) {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'Password is required to delete account' });

  const user = await User.findById(req.user._id);
  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Password is incorrect' });

  await StudySession.deleteMany({ user: req.user._id });
  await Goal.deleteMany({ user: req.user._id });
  await User.findByIdAndDelete(req.user._id);

  res.json({ message: 'Account deleted' });
}
