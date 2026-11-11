'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConsoleRoot() {
  const router = useRouter();

  useEffect(() => {
    // If not logged in, go to /login; else /apps
    const token = typeof window !== 'undefined' ? localStorage.getItem('bizbox_token') : null;
    if (!token) {
      router.replace('/login');
    } else {
      router.replace('/apps');
    }
  }, [router]);

  return null;
}
