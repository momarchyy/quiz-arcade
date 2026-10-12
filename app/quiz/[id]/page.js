'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

function gradeClass(grade) {
  if (grade === 'S' || grade === 'A+') return 'grade-S';
  if (grade === 'A') return 'grade-A';
  if (grade === 'B') return 'grade-B';
  if (grade === 'C') return 'grade-C';
  if (grade === 'D') return 'grade-D';
  return 'grade-F';
}

export default function QuizPage({ params }) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.id;

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // States: 'details' | 'questions' | 'result'
  const [step, setStep] = useState('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Automatically log out of any active admin session as soon as a user opens a quiz to attempt it
    if (sessionStorage.getItem('adminPw')) {
      sessionStorage.removeItem('adminPw');
      window.dispatchEvent(new Event('admin-auth-change'));
    }

    async function loadQuiz() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/quizzes/${quizId}/questions`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load quiz');
        }
        setQuiz(data.quiz);
        setQuestions(data.questions || []);
      } catch (err) {
        setError(err.message || 'Error loading quiz');
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [quizId]);

  function handleStart(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please enter both your name and email.');
      return;
    }
    if (sessionStorage.getItem('adminPw')) {
      sessionStorage.removeItem('adminPw');
      window.dispatchEvent(new Event('admin-auth-change'));
    }
    setError('');
    setStep('questions');
  }

  function handleSelectOption(questionId, option) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  }

  async function handleSubmitQuiz(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      if (sessionStorage.getItem('adminPw')) {
        sessionStorage.removeItem('adminPw');
        window.dispatchEvent(new Event('admin-auth-change'));
      }
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit quiz');
      }
      setResult(data);
      setStep('result');
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  function handlePlayAgain() {
    setAnswers({});
    setResult(null);
    setError('');
    setStep('details');
  }

  if (loading) {
    return <div className="loading-box">Loading...</div>;
  }

  if (!quiz) {
    return (
      <div>
        {error && <div className="error-banner">{error}</div>}
        <Link href="/" className="btn">
          ← Back to Home
        </Link>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;

  return (
    <div>
      <div className="card accent-blue" style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
          {quiz.subject}
        </div>
        <h1 style={{ fontSize: '2rem', margin: '0.25rem 0' }}>{quiz.title}</h1>
        {quiz.description && <p>{quiz.description}</p>}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {step === 'details' && (
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Enter Your Details</h2>
          <form onSubmit={handleStart}>
            <div className="form-group">
              <label className="form-label" htmlFor="student-name">
                Your Name
              </label>
              <input
                id="student-name"
                type="text"
                className="input"
                placeholder="e.g. Asha"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="student-email">
                Your Email
              </label>
              <input
                id="student-email"
                type="email"
                className="input"
                placeholder="e.g. asha@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-green" disabled={totalQuestions === 0}>
              Start Quiz ({totalQuestions} Questions) ▶
            </button>
          </form>
        </div>
      )}

      {step === 'questions' && (
        <form onSubmit={handleSubmitQuiz}>
          <div
            className="card accent-yellow"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: '82px',
              zIndex: 20,
            }}
          >
            <strong>
              Player: {name} ({email})
            </strong>
            <span className="badge" style={{ backgroundColor: 'var(--card)', color: 'var(--ink)' }}>
              Answered {answeredCount} / {totalQuestions}
            </span>
          </div>

          {questions.map((q, index) => {
            const chosen = answers[q.question_id];
            return (
              <div key={q.question_id} className="card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <h3 style={{ fontSize: '1.15rem', textTransform: 'none' }}>
                    {index + 1}. {q.question_text}
                  </h3>
                  <span className="badge">
                    {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                  </span>
                </div>

                {['A', 'B', 'C', 'D'].map((optKey) => {
                  const optText = q[`option_${optKey.toLowerCase()}`];
                  const isSelected = chosen === optKey;
                  return (
                    <label
                      key={optKey}
                      className={`option-label ${isSelected ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`question-${q.question_id}`}
                        value={optKey}
                        checked={isSelected}
                        onChange={() => handleSelectOption(q.question_id, optKey)}
                      />
                      <span>
                        <strong>{optKey}.</strong> {optText}
                      </span>
                    </label>
                  );
                })}
              </div>
            );
          })}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-green" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Answers ✔'}
            </button>
          </div>
        </form>
      )}

      {step === 'result' && result && (
        <div>
          <div className="card" style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem' }}>Quiz Complete!</h2>
            <div className={`grade-badge ${gradeClass(result.grade)}`} style={{ marginBottom: '1rem' }}>
              {result.grade}
            </div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
              Score: {result.score} / {result.totalMarks}
            </h3>
            <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>{result.percentage}%</p>

            <div className="progress-bar-outer">
              <div
                className="progress-bar-inner"
                style={{ width: `${Math.min(100, Math.max(0, result.percentage))}%` }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                marginTop: '1.5rem',
                flexWrap: 'wrap',
              }}
            >
              <button type="button" onClick={handlePlayAgain} className="btn btn-yellow">
                ↻ Play Again
              </button>
              <Link href="/leaderboard" className="btn btn-pink">
                🏆 View Leaderboard
              </Link>
            </div>
          </div>

          <h2 style={{ marginBottom: '1rem' }}>Question Review</h2>
          {result.review.map((item, idx) => (
            <div
              key={item.questionId}
              className={`review-card ${item.isCorrect ? 'review-correct' : 'review-wrong'}`}
            >
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                {idx + 1}. {item.questionText}
              </div>
              <div style={{ fontSize: '0.95rem' }}>
                <div>
                  <strong>Your Answer:</strong>{' '}
                  {item.chosen
                    ? `${item.chosen} — ${item.options[item.chosen]}`
                    : 'Not answered'}
                  {item.isCorrect ? ' ✔' : ' ✘'}
                </div>
                {!item.isCorrect && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <strong>Correct Answer:</strong> {item.correct} —{' '}
                    {item.options[item.correct]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
