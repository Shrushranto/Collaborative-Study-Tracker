import mongoose from 'mongoose';
import Goal from '../models/Goal.js';
import StudySession from '../models/StudySession.js';

export async function listMyGoals(req, res) {
  const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();

  const goalIds = goals.map(g => g._id);
  const totals = await StudySession.aggregate([
    { $match: { goal: { $in: goalIds }, user: new mongoose.Types.ObjectId(req.user._id) } },
    { $group: { _id: '$goal', totalSeconds: { $sum: '$durationSeconds' } } },
  ]);
  const totalsMap = {};
  for (const t of totals) totalsMap[String(t._id)] = t.totalSeconds;

  const enriched = goals.map((g) => {
    const currentSeconds = totalsMap[String(g._id)] || 0;
    const targetSeconds = g.targetHours * 3600;
    const progress = Math.min(100, (currentSeconds / targetSeconds) * 100);
    return { ...g, progressPercent: +progress.toFixed(2), currentSeconds };
  });
  res.json({ goals: enriched });
}

export async function createGoal(req, res) {
  const { title, targetHours } = req.body;
  if (!title || !targetHours) {
    return res.status(400).json({ message: 'Title and targetHours are required' });
  }
  const hours = Number(targetHours);
  if (hours < 1) return res.status(400).json({ message: 'targetHours must be at least 1' });

  const goal = await Goal.create({ user: req.user._id, title, targetHours: hours });
  res.status(201).json({ goal });
}

export async function deleteGoal(req, res) {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!goal) return res.status(404).json({ message: 'Goal not found' });
  res.json({ message: 'Deleted' });
}
