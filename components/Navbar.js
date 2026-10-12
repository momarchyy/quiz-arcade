'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState('light');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/quiz') && sessionStorage.getItem('adminPw')) {
      sessionStorage.removeItem('adminPw');
    }
    function syncAdminStatus() {
      const hasAdmin = Boolean(sessionStorage.getItem('adminPw'));
      setIsAdminLoggedIn(hasAdmin);
    }
    syncAdminStatus();
    window.addEventListener('admin-auth-change', syncAdminStatus);
    window.addEventListener('storage', syncAdminStatus);
    return () => {
      window.removeEventListener('admin-auth-change', syncAdminStatus);
      window.removeEventListener('storage', syncAdminStatus);
    };
  }, [pathname]);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  function handleAdminLogout() {
    sessionStorage.removeItem('adminPw');
    setIsAdminLoggedIn(false);
    window.dispatchEvent(new Event('admin-auth-change'));
    if (pathname.startsWith('/admin')) {
      router.push('/admin/login');
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="logo">
          QUIZ ARCADE
        </Link>
        <nav className="nav-links">
          <Link
            href="/"
            className={`nav-link ${pathname === '/' || pathname.startsWith('/quiz') ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link
            href="/leaderboard"
            className={`nav-link ${pathname.startsWith('/leaderboard') ? 'active' : ''}`}
          >
            Leaderboard
          </Link>
          <Link
            href="/admin/quizzes"
            className={`nav-link ${pathname.startsWith('/admin') ? 'active' : ''}`}
          >
            Admin
          </Link>
          {isAdminLoggedIn && (
            <button
              type="button"
              onClick={handleAdminLogout}
              className="btn btn-sm btn-red"
              title="Log out of Admin session"
            >
              🚪 Logout Admin
            </button>
          )}
          <button type="button" onClick={toggleTheme} className="btn btn-sm btn-blue">
            {theme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
        </nav>
      </div>
    </header>
  );
}
