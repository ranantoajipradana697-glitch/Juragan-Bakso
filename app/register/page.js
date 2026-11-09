'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?tab=register');
  }, [router]);

  return (
    <div className="min-h-screen pt-32 flex flex-col items-center justify-center bg-surface">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-xs font-semibold text-on-surface">Membuka Halaman Pendaftaran Pelanggan Baru...</p>
    </div>
  );
}
