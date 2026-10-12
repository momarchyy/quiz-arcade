'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminGate from '@/components/AdminGate';
import { adminFetch } from '@/lib/adminClient';

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchQuizzes() {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/quizzes');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load quizzes');
      setQuizzes(data);
    } catch (err) {
      setError(err.message || 'Error loading quizzes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuizzes();
  }, []);

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setSubject('');
    setDescription('');
  }

  function handleEditClick(quiz) {
    setEditingId(quiz.quiz_id);
    setTitle(quiz.title || '');
    setSubject(quiz.subject || '');
    setDescription(quiz.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !subject.trim()) {
      setError('Title and subject are required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const payload = {
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim(),
      };

      const url = editingId ? `/api/admin/quizzes/${editingId}` : '/api/admin/quizzes';
      const method = editingId ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save quiz');

      resetForm();
      await fetchQuizzes();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(quiz) {
    const confirmed = window.confirm(
      `Delete quiz "${quiz.title}"?\n\nWarning: All of its questions and student attempts will also be permanently deleted!`
    );
    if (!confirmed) return;

    try {
      setError('');
      const res = await adminFetch(`/api/admin/quizzes/${quiz.quiz_id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete quiz');

      if (editingId === quiz.quiz_id) {
        resetForm();
      }
      await fetchQuizzes();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  }

  return (
    <AdminGate>
      <div>
        <div className="admin-subnav">
          <Link href="/admin/quizzes" className="btn btn-pink">
            📚 Manage Quizzes
          </Link>
          <Link href="/admin/questions" className="btn btn-blue">
            ❓ Manage Questions (DML & Navigation) →
          </Link>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>
            {editingId ? `Edit Quiz #${editingId}` : 'Add New Quiz'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="quiz-title">
                  Title
                </label>
                <input
                  id="quiz-title"
                  type="text"
                  className="input"
                  placeholder="e.g. Web Basics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="quiz-subject">
                  Subject
                </label>
                <input
                  id="quiz-subject"
                  type="text"
                  className="input"
                  placeholder="e.g. Web Development"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="quiz-desc">
                Description
              </label>
              <input
                id="quiz-desc"
                type="text"
                className="input"
                placeholder="Short summary of the quiz..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-green" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Quiz' : 'Add Quiz'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn btn-card">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <h2 style={{ marginBottom: '1rem' }}>All Quizzes</h2>
        {loading ? (
          <div className="loading-box">Loading...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Description</th>
                  <th>Questions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem' }}>
                      No quizzes found. Add one above!
                    </td>
                  </tr>
                ) : (
                  quizzes.map((q) => (
                    <tr key={q.quiz_id}>
                      <td style={{ fontWeight: 700 }}>{q.quiz_id}</td>
                      <td style={{ fontWeight: 700 }}>{q.title}</td>
                      <td>{q.subject}</td>
                      <td>{q.description || '—'}</td>
                      <td>
                        <span className="badge">{q.question_count}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleEditClick(q)}
                            className="btn btn-sm btn-yellow"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(q)}
                            className="btn btn-sm btn-red"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminGate>
  );
}
