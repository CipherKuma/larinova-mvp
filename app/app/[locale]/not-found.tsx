'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    console.log('[404] Page not found, redirecting to home page');
    router.replace('/');
  }, [router]);

  return null;
}
