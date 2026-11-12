'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAuthGuard(requiredRole: 'admin' | 'developer' | 'owner') {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('bizbox_token');
    const userStr = localStorage.getItem('bizbox_user');

    if (!token || !userStr) {
      router.replace('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (requiredRole === 'developer' && user.role !== 'developer' && user.role !== 'admin') {
        router.replace('/login?error=developer_required');
        return;
      }
      setAuthorized(true);
    } catch (e) {
      localStorage.removeItem('bizbox_token');
      localStorage.removeItem('bizbox_user');
      localStorage.removeItem('bizbox_tenant');
      router.replace('/login');
    } finally {
      setChecking(false);
    }
  }, [router, requiredRole]);

  return { authorized, checking };
}
