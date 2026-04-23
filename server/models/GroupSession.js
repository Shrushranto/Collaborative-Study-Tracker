import mongoose from 'mongoose';

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    secondsContributed: { type: Number, default: 0 },
    isStudying: { type: Boolean, default: false },
    lastTickAt: { type: Date, default: null },
  },
  { _id: false }
);

const groupSessionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', maxlength: 280 },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    code: { type: String, required: true, unique: true, index: true, default: generateCode },
    goalMinutes: { type: Number, default: 60, min: 1, max: 600 },
    members: { type: [memberSchema], default: [] },
    status: { type: String, enum: ['waiting', 'active', 'ended'], default: 'waiting' },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

groupSessionSchema.index({ 'members.user': 1, status: 1 });

export default mongoose.model('GroupSession', groupSessionSchema);
