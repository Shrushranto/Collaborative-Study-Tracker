import mongoose from 'mongoose';
import GroupSession from '../models/GroupSession.js';
import User from '../models/User.js';
import StudySession from '../models/StudySession.js';

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function uniqueCode() {
  for (let i = 0; i < 8; i++) {
    const code = genCode();
    const exists = await GroupSession.exists({ code });
    if (!exists) return code;
  }
  return Date.now().toString(36).toUpperCase().slice(-6);
}

function shape(s, meId) {
  return {
    _id: s._id,
    name: s.name,
    description: s.description,
    code: s.code,
    goalMinutes: s.goalMinutes,
    status: s.status,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    host: s.host && {
      _id: s.host._id,
      name: s.host.name,
      avatar: s.host.avatar || '',
    },
    isHost: s.host && String(s.host._id) === String(meId),
    members: (s.members || [])
      .filter((m) => m.user)
      .map((m) => ({
        _id: m.user._id,
        name: m.user.name,
        avatar: m.user.avatar || '',
        joinedAt: m.joinedAt,
        secondsContributed: m.secondsContributed || 0,
        isStudying: !!m.isStudying,
        isMe: String(m.user._id) === String(meId),
      })),
    totalSeconds: (s.members || []).reduce((a, m) => a + (m.secondsContributed || 0), 0),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

async function loadShaped(id, meId) {
  const s = await GroupSession.findById(id)
    .populate('host', 'name avatar')
    .populate('members.user', 'name avatar')
    .lean();
  return s ? shape(s, meId) : null;
}

export async function createGroupSession(req, res) {
  const name = (req.body?.name || '').toString().trim();
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const description = (req.body?.description || '').toString().trim().slice(0, 280);
  const goalMinutes = Math.max(1, Math.min(600, Number(req.body?.goalMinutes) || 60));

  const code = await uniqueCode();
  const session = await GroupSession.create({
    name: name.slice(0, 80),
    description,
    goalMinutes,
    host: req.user._id,
    code,
    members: [{ user: req.user._id, joinedAt: new Date() }],
  });

  const shaped = await loadShaped(session._id, req.user._id);
  res.status(201).json({ session: shaped });
}

export async function listMyGroupSessions(req, res) {
  const meId = req.user._id;
  const docs = await GroupSession.find({
    $or: [{ host: meId }, { 'members.user': meId }],
    status: { $in: ['waiting', 'active'] },
  })
    .sort({ updatedAt: -1 })
    .populate('host', 'name avatar')
    .populate('members.user', 'name avatar')
    .lean();
  res.json({ sessions: docs.map((s) => shape(s, meId)) });
}

export async function getGroupSession(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const shaped = await loadShaped(id, req.user._id);
  if (!shaped) return res.status(404).json({ message: 'Group session not found' });
  res.json({ session: shaped });
}

export async function joinGroupSession(req, res) {
  const code = (req.body?.code || '').toString().trim().toUpperCase();
  const id = (req.body?.id || '').toString().trim();
  let session = null;
  if (code) session = await GroupSession.findOne({ code });
  else if (mongoose.isValidObjectId(id)) session = await GroupSession.findById(id);
  if (!session) return res.status(404).json({ message: 'Group session not found' });
  if (session.status === 'ended') {
    return res.status(400).json({ message: 'Session has already ended' });
  }

  const meId = req.user._id;
  const already = session.members.some((m) => String(m.user) === String(meId));
  if (!already) {
    session.members.push({ user: meId, joinedAt: new Date() });
    await session.save();
  }
  const shaped = await loadShaped(session._id, meId);
  res.json({ session: shaped });
}

export async function leaveGroupSession(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const session = await GroupSession.findById(id);
  if (!session) return res.status(404).json({ message: 'Not found' });
  const meId = req.user._id;
  if (String(session.host) === String(meId)) {
    return res.status(400).json({ message: 'Host cannot leave; end the session instead' });
  }
  session.members = session.members.filter((m) => String(m.user) !== String(meId));
  await session.save();
  res.json({ ok: true });
}

export async function startGroupSession(req, res) {
  const { id } = req.params;
  const s = await GroupSession.findById(id);
  if (!s) return res.status(404).json({ message: 'Not found' });
  if (String(s.host) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the host can start' });
  }
  s.status = 'active';
  s.startedAt = s.startedAt || new Date();
  await s.save();
  const shaped = await loadShaped(s._id, req.user._id);
  res.json({ session: shaped });
}

export async function endGroupSession(req, res) {
  const { id } = req.params;
  const s = await GroupSession.findById(id);
  if (!s) return res.status(404).json({ message: 'Not found' });
  if (String(s.host) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the host can end' });
  }
  s.status = 'ended';
  s.endedAt = new Date();

  for (const m of s.members) {
    const seconds = Math.floor(m.secondsContributed || 0);
    if (seconds >= 60) {
      await StudySession.create({
        user: m.user,
        durationSeconds: seconds,
        subject: `Group: ${s.name}`,
        notes: `Collaborative session (code ${s.code})`,
        startedAt: s.startedAt || new Date(Date.now() - seconds * 1000),
        endedAt: new Date(),
      });
      await User.findByIdAndUpdate(m.user, { $inc: { totalSeconds: seconds } });
    }
    m.isStudying = false;
    m.lastTickAt = null;
  }
  await s.save();
  const shaped = await loadShaped(s._id, req.user._id);
  res.json({ session: shaped });
}

export async function inviteByName(req, res) {
  const { id } = req.params;
  const queryRaw = (req.body?.query || '').toString().trim();
  if (!queryRaw) return res.status(400).json({ message: 'Provide a username, email, or user id' });
  const s = await GroupSession.findById(id);
  if (!s) return res.status(404).json({ message: 'Not found' });
  if (String(s.host) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the host can invite' });
  }
  if (s.status === 'ended') return res.status(400).json({ message: 'Session ended' });

  let target = null;
  if (mongoose.isValidObjectId(queryRaw)) {
    target = await User.findById(queryRaw, 'name email avatar');
  }
  if (!target) {
    target = await User.findOne(
      {
        $or: [
          { name: { $regex: `^${queryRaw}$`, $options: 'i' } },
          { email: queryRaw.toLowerCase() },
        ],
      },
      'name email avatar'
    );
  }
  if (!target) return res.status(404).json({ message: 'User not found' });

  const already = s.members.some((m) => String(m.user) === String(target._id));
  if (!already) {
    s.members.push({ user: target._id, joinedAt: new Date() });
    await s.save();
  }
  const shaped = await loadShaped(s._id, req.user._id);
  res.json({ session: shaped, invited: { _id: target._id, name: target.name } });
}

export async function tick(req, res) {
  const { id } = req.params;
  const studying = req.body?.studying !== false;
  const s = await GroupSession.findById(id);
  if (!s) return res.status(404).json({ message: 'Not found' });
  if (s.status !== 'active') {
    return res.status(400).json({ message: 'Session is not active' });
  }
  const meId = String(req.user._id);
  const member = s.members.find((m) => String(m.user) === meId);
  if (!member) return res.status(403).json({ message: 'Not a member' });

  const now = Date.now();
  if (member.isStudying && member.lastTickAt) {
    const elapsedMs = now - new Date(member.lastTickAt).getTime();
    const elapsed = Math.max(0, Math.min(60, Math.floor(elapsedMs / 1000)));
    member.secondsContributed = (member.secondsContributed || 0) + elapsed;
  }
  member.isStudying = !!studying;
  member.lastTickAt = studying ? new Date(now) : null;
  await s.save();
  const shaped = await loadShaped(s._id, req.user._id);
  res.json({ session: shaped });
}
