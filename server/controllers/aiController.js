import OpenAI from 'openai';

// In-memory rate limiter: { userId -> { count, resetAt } }
const rateLimits = new Map();
const DAILY_LIMIT = 20;

function checkRateLimit(userId) {
  const now = Date.now();
  const record = rateLimits.get(userId);

  if (!record || now > record.resetAt) {
    const resetAt = new Date();
    resetAt.setUTCHours(24, 0, 0, 0); // next midnight UTC
    rateLimits.set(userId, { count: 1, resetAt: resetAt.getTime() });
    return true;
  }

  if (record.count >= DAILY_LIMIT) return false;

  record.count++;
  return true;
}

const SYSTEM_PROMPT = `You are a friendly and knowledgeable study assistant for a collaborative study tracker app.
Help students with study tips, subject questions, productivity advice, and learning strategies.
Keep responses concise and encouraging. Avoid off-topic content.`;

const MODEL_NAME = 'gpt-4o-mini';

export async function chat(req, res) {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ message: 'message is required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ message: 'AI service is not configured. Add OPENAI_API_KEY to server/.env' });
  }

  if (!checkRateLimit(req.user._id.toString())) {
    return res.status(429).json({ message: 'Daily limit of 20 AI messages reached. Try again tomorrow.' });
  }

  // Build messages array: system + history + new user message
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  if (Array.isArray(history)) {
    for (const turn of history) {
      if (turn.role && turn.text) {
        messages.push({
          role: turn.role === 'bot' ? 'assistant' : 'user',
          content: turn.text,
        });
      }
    }
  }

  messages.push({ role: 'user', content: message.trim() });

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages,
    });

    const reply = completion.choices[0].message.content;
    return res.json({ reply });
  } catch (err) {
    const status = err.status || err.response?.status;

    if (status === 429) {
      return res.status(429).json({ message: 'AI quota exceeded. Check your OpenAI usage limits.' });
    }

    if (status === 401 || status === 403) {
      return res.status(503).json({ message: 'AI API key is invalid or unauthorized. Check OPENAI_API_KEY in server/.env' });
    }

    console.error('OpenAI error:', err.message);
    res.status(500).json({ message: 'AI service error. Please try again later.' });
  }
}
