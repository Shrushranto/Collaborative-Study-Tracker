import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    flashcardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flashcard', required: true },
    selected: { type: String, default: null },
    correct: { type: Boolean, required: true },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: Date, required: true },
    topic: { type: String, required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    answers: [answerSchema],
  },
  { timestamps: true }
);

quizAttemptSchema.index({ user: 1, weekStart: 1, topic: 1 });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
