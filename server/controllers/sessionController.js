import mongoose from 'mongoose';
import StudySession from '../models/StudySession.js';
import User from '../models/User.js';

export async function createSession(req, res) {
  const { durationSeconds, subject, notes, startedAt, endedAt, goalId } = req.body;
  const seconds = Number(durationSeconds);

  if (!seconds || seconds < 1) {
    return res.status(400).json({ message: 'durationSeconds must be a positive number' });
  }
  const start = startedAt ? new Date(startedAt) : new Date(Date.now() - seconds * 1000);
  const end = endedAt ? new Date(endedAt) : new Date();

  let resolvedGoal = null;
  if (goalId) {
    const Goal = (await import('../models/Goal.js')).default;
    const goal = await Goal.findOne({ _id: goalId, user: req.user._id });
    if (goal) resolvedGoal = goal._id;
  }

  const session = await StudySession.create({
    user: req.user._id,
    goal: resolvedGoal,
    durationSeconds: seconds,
    subject: subject || '',
    notes: notes || '',
    startedAt: start,
    endedAt: end,
  });

  await User.findByIdAndUpdate(req.user._id, { $inc: { totalSeconds: seconds } });

  res.status(201).json({ session });
}

export async function mySessions(req, res) {
  const sessions = await StudySession.find({ user: req.user._id })
    .sort({ startedAt: -1 })
    .limit(100)
    .lean();
  res.json({ sessions });
}

export async function calendarSummary(req, res) {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const since = new Date();
  since.setMonth(since.getMonth() - 6);

  const data = await StudySession.aggregate([
    { $match: { user: userId, startedAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt' } },
        totalSeconds: { $sum: '$durationSeconds' },
        sessions: { $sum: 1 },
        subjects: { $addToSet: '$subject' },
      },
    },
    { $project: { _id: 0, date: '$_id', totalSeconds: 1, sessions: 1, subjects: 1 } },
    { $sort: { date: 1 } },
  ]);

  res.json({ days: data });
}

export async function sessionsByDate(req, res) {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'date query param required (YYYY-MM-DD)' });
  }

  const start = new Date(date + 'T00:00:00.000Z');
  const end = new Date(date + 'T23:59:59.999Z');

  const sessions = await StudySession.find({
    user: req.user._id,
    startedAt: { $gte: start, $lte: end },
  })
    .sort({ startedAt: 1 })
    .lean();

  res.json({ sessions });
}
