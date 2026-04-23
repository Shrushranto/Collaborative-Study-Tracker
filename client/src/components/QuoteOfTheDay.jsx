import { useEffect, useState } from 'react';

const STORAGE_KEY = 'study-tracker-quote';

const FALLBACK_QUOTES = [
  { content: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
  { content: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { content: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { content: 'The future depends on what you do today.', author: 'Mahatma Gandhi' },
  { content: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { content: 'Don\u2019t watch the clock; do what it does. Keep going.', author: 'Sam Levenson' },
  { content: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
  { content: 'Strive for progress, not perfection.', author: 'Unknown' },
  { content: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
  { content: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { content: 'Small steps every day add up to big results.', author: 'Unknown' },
  { content: 'You don\u2019t have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function pickFallback() {
  const day = Math.floor(Date.now() / 86400000);
  return FALLBACK_QUOTES[day % FALLBACK_QUOTES.length];
}

export default function QuoteOfTheDay() {
  const [quote, setQuote] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (cached && cached.date === todayKey()) return cached.quote;
    } catch {}
    return null;
  });

  useEffect(() => {
    if (quote) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('https://api.quotable.io/random?tags=motivational|inspirational|wisdom|education');
        if (!res.ok) throw new Error('Quote API failed');
        const data = await res.json();
        const next = { content: data.content, author: data.author };
        if (cancelled) return;
        setQuote(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), quote: next }));
      } catch {
        if (cancelled) return;
        const fallback = pickFallback();
        setQuote(fallback);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), quote: fallback }));
      }
    }

    load();
    return () => { cancelled = true; };
  }, [quote]);

  const display = quote || pickFallback();

  return (
    <div className="quote-card">
      <span className="quote-eyebrow">Quote of the day</span>
      <p className="quote-text">"{display.content}"</p>
      <span className="quote-author">~Shru</span>
    </div>
  );
}
