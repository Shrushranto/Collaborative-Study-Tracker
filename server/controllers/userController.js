import mongoose from 'mongoose';
import User from '../models/User.js';
import Goal from '../models/Goal.js';
import StudySession from '../models/StudySession.js';

export async function leaderboard(req, res) {
  // Group users by goal target hours; if a user has multiple goals, they appear in each tier.
  const goals = await Goal.find().populate('user', 'name email totalSeconds').lean();

  const tiersMap = new Map();
  for (const g of goals) {
    if (!g.user) continue;
    const key = g.targetHours;
    if (!tiersMap.has(key)) tiersMap.set(key, []);
    tiersMap.get(key).push({
      _id: g.user._id,
      name: g.user.name,
      totalSeconds: g.user.totalSeconds || 0,
      totalHours: +(((g.user.totalSeconds || 0) / 3600).toFixed(2)),
      goalTitle: g.title,
      goalId: g._id,
    });
  }

  const tiers = [...tiersMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([targetHours, members]) => {
      const sorted = members.sort((a, b) => b.totalSeconds - a.totalSeconds);
      const ranked = sorted.map((m, i) => ({
        ...m,
        rank: i + 1,
        progressPercent: +Math.min(100, (m.totalSeconds / (targetHours * 3600)) * 100).toFixed(2),
      }));
      const groupTotal = sorted.reduce((s, m) => s + m.totalSeconds, 0);
      return {
        targetHours,
        memberCount: ranked.length,
        groupTotalHours: +((groupTotal / 3600).toFixed(2)),
        groupGoalHours: targetHours * ranked.length,
        members: ranked,
      };
    });

  // Also include a global ranking across all users (not tied to a goal)
  const allUsers = await User.find({}, 'name avatar totalSeconds')
    .sort({ totalSeconds: -1 })
    .limit(50)
    .lean();

  const global = allUsers.map((u, i) => ({
    rank: i + 1,
    _id: u._id,
    name: u.name,
    avatar: u.avatar || '',
    totalHours: +(((u.totalSeconds || 0) / 3600).toFixed(2)),
  }));

  // Decorate tier members with avatars
  const userIds = new Set();
  tiers.forEach((t) => t.members.forEach((m) => userIds.add(String(m._id))));
  const avatarMap = {};
  if (userIds.size) {
    const docs = await User.find({ _id: { $in: [...userIds] } }, 'avatar').lean();
    for (const d of docs) avatarMap[String(d._id)] = d.avatar || '';
  }
  for (const t of tiers) {
    for (const m of t.members) m.avatar = avatarMap[String(m._id)] || '';
  }

  res.json({ tiers, global });
}

export async function discoverUsers(req, res) {
  const meId = req.user?._id;
  const q = (req.query.q || '').toString().trim();
  const filter = {};
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
    ];
  }
  if (meId) filter._id = { $ne: meId };

  const users = await User.find(filter, 'name avatar bio totalSeconds followers following')
    .limit(40)
    .lean();

  const meIdStr = meId ? String(meId) : null;
  const result = users.map((u) => ({
    _id: u._id,
    name: u.name,
    avatar: u.avatar || '',
    bio: u.bio || '',
    totalHours: +(((u.totalSeconds || 0) / 3600).toFixed(2)),
    followersCount: (u.followers || []).length,
    followingCount: (u.following || []).length,
    isFollowing: meIdStr ? (u.followers || []).some((id) => String(id) === meIdStr) : false,
  }));
  res.json({ users: result });
}

