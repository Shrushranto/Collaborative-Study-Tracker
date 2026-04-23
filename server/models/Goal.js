import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    targetHours: { type: Number, required: true, min: 1 },
    achievedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

goalSchema.index({ targetHours: 1 });

export default mongoose.model('Goal', goalSchema);
