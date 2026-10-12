'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminGate from '@/components/AdminGate';
import { adminFetch } from '@/lib/adminClient';

export default function AdminQuestionsPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterQuizId, setFilterQuizId] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Add / Edit form state
  const [editingId, setEditingId] = useState(null);
  const [formQuizId, setFormQuizId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState('A');
  const [marks, setMarks] = useState(1);
  const [saving, setSaving] = useState(false);

  async function loadQuizzes() {
    try {
      const res = await fetch('/api/quizzes');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setQuizzes(data);
        if (data.length > 0 && !formQuizId) {
          setFormQuizId(String(data[0].quiz_id));
        }
      }
    } catch {
      // ignore initial quiz dropdown error if handled by main fetch
    }
  }

  async function loadQuestions(quizIdVal = filterQuizId, keywordVal = searchKeyword, targetIndex = null) {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (quizIdVal) params.set('quizId', quizIdVal);
      if (keywordVal.trim()) params.set('q', keywordVal.trim());

      const qs = params.toString();
      const url = qs ? `/api/admin/questions?${qs}` : '/api/admin/questions';
      const res = await adminFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load questions');

      setQuestions(data);
      if (data.length === 0) {
        setCurrentIndex(0);
      } else if (targetIndex !== null) {
        setCurrentIndex(Math.min(Math.max(0, targetIndex), data.length - 1));
      } else {
        setCurrentIndex((prev) => Math.min(Math.max(0, prev), data.length - 1));
      }
    } catch (err) {
      setError(err.message || 'Error loading questions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuizzes();
    loadQuestions('', '', 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadQuestions(filterQuizId, searchKeyword, 0);
  }

  function handleQuizFilterChange(e) {
    const val = e.target.value;
    setFilterQuizId(val);
    loadQuestions(val, searchKeyword, 0);
  }

  function resetForm() {
    setEditingId(null);
    if (quizzes.length > 0 && !formQuizId) {
      setFormQuizId(String(quizzes[0].quiz_id));
    }
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectOption('A');
    setMarks(1);
  }

  function handleEditRecord(rec) {
    if (!rec) return;
    setEditingId(rec.question_id);
    setFormQuizId(String(rec.quiz_id));
    setQuestionText(rec.question_text || '');
    setOptionA(rec.option_a || '');
    setOptionB(rec.option_b || '');
    setOptionC(rec.option_c || '');
    setOptionD(rec.option_d || '');
    setCorrectOption(rec.correct_option || 'A');
    setMarks(rec.marks || 1);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!formQuizId) {
      setError('Please select a quiz.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const payload = {
        quiz_id: Number(formQuizId),
        question_text: questionText.trim(),
        option_a: optionA.trim(),
        option_b: optionB.trim(),
        option_c: optionC.trim(),
        option_d: optionD.trim(),
        correct_option: correctOption,
        marks: Number(marks) || 1,
      };

      const isUpdating = Boolean(editingId);
      const url = isUpdating ? `/api/admin/questions/${editingId}` : '/api/admin/questions';
      const method = isUpdating ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save question');

      resetForm();
      await loadQuestions(filterQuizId, searchKeyword, isUpdating ? currentIndex : null);
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRecord(rec) {
    if (!rec) return;
    const confirmed = window.confirm(
      `Delete Question #${rec.question_id}: "${rec.question_text}"?`
    );
    if (!confirmed) return;

    try {
      setError('');
      const res = await adminFetch(`/api/admin/questions/${rec.question_id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete question');

      if (editingId === rec.question_id) {
        resetForm();
      }
      await loadQuestions(filterQuizId, searchKeyword, currentIndex);
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  }

  const currentRecord = questions[currentIndex] || null;
  const totalRecords = questions.length;

  return (
    <AdminGate>
      <div>
        <div className="admin-subnav">
          <Link href="/admin/quizzes" className="btn btn-card">
            ← Manage Quizzes
          </Link>
          <Link href="/admin/questions" className="btn btn-pink">
            ❓ Manage Questions
          </Link>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* Filters & Search */}
        <div className="card accent-yellow">
          <h2 style={{ marginBottom: '1rem' }}>🔍 Filter & Search Questions</h2>
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              alignItems: 'end',
            }}
          >
            <div>
              <label className="form-label" htmlFor="filter-quiz">
                Quiz Filter
              </label>
              <select
                id="filter-quiz"
                className="select"
                value={filterQuizId}
                onChange={handleQuizFilterChange}
              >
                <option value="">All quizzes</option>
                {quizzes.map((q) => (
                  <option key={q.quiz_id} value={q.quiz_id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="search-keyword">
                Keyword in Question Text
              </label>
              <input
                id="search-keyword"
                type="text"
                className="input"
                placeholder="e.g. HTML, primary key..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-blue">
                Search
              </button>
              {(filterQuizId || searchKeyword) && (
                <button
                  type="button"
                  className="btn btn-card"
                  onClick={() => {
                    setFilterQuizId('');
                    setSearchKeyword('');
                    loadQuestions('', '', 0);
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {loading ? (
          <div className="loading-box">Loading...</div>
        ) : (
          <>
            {/* Single-Record View with Navigation */}
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
                <h2>Single-Record Browser</h2>
                <span className="badge" style={{ fontSize: '0.95rem' }}>
                  {totalRecords > 0
                    ? `Record ${currentIndex + 1} of ${totalRecords}`
                    : 'Record 0 of 0'}
                </span>
              </div>

              {!currentRecord ? (
                <p style={{ padding: '1rem 0', fontWeight: 500 }}>
                  No questions match your current filter.
                </p>
              ) : (
                <div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span className="badge" style={{ marginRight: '0.5rem' }}>
                      ID #{currentRecord.question_id}
                    </span>
                    <span className="badge accent-blue" style={{ marginRight: '0.5rem' }}>
                      Quiz: {currentRecord.quiz_title || `#${currentRecord.quiz_id}`}
                    </span>
                    <span className="badge accent-green">
                      Marks: {currentRecord.marks}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.25rem',
                      textTransform: 'none',
                      marginBottom: '1rem',
                    }}
                  >
                    {currentRecord.question_text}
                  </h3>

                  <div className="form-row" style={{ marginBottom: '1rem' }}>
                    {['A', 'B', 'C', 'D'].map((optKey) => {
                      const isCorrect = currentRecord.correct_option === optKey;
                      return (
                        <div
                          key={optKey}
                          style={{
                            padding: '0.65rem 0.9rem',
                            border: '3px solid var(--ink)',
                            borderRadius: '10px',
                            backgroundColor: isCorrect ? 'var(--green)' : 'var(--bg)',
                            color: isCorrect ? 'var(--on-accent)' : 'var(--ink)',
                            fontWeight: isCorrect ? 700 : 500,
                          }}
                        >
                          <strong>{optKey}:</strong>{' '}
                          {currentRecord[`option_${optKey.toLowerCase()}`]}
                          {isCorrect && ' (✔ Correct)'}
                        </div>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      marginTop: '1.25rem',
                    }}
                  >
                    {/* Navigation buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                        onClick={() =>
                          setCurrentIndex((i) => Math.min(totalRecords - 1, i + 1))
                        }
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

                    {/* Edit / Delete on current record */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-yellow"
                        onClick={() => handleEditRecord(currentRecord)}
                      >
                        ✎ Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-red"
                        onClick={() => handleDeleteRecord(currentRecord)}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Add / Edit Form */}
            <div className="card">
              <h2 style={{ marginBottom: '1rem' }}>
                {editingId ? `Edit Question #${editingId}` : 'Add Question'}
              </h2>
              <form onSubmit={handleFormSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="q-quiz">
                      Quiz
                    </label>
                    <select
                      id="q-quiz"
                      className="select"
                      value={formQuizId}
                      onChange={(e) => setFormQuizId(e.target.value)}
                      required
                    >
                      <option value="" disabled>
                        Select a quiz...
                      </option>
                      {quizzes.map((q) => (
                        <option key={q.quiz_id} value={q.quiz_id}>
                          {q.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="q-correct">
                      Correct Option
                    </label>
                    <select
                      id="q-correct"
                      className="select"
                      value={correctOption}
                      onChange={(e) => setCorrectOption(e.target.value)}
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="q-marks">
                      Marks
                    </label>
                    <input
                      id="q-marks"
                      type="number"
                      min="1"
                      className="input"
                      value={marks}
                      onChange={(e) => setMarks(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="q-text">
                    Question Text
                  </label>
                  <input
                    id="q-text"
                    type="text"
                    className="input"
                    placeholder="Enter the question..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="q-opt-a">
                      Option A
                    </label>
                    <input
                      id="q-opt-a"
                      type="text"
                      className="input"
                      value={optionA}
                      onChange={(e) => setOptionA(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="q-opt-b">
                      Option B
                    </label>
                    <input
                      id="q-opt-b"
                      type="text"
                      className="input"
                      value={optionB}
                      onChange={(e) => setOptionB(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="q-opt-c">
                      Option C
                    </label>
                    <input
                      id="q-opt-c"
                      type="text"
                      className="input"
                      value={optionC}
                      onChange={(e) => setOptionC(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="q-opt-d">
                      Option D
                    </label>
                    <input
                      id="q-opt-d"
                      type="text"
                      className="input"
                      value={optionD}
                      onChange={(e) => setOptionD(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn btn-green" disabled={saving}>
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Add question'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={resetForm} className="btn btn-card">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Table View of All Matching Questions */}
            <h2 style={{ marginBottom: '0.75rem' }}>
              All Matching Questions ({totalRecords})
            </h2>
            <p style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
              Click any row below to jump the single-record view to that question.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ID</th>
                    <th>Quiz</th>
                    <th>Question Text</th>
                    <th>Answer</th>
                    <th>Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem' }}>
                        No matching questions found.
                      </td>
                    </tr>
                  ) : (
                    questions.map((q, idx) => (
                      <tr
                        key={q.question_id}
                        className={`clickable-row ${
                          idx === currentIndex ? 'selected-row' : ''
                        }`}
                        onClick={() => setCurrentIndex(idx)}
                      >
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 700 }}>{q.question_id}</td>
                        <td>{q.quiz_title || `#${q.quiz_id}`}</td>
                        <td>{q.question_text}</td>
                        <td style={{ fontWeight: 700 }}>{q.correct_option}</td>
                        <td>{q.marks}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminGate>
  );
}