export async function followUser(req, res) {
  const targetId = req.params.id;
  if (!mongoose.isValidObjectId(targetId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }
  if (String(targetId) === String(req.user._id)) {
    return res.status(400).json({ message: 'You cannot follow yourself' });
  }
  const target = await User.findById(targetId);
  if (!target) return res.status(404).json({ message: 'User not found' });

  const me = await User.findById(req.user._id);
  const meIdStr = String(me._id);
  const tIdStr = String(target._id);

  const alreadyFollowing = me.following.some((id) => String(id) === tIdStr);
  if (!alreadyFollowing) {
    me.following.push(target._id);
    await me.save();
  }
  const alreadyFollower = target.followers.some((id) => String(id) === meIdStr);
  if (!alreadyFollower) {
    target.followers.push(me._id);
    await target.save();
  }

  res.json({
    isFollowing: true,
    followersCount: target.followers.length,
    followingCount: target.following.length,
  });
}

export async function unfollowUser(req, res) {
  const targetId = req.params.id;
  if (!mongoose.isValidObjectId(targetId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }
  const target = await User.findById(targetId);
  if (!target) return res.status(404).json({ message: 'User not found' });

  const me = await User.findById(req.user._id);
  const meIdStr = String(me._id);
  const tIdStr = String(target._id);

  me.following = me.following.filter((id) => String(id) !== tIdStr);
  target.followers = target.followers.filter((id) => String(id) !== meIdStr);
  await me.save();
  await target.save();

  res.json({
    isFollowing: false,
    followersCount: target.followers.length,
    followingCount: target.following.length,
  });
}

export async function getFollowList(req, res) {
  const userId = req.params.id;
  const which = req.params.which; // 'followers' | 'following'
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }
  if (which !== 'followers' && which !== 'following') {
    return res.status(400).json({ message: 'Invalid list type' });
  }
  const user = await User.findById(userId).populate(which, 'name avatar bio totalSeconds followers');
  if (!user) return res.status(404).json({ message: 'User not found' });

  const meIdStr = req.user ? String(req.user._id) : null;
  const list = (user[which] || []).map((u) => ({
    _id: u._id,
    name: u.name,
    avatar: u.avatar || '',
    bio: u.bio || '',
    totalHours: +(((u.totalSeconds || 0) / 3600).toFixed(2)),
    isFollowing: meIdStr ? (u.followers || []).some((id) => String(id) === meIdStr) : false,
  }));
  res.json({ users: list });
}

function computeAchievements(totalSeconds, sessions, goals) {
  const totalHours = totalSeconds / 3600;
  const sessionCount = sessions.length;

  const achievements = [
    { id: 'first_session', name: 'First Steps', description: 'Logged your first study session', icon: '🌱', earned: sessionCount >= 1 },
    { id: 'ten_hours', name: 'Dedicated', description: 'Studied for 10 total hours', icon: '📘', earned: totalHours >= 10 },
    { id: 'fifty_hours', name: 'Committed', description: 'Studied for 50 total hours', icon: '📚', earned: totalHours >= 50 },
    { id: 'hundred_hours', name: 'Centurion', description: 'Studied for 100 total hours', icon: '🏅', earned: totalHours >= 100 },
    { id: 'five_hundred_hours', name: 'Master Scholar', description: 'Studied for 500 total hours', icon: '🏆', earned: totalHours >= 500 },
    { id: 'ten_sessions', name: 'Consistent Learner', description: 'Completed 10 sessions', icon: '⚡', earned: sessionCount >= 10 },
    { id: 'fifty_sessions', name: 'Habit Formed', description: 'Completed 50 sessions', icon: '🔥', earned: sessionCount >= 50 },
    { id: 'goal_achieved', name: 'Goal Crusher', description: 'Achieved a study goal', icon: '🎯', earned: goals.some((g) => totalSeconds >= g.targetHours * 3600) },
  ];

  // Streak detection
  const dayStrings = new Set(sessions.map((s) => new Date(s.startedAt).toISOString().slice(0, 10)));
  let currentStreak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (dayStrings.has(d.toISOString().slice(0, 10))) currentStreak++;
    else break;
  }

  let longestStreak = 0;
  let temp = 0;
  const sortedDays = [...dayStrings].sort();
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) temp = 1;
    else {
      const prev = new Date(sortedDays[i - 1]);
      const cur = new Date(sortedDays[i]);
      const diff = (cur - prev) / 86400000;
      temp = diff === 1 ? temp + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, temp);
  }

  achievements.push(
    { id: 'streak_3', name: '3-Day Streak', description: '3 days in a row', icon: '🔥', earned: longestStreak >= 3 },
    { id: 'streak_7', name: 'Week Warrior', description: '7 days in a row', icon: '🔥', earned: longestStreak >= 7 },
    { id: 'streak_30', name: 'Unstoppable', description: '30 days in a row', icon: '💎', earned: longestStreak >= 30 }
  );

  return { achievements, currentStreak, longestStreak };
}

export async function userProfile(req, res) {
  const userId = req.params.id;
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  const user = await User.findById(
    userId,
    'name email totalSeconds createdAt bio avatar socialLinks followers following'
  ).lean();
  if (!user) return res.status(404).json({ message: 'User not found' });

  const sessions = await StudySession.find({ user: userId })
    .sort({ startedAt: -1 })
    .lean();
  const goals = await Goal.find({ user: userId }).lean();

  const { achievements, currentStreak, longestStreak } = computeAchievements(
    user.totalSeconds || 0,
    sessions,
    goals
  );

  // Heatmap: last 365 days, daily totals in seconds
  const heatmapMap = {};
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 365);
  for (const s of sessions) {
    if (new Date(s.startedAt) < cutoff) continue;
    const key = new Date(s.startedAt).toISOString().slice(0, 10);
    heatmapMap[key] = (heatmapMap[key] || 0) + s.durationSeconds;
  }

  // Recent activity
  const recentSessions = sessions.slice(0, 10).map((s) => ({
    _id: s._id,
    subject: s.subject,
    notes: s.notes,
    durationSeconds: s.durationSeconds,
    startedAt: s.startedAt,
  }));

  const totalHours = +(((user.totalSeconds || 0) / 3600).toFixed(2));

  const goalsWithProgress = goals.map((g) => ({
    ...g,
    progressPercent: +Math.min(100, ((user.totalSeconds || 0) / (g.targetHours * 3600)) * 100).toFixed(2),
  }));

  const meIdStr = req.user ? String(req.user._id) : null;
  const followersList = (user.followers || []).map(String);
  const followingList = (user.following || []).map(String);
  const isFollowing = meIdStr ? followersList.includes(meIdStr) : false;
  const isFollowedBy = meIdStr ? followingList.includes(meIdStr) : false;
  const canMessage = meIdStr ? (isFollowing && isFollowedBy) : false;

  res.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      joinedAt: user.createdAt,
      totalSeconds: user.totalSeconds || 0,
      totalHours,
      bio: user.bio || '',
      avatar: user.avatar || '',
      socialLinks: user.socialLinks || {},
    },
    social: {
      followersCount: followersList.length,
      followingCount: followingList.length,
      isFollowing,
      isFollowedBy,
      canMessage,
    },
    stats: {
      sessionCount: sessions.length,
      currentStreak,
      longestStreak,
      activeDays: Object.keys(heatmapMap).length,
    },
    achievements,
    goals: goalsWithProgress,
    heatmap: heatmapMap,
    recentSessions,
  });
}
