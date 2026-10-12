'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const ACCENTS = ['accent-yellow', 'accent-pink', 'accent-blue', 'accent-green'];

export default function HomePage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadQuizzes() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/quizzes');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load quizzes');
        }
        setQuizzes(data);
      } catch (err) {
        setError(err.message || 'Could not load quizzes');
      } finally {
        setLoading(false);
      }
    }
    loadQuizzes();
  }, []);

  return (
    <div>
      <section className="hero">
        <h1>Quiz Arcade</h1>
        <p>Pick a quiz. Beat the clock. Get graded.</p>
      </section>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-box">Loading...</div>
      ) : quizzes.length === 0 ? (
        <div className="card">
          <h3>No quizzes available yet</h3>
          <p>Ask an administrator to add quizzes or run database setup.</p>
        </div>
      ) : (
        <div className="quiz-grid">
          {quizzes.map((quiz, idx) => {
            const accent = ACCENTS[idx % ACCENTS.length];
            const count = Number(quiz.question_count) || 0;
            return (
              <div key={quiz.quiz_id} className="quiz-card">
                <div className={`quiz-card-header ${accent}`}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    {quiz.subject}
                  </div>
                  <h2 style={{ fontSize: '1.35rem', marginTop: '0.2rem' }}>{quiz.title}</h2>
                </div>
                <div className="quiz-card-body">
                  <p>{quiz.description || 'Test your knowledge in this subject!'}</p>
                </div>
                <div className="quiz-card-footer">
                  <span className="badge">
                    {count} {count === 1 ? 'question' : 'questions'}
                  </span>
                  {count > 0 ? (
                    <Link href={`/quiz/${quiz.quiz_id}`} className="btn btn-sm btn-green">
                      PLAY ▶
                    </Link>
                  ) : (
                    <button type="button" className="btn btn-sm" disabled>
                      PLAY ▶
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
