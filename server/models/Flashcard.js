import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true, trim: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    options: {
      type: [String],
      validate: { validator: (v) => v.length === 4, message: 'Options must have exactly 4 items' },
    },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

flashcardSchema.index({ topic: 1 });

export default mongoose.model('Flashcard', flashcardSchema);
