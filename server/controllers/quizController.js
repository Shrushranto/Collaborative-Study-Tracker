import Flashcard from '../models/Flashcard.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';

// Return Monday of the week containing `date`
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// GET /api/quiz/flashcards?topic=
export async function getFlashcards(req, res) {
  const { topic } = req.query;
  const filter = topic ? { topic } : {};
  const cards = await Flashcard.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ flashcards: cards });
}

// GET /api/quiz/topics
export async function getTopics(req, res) {
  const topics = await Flashcard.distinct('topic');
  res.json({ topics });
}

// GET /api/quiz/weekly?topic=
export async function getWeeklyQuiz(req, res) {
  const { topic } = req.query;
  if (!topic) return res.status(400).json({ message: 'topic is required' });

  const weekStart = getWeekStart();

  // Check if already attempted this week+topic
  const existing = await QuizAttempt.findOne({ user: req.user._id, weekStart, topic });
  if (existing) {
    return res.status(200).json({
      alreadyAttempted: true,
      score: existing.score,
      total: existing.total,
      weekStart,
    });
  }

  const all = await Flashcard.find({ topic }).lean();
  if (all.length === 0) return res.status(404).json({ message: 'No flashcards for this topic' });

  // Shuffle and pick up to 10
  const shuffled = all.sort(() => Math.random() - 0.5).slice(0, 10);
  res.json({ questions: shuffled, weekStart });
}

// POST /api/quiz/submit
export async function submitQuiz(req, res) {
  const { topic, weekStart, answers } = req.body;
  if (!topic || !weekStart || !Array.isArray(answers)) {
    return res.status(400).json({ message: 'topic, weekStart, and answers are required' });
  }

  const ws = new Date(weekStart);
  const existing = await QuizAttempt.findOne({ user: req.user._id, weekStart: ws, topic });
  if (existing) return res.status(409).json({ message: 'Already attempted this quiz this week' });

  // Fetch all flashcards referenced in answers
  const ids = answers.map((a) => a.flashcardId);
  const cards = await Flashcard.find({ _id: { $in: ids } }).lean();
  const cardMap = Object.fromEntries(cards.map((c) => [c._id.toString(), c]));

  let score = 0;
  const results = answers.map((a) => {
    const card = cardMap[a.flashcardId];
    const correct = card ? a.selected === card.answer : false;
    if (correct) score++;
    return {
      flashcardId: a.flashcardId,
      selected: a.selected,
      correct,
      correctAnswer: card?.answer,
    };
  });

  await QuizAttempt.create({
    user: req.user._id,
    weekStart: ws,
    topic,
    score,
    total: answers.length,
    answers: results.map(({ flashcardId, selected, correct }) => ({ flashcardId, selected, correct })),
  });

  res.json({ score, total: answers.length, results });
}

// GET /api/quiz/leaderboard
export async function getQuizLeaderboard(req, res) {
  const weekStart = getWeekStart();
  const attempts = await QuizAttempt.find({ weekStart })
    .populate('user', 'name avatar')
    .sort({ score: -1, createdAt: 1 })
    .lean();

  res.json({ leaderboard: attempts, weekStart });
}

// POST /api/quiz/seed (dev only)
export async function seedFlashcards(req, res) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Not available in production' });
  }

  const seed = [
    {
      topic: 'Math',
      question: 'What is the derivative of x²?',
      answer: '2x',
      options: ['x', '2x', 'x²', '2'],
      difficulty: 'easy',
    },
    {
      topic: 'Math',
      question: 'What is ∫2x dx?',
      answer: 'x² + C',
      options: ['2x + C', 'x² + C', '2x²', 'x + C'],
      difficulty: 'medium',
    },
    {
      topic: 'Science',
      question: 'What is the speed of light (approx)?',
      answer: '3 × 10⁸ m/s',
      options: ['3 × 10⁶ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s', '3 × 10⁴ m/s'],
      difficulty: 'easy',
    },
    {
      topic: 'Science',
      question: 'What is Newton\'s second law?',
      answer: 'F = ma',
      options: ['F = mv', 'F = ma', 'E = mc²', 'F = mg'],
      difficulty: 'easy',
    },
    {
      topic: 'History',
      question: 'In what year did World War II end?',
      answer: '1945',
      options: ['1939', '1941', '1944', '1945'],
      difficulty: 'easy',
    },
    {
      topic: 'Computer Science',
      question: 'What does CPU stand for?',
      answer: 'Central Processing Unit',
      options: ['Central Program Utility', 'Core Processing Unit', 'Central Processing Unit', 'Computer Processing Unit'],
      difficulty: 'easy',
    },
    {
      topic: 'Computer Science',
      question: 'What is O(n log n) complexity typical of?',
      answer: 'Merge sort',
      options: ['Bubble sort', 'Merge sort', 'Linear search', 'Hash lookup'],
      difficulty: 'medium',
    },
  ];

  await Flashcard.insertMany(seed);
  res.json({ message: `Seeded ${seed.length} flashcards` });
}
