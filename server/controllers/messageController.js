import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getIO } from '../socket.js';

async function isMutualFollow(meId, otherId) {
  const me = await User.findById(meId, 'following');
  const other = await User.findById(otherId, 'following');
  if (!me || !other) return false;
  const meFollowsOther = me.following.some((id) => String(id) === String(otherId));
  const otherFollowsMe = other.following.some((id) => String(id) === String(meId));
  return meFollowsOther && otherFollowsMe;
}

export async function listConversations(req, res) {
  const meId = new mongoose.Types.ObjectId(req.user._id);

  const threads = await Message.aggregate([
    { $match: { $or: [{ from: meId }, { to: meId }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [{ $eq: ['$from', meId] }, '$to', '$from'],
        },
        lastMessage: { $first: '$$ROOT' },
        unread: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$to', meId] }, { $eq: ['$readAt', null] }] },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
    { $limit: 50 },
  ]);

  const otherIds = threads.map((t) => t._id);
  const users = await User.find({ _id: { $in: otherIds } }, 'name avatar bio publicKey').lean();
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

  const conversations = threads.map((t) => ({
    user: userMap[String(t._id)] && {
      _id: userMap[String(t._id)]._id,
      name: userMap[String(t._id)].name,
      avatar: userMap[String(t._id)].avatar || '',
    },
    lastMessage: {
      _id: t.lastMessage._id,
      text: t.lastMessage.text,
      encrypted: t.lastMessage.encrypted,
      iv: t.lastMessage.iv,
      from: t.lastMessage.from,
      to: t.lastMessage.to,
      createdAt: t.lastMessage.createdAt,
      readAt: t.lastMessage.readAt,
      mine: String(t.lastMessage.from) === String(req.user._id),
    },
    unread: t.unread,
  })).filter((c) => c.user);

  res.json({ conversations });
}

export async function getThread(req, res) {
  const otherId = req.params.userId;
  if (!mongoose.isValidObjectId(otherId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }
  const other = await User.findById(otherId, 'name avatar bio publicKey');
  if (!other) return res.status(404).json({ message: 'User not found' });

  const meId = req.user._id;
  const mutual = await isMutualFollow(meId, otherId);

  const messages = await Message.find({
    $or: [
      { from: meId, to: otherId },
      { from: otherId, to: meId },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(500)
    .lean();

  // Mark incoming messages as read
  await Message.updateMany(
    { from: otherId, to: meId, readAt: null },
    { $set: { readAt: new Date() } }
  );

  res.json({
    user: { _id: other._id, name: other.name, avatar: other.avatar || '', bio: other.bio || '', publicKey: other.publicKey },
    canMessage: mutual,
    messages: messages.map((m) => ({
      _id: m._id,
      text: m.text,
      encrypted: m.encrypted,
      iv: m.iv,
      from: m.from,
      to: m.to,
      createdAt: m.createdAt,
      readAt: m.readAt,
      mine: String(m.from) === String(meId),
    })),
  });
}

export async function sendMessage(req, res) {
  const otherId = req.params.userId;
  if (!mongoose.isValidObjectId(otherId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }
  const text = (req.body?.text ?? '').toString().trim();
  const encrypted = Boolean(req.body?.encrypted);
  const iv = req.body?.iv ? String(req.body.iv) : null;

  if (!text) return res.status(400).json({ message: 'Message cannot be empty' });
  if (text.length > 5000) return res.status(400).json({ message: 'Message too long (max 5000 chars)' });

  if (String(otherId) === String(req.user._id)) {
    return res.status(400).json({ message: 'You cannot message yourself' });
  }

  const other = await User.findById(otherId);
  if (!other) return res.status(404).json({ message: 'User not found' });

  const mutual = await isMutualFollow(req.user._id, otherId);
  if (!mutual) {
    return res.status(403).json({ message: 'You can only message users who follow you back' });
  }

  const msg = await Message.create({ from: req.user._id, to: otherId, text, encrypted, iv });

  const payload = {
    _id: msg._id,
    text: msg.text,
    encrypted: msg.encrypted,
    from: msg.from,
    to: msg.to,
    createdAt: msg.createdAt,
    readAt: msg.readAt,
  };
  getIO()?.to(`user:${otherId}`).emit('new_message', { ...payload, mine: false });

  res.status(201).json({ message: { ...payload, mine: true } });
}

export async function unreadCount(req, res) {
  const count = await Message.countDocuments({ to: req.user._id, readAt: null });
  res.json({ count });
}
