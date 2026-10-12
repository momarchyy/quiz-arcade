'use client';

import { useEffect, useState } from 'react';

const ACCENTS = ['accent-yellow', 'accent-blue', 'accent-green', 'accent-pink'];

function gradeClass(grade) {
  if (grade === 'S' || grade === 'A+') return 'grade-S';
  if (grade === 'A') return 'grade-A';
  if (grade === 'B') return 'grade-B';
  if (grade === 'C') return 'grade-C';
  if (grade === 'D') return 'grade-D';
  return 'grade-F';
}

function rankMedal(rank) {
  if (rank === 1) return '🥇 1';
  if (rank === 2) return '🥈 2';
  if (rank === 3) return '🥉 3';
  return rank;
}

function formatTimestamp(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function QuizLeaderboardSection({ quiz, attempts, accentClass }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [attempts]);

  const totalRecords = attempts.length;
  const currentRecord = attempts[currentIndex] || null;

  return (
    <section style={{ marginBottom: '3rem' }}>
      <div
        className={`card ${accentClass}`}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
            {quiz.subject || 'Quiz Leaderboard'}
          </div>
          <h2 style={{ fontSize: '1.65rem' }}>🎮 {quiz.title} — Leaderboard</h2>
        </div>
        <span className="badge" style={{ backgroundColor: 'var(--card)', color: 'var(--ink)', fontSize: '0.9rem' }}>
          {totalRecords} {totalRecords === 1 ? 'Attempt' : 'Attempts'}
        </span>
      </div>

      {/* Single-Record Browser with First / Previous / Next / Last Navigation */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1rem',
            borderBottom: '3px solid var(--ink)',
            paddingBottom: '0.75rem',
          }}
        >
          <h3>{quiz.title} — Attempt Record Browser</h3>
          <span className="badge" style={{ fontSize: '0.95rem' }}>
            {totalRecords > 0
              ? `Record ${currentIndex + 1} of ${totalRecords}`
              : 'Record 0 of 0'}
          </span>
        </div>

        {!currentRecord ? (
          <p style={{ padding: '1rem 0', fontWeight: 500 }}>
            No attempts recorded for this quiz yet.
          </p>
        ) : (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <div
                  style={{
                    marginBottom: '0.5rem',
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span className="badge">Quiz Rank: {rankMedal(currentRecord.quizRank)}</span>
                  <span className="badge accent-blue">Attempt #{currentRecord.attempt_id}</span>
                  <span className="badge accent-green">Quiz: {currentRecord.title}</span>
                </div>
                <h4 style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>
                  Player: {currentRecord.name}
                </h4>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                  Score: {currentRecord.score} / {currentRecord.total_marks} (
                  {Number(currentRecord.percentage).toFixed(2)}%)
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                  <strong>Completed At:</strong> {formatTimestamp(currentRecord.taken_at)}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div className={`grade-badge ${gradeClass(currentRecord.grade)}`}>
                  {currentRecord.grade}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '2px solid var(--ink)',
              }}
            >
              <button
                type="button"
                className="btn btn-sm btn-card"
                onClick={() => setCurrentIndex(0)}
                disabled={currentIndex <= 0}
              >
                ⏮ First
              </button>
              <button
                type="button"
                className="btn btn-sm btn-card"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex <= 0}
              >
                ◀ Previous
              </button>
              <button
                type="button"
                className="btn btn-sm btn-card"
                onClick={() => setCurrentIndex((i) => Math.min(totalRecords - 1, i + 1))}
                disabled={currentIndex >= totalRecords - 1}
              >
                Next ▶
              </button>
              <button
                type="button"
                className="btn btn-sm btn-card"
                onClick={() => setCurrentIndex(totalRecords - 1)}
                disabled={currentIndex >= totalRecords - 1}
              >
                Last ⏭
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table for this Quiz */}
      <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
        Click any row below to inspect that record in the browser above:
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Score</th>
              <th>%</th>
              <th>Grade</th>
              <th>Completed Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {attempts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem' }}>
                  No attempts recorded for {quiz.title} yet.
                </td>
              </tr>
            ) : (
              attempts.map((row, idx) => (
                <tr
                  key={row.attempt_id}
                  className={`clickable-row ${idx === currentIndex ? 'selected-row' : ''}`}
                  onClick={() => setCurrentIndex(idx)}
                >
                  <td style={{ fontWeight: 700 }}>{rankMedal(row.quizRank)}</td>
                  <td style={{ fontWeight: 700 }}>{row.name}</td>
                  <td>
                    {row.score} / {row.total_marks}
                  </td>
                  <td>{Number(row.percentage).toFixed(2)}%</td>
                  <td>
                    <span className={`grade-badge-sm ${gradeClass(row.grade)}`}>{row.grade}</span>
                  </td>
                  <td>{formatTimestamp(row.taken_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function LeaderboardPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [leaderboard, setLeaderboard] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchLeaderboardData(quizVal, sortVal) {
    const params = new URLSearchParams();
    if (quizVal) params.set('quizId', quizVal);
    if (sortVal) params.set('sort', sortVal);
    const qs = params.toString();
    const url = qs ? `/api/leaderboard?${qs}` : '/api/leaderboard';
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load leaderboard');
    return data;
  }

  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
        setError('');
        const [qzRes, lbData, rpRes] = await Promise.all([
          fetch('/api/quizzes'),
          fetchLeaderboardData('', 'score'),
          fetch('/api/reports'),
        ]);

        const [qzData, rpData] = await Promise.all([qzRes.json(), rpRes.json()]);

        if (!qzRes.ok) throw new Error(qzData.error || 'Failed to load quizzes');
        if (!rpRes.ok) throw new Error(rpData.error || 'Failed to load reports');

        setQuizzes(qzData);
        setLeaderboard(lbData);
        setReports(rpData);
      } catch (err) {
        setError(err.message || 'Error loading leaderboard data');
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  async function handleFilterChange(e) {
    const val = e.target.value;
    setSelectedQuiz(val);
    try {
      setLoading(true);
      setError('');
      const data = await fetchLeaderboardData(val, sortBy);
      setLeaderboard(data);
    } catch (err) {
      setError(err.message || 'Could not filter leaderboard');
    } finally {
      setLoading(false);
    }
  }

  async function handleSortChange(e) {
    const val = e.target.value;
    setSortBy(val);
    try {
      setLoading(true);
      setError('');
      const data = await fetchLeaderboardData(selectedQuiz, val);
      setLeaderboard(data);
    } catch (err) {
      setError(err.message || 'Could not sort leaderboard');
    } finally {
      setLoading(false);
    }
  }

  const displayedQuizzes = selectedQuiz
    ? quizzes.filter((q) => String(q.quiz_id) === String(selectedQuiz))
    : quizzes;

  return (
    <div>
      <div
        className="card accent-pink"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem' }}>🏆 Leaderboards</h1>
          <p>Separate leaderboards per quiz with completion time sorting & record navigation.</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '200px' }}>
            <label className="form-label" htmlFor="quiz-filter">
              Show Quiz
            </label>
            <select
              id="quiz-filter"
              className="select"
              value={selectedQuiz}
              onChange={handleFilterChange}
            >
              <option value="">All quizzes (Separate tables)</option>
              {quizzes.map((q) => (
                <option key={q.quiz_id} value={q.quiz_id}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '240px' }}>
            <label className="form-label" htmlFor="sort-order">
              Sort Attempts By
            </label>
            <select
              id="sort-order"
              className="select"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="score">Highest Score % (Default)</option>
              <option value="time_desc">Completion Time (Newest First)</option>
              <option value="time_asc">Completion Time (Oldest First)</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-box">Loading...</div>
      ) : (
        <>
          {displayedQuizzes.map((quiz, idx) => {
            const quizAttempts = leaderboard
              .filter(
                (row) =>
                  Number(row.quiz_id) === Number(quiz.quiz_id) || row.title === quiz.title
              )
              .map((row, rIdx) => ({
                ...row,
                quizRank: rIdx + 1,
              }));

            return (
              <QuizLeaderboardSection
                key={quiz.quiz_id}
                quiz={quiz}
                attempts={quizAttempts}
                accentClass={ACCENTS[idx % ACCENTS.length]}
              />
            );
          })}

          <h2 style={{ marginBottom: '1rem', marginTop: '2.5rem' }}>📊 Quiz Report</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Quiz Title</th>
                  <th>Attempts</th>
                  <th>Average %</th>
                  <th>Highest %</th>
                  <th>Lowest %</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem' }}>
                      No quiz statistics available.
                    </td>
                  </tr>
                ) : (
                  reports.map((rep) => (
                    <tr key={rep.quiz_id}>
                      <td style={{ fontWeight: 700 }}>{rep.title}</td>
                      <td>{rep.attempts}</td>
                      <td>
                        {rep.avg_percentage !== null
                          ? `${Number(rep.avg_percentage).toFixed(2)}%`
                          : '—'}
                      </td>
                      <td>
                        {rep.highest !== null ? `${Number(rep.highest).toFixed(2)}%` : '—'}
                      </td>
                      <td>
                        {rep.lowest !== null ? `${Number(rep.lowest).toFixed(2)}%` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
