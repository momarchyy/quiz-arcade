'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGate({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const pw = sessionStorage.getItem('adminPw');
    if (!pw) {
      router.replace('/admin/login');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="container">
        <div className="loading-box">Checking admin access...</div>
      </div>
    );
  }

  return children;
}
