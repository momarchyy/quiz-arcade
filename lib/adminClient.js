export async function adminFetch(url, options = {}) {
  const pw = typeof window !== 'undefined' ? sessionStorage.getItem('adminPw') || '' : '';
  const headers = {
    ...(options.headers || {}),
    'x-admin-password': pw,
  };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    sessionStorage.removeItem('adminPw');
    window.location.href = '/admin/login';
  }

  return res;
}
