import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import { toast } from '../utils/toast.js';

export default function Quiz() {
  const [activeTab, setActiveTab] = useState('flashcards');
  const [topic, setTopic] = useState('');
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);

  // Flashcards state
  const [flashcards, setFlashcards] = useState([]);
  const [flippedMap, setFlippedMap] = useState({});

  // Weekly Quiz state
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [weekStart, setWeekStart] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);

  // Load topics on mount
  useEffect(() => {
    api.get('/quiz/topics')
      .then((res) => {
        const list = res.data.topics || [];
        setTopics(list);
        if (list.length > 0) setTopic(list[0]);
      })
      .catch(() => {
        // Fall back to default topics if endpoint fails
        const defaults = ['Math', 'Science', 'History', 'Computer Science'];
        setTopics(defaults);
        setTopic(defaults[0]);
      });
  }, []);

  useEffect(() => {
    if (!topic) return;
    if (activeTab === 'flashcards') {
      loadFlashcards();
    } else {
      setQuizStarted(false);
      setQuizResult(null);
      setQuizQuestions([]);
      setWeekStart(null);
    }
  }, [activeTab, topic]);

  async function loadFlashcards() {
    setLoading(true);
    try {
      const res = await api.get(`/quiz/flashcards?topic=${encodeURIComponent(topic)}`);
      setFlashcards(res.data.flashcards || []);
      setFlippedMap({});
    } catch {
      toast.error('Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  }

  function toggleFlip(index) {
    setFlippedMap((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  async function startQuiz() {
    setLoading(true);
    try {
      const res = await api.get(`/quiz/weekly?topic=${encodeURIComponent(topic)}`);
      if (res.data.alreadyAttempted) {
        setQuizResult(res.data);
        setQuizStarted(false);
      } else {
        setQuizQuestions(res.data.questions || []);
        setWeekStart(res.data.weekStart);
        setCurrentQ(0);
        setAnswers([]);
        setQuizStarted(true);
        setQuizResult(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start quiz');
    } finally {
      setLoading(false);
    }
  }

  function handleOptionSelect(option) {
    const q = quizQuestions[currentQ];
    const newAnswers = [...answers, { flashcardId: q._id, selected: option }];
    setAnswers(newAnswers);

    if (currentQ < quizQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      submitQuiz(newAnswers);
    }
  }

  async function submitQuiz(finalAnswers) {
    setLoading(true);
    try {
      const res = await api.post('/quiz/submit', {
        topic,
        weekStart,
        answers: finalAnswers,
      });
      setQuizResult(res.data);
      setQuizStarted(false);
      toast.success(`Quiz complete! Score: ${res.data.score}/${res.data.total}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  }

  const difficultyColors = {
    easy: '#10b981',
    medium: '#f59e0b',
    hard: '#ef4444',
  };

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Knowledge Check</h2>
          {topics.length > 0 && (
            <div className="goal-unit-toggle" role="group" aria-label="Topic">
              {topics.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={topic === t ? 'active' : ''}
                  onClick={() => setTopic(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="quiz-tabs">
          <button
            className={`tab-btn ${activeTab === 'flashcards' ? 'active' : ''}`}
            onClick={() => setActiveTab('flashcards')}
          >
            Flashcards
          </button>
          <button
            className={`tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => setActiveTab('weekly')}
          >
            Weekly Quiz
          </button>
        </div>
      </div>

      {loading && <div className="card muted" style={{ padding: 24, textAlign: 'center' }}>Loading…</div>}

      {!loading && activeTab === 'flashcards' && (
        <>
          {flashcards.length === 0 ? (
            <div className="card muted" style={{ textAlign: 'center', padding: 40 }}>
              No flashcards found for <strong>{topic}</strong>.<br />
              <span className="text-sm">Seed some via the API or add cards to get started.</span>
            </div>
          ) : (
            <div className="flashcard-grid">
              {flashcards.map((fc, i) => (
                <div
                  key={fc._id || i}
                  className={`flashcard ${flippedMap[i] ? 'flipped' : ''}`}
                  onClick={() => toggleFlip(i)}
                >
                  <div className="flashcard-inner">
                    <div className="flashcard-front card">
                      <span
                        className="difficulty-badge"
                        style={{ backgroundColor: difficultyColors[fc.difficulty] || difficultyColors.easy }}
                      >
                        {fc.difficulty || 'easy'}
                      </span>
                      <h3 style={{ marginTop: 30 }}>{fc.question}</h3>
                      <p className="muted text-sm" style={{ position: 'absolute', bottom: 15, width: '100%', textAlign: 'center', left: 0 }}>
                        Click to flip
                      </p>
                    </div>
                    <div className="flashcard-back card">
                      <h3 style={{ color: 'var(--accent)' }}>Answer</h3>
                      <p>{fc.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && activeTab === 'weekly' && (
        <div className="card">
          {!quizStarted && !quizResult && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <h3>Weekly {topic} Quiz</h3>
              <p className="muted" style={{ marginBottom: 24 }}>
                Test your knowledge with up to 10 random questions. You can only attempt this once per week!
              </p>
              <button onClick={startQuiz} style={{ fontSize: '1.1rem', padding: '12px 32px' }}>
                Start Quiz
              </button>
            </div>
          )}

          {quizStarted && !quizResult && quizQuestions.length > 0 && (
            <div className="quiz-container">
              <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="muted">Question {currentQ + 1} of {quizQuestions.length}</span>
                <span className="muted text-sm">{topic}</span>
              </div>
              <div className="quiz-progress">
                <div
                  className="quiz-progress-fill"
                  style={{ width: `${(currentQ / quizQuestions.length) * 100}%` }}
                />
              </div>

              <h2 style={{ margin: '30px 0' }}>{quizQuestions[currentQ].question}</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {quizQuestions[currentQ].options?.map((opt, i) => (
                  <button
                    key={i}
                    className="quiz-option"
                    onClick={() => handleOptionSelect(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {quizResult && (
            <div className="quiz-score-screen" style={{ textAlign: 'center' }}>
              {quizResult.alreadyAttempted ? (
                <>
                  <h2>Already Attempted</h2>
                  <p className="muted">You already completed this quiz this week.</p>
                </>
              ) : (
                <h2>Quiz Completed!</h2>
              )}

              <div style={{
                width: 120, height: 120, borderRadius: '50%',
                border: '8px solid var(--accent)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '20px auto', fontSize: '2rem', fontWeight: 'bold',
              }}>
                {quizResult.score} / {quizResult.total}
              </div>

              {quizResult.results && quizResult.results.length > 0 && (
                <>
                  <h3 style={{ marginTop: 30, textAlign: 'left' }}>Review</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
                    {quizResult.results.map((ans, i) => {
                      const q = quizQuestions[i];
                      return (
                        <div
                          key={i}
                          className="card"
                          style={{
                            padding: 16,
                            borderLeft: `4px solid ${ans.correct ? '#10b981' : '#ef4444'}`,
                          }}
                        >
                          <strong>Q{i + 1}: {q?.question || `Question ${i + 1}`}</strong>
                          <div className="hstack" style={{ gap: 20, marginTop: 10, flexWrap: 'wrap' }}>
                            <span style={{ color: ans.correct ? '#10b981' : '#ef4444' }}>
                              Your answer: {ans.selected || '—'}
                            </span>
                            {!ans.correct && (
                              <span style={{ color: '#10b981' }}>
                                Correct: {ans.correctAnswer}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <p className="muted" style={{ marginTop: 30 }}>Come back next week for a new set of questions!</p>
              <button
                className="secondary"
                style={{ marginTop: 16 }}
                onClick={() => { setQuizResult(null); setQuizStarted(false); }}
              >
                Back
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
