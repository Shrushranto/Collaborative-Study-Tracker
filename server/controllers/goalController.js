import Goal from '../models/Goal.js';

export async function listMyGoals(req, res) {
  const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  const totalSeconds = req.user.totalSeconds || 0;
  const enriched = goals.map((g) => {
    const targetSeconds = g.targetHours * 3600;
    const progress = Math.min(100, (totalSeconds / targetSeconds) * 100);
    return { ...g, progressPercent: +progress.toFixed(2), currentSeconds: totalSeconds };
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
