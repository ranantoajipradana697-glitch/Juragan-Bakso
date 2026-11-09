'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/pembayaran');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-center px-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-xs text-on-surface-variant">Mengarahkan ke Halaman Pembayaran...</p>
    </div>
  );
}
