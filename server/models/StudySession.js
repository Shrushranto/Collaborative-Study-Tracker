import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goal: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', default: null, index: true },
    durationSeconds: { type: Number, required: true, min: 1 },
    subject: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

studySessionSchema.index({ user: 1, startedAt: -1 });

export default mongoose.model('StudySession', studySessionSchema);
