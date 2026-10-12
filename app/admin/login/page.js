'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid password');
      }
      sessionStorage.setItem('adminPw', password);
      window.dispatchEvent(new Event('admin-auth-change'));
      router.push('/admin/quizzes');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto' }}>
      <div className="card accent-yellow">
        <h1>🔒 Admin Login</h1>
        <p>Enter the administrator password to manage quizzes and questions.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">
              Admin Password
            </label>
            <input
              id="admin-password"
              type="password"
              className="input"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-green" disabled={loading}>
            {loading ? 'Verifying...' : 'Login ▶'}
          </button>
        </form>
      </div>
    </div>
  );
}
