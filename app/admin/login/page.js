'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectParam = searchParams.get('redirect') || '/admin';
  const msgParam = searchParams.get('msg') || '';

  const [admIdentifier, setAdmIdentifier] = useState('');
  const [admPassword, setAdmPassword] = useState('');
  const [admPin, setAdmPin] = useState('');
  const [showAdmPass, setShowAdmPass] = useState(false);
  const [admKiosk, setAdmKiosk] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ show: false, message: '', style: '' });
  const [activeUser, setActiveUser] = useState(null);

  // Periksa apakah sudah ada sesi admin yang aktif
  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem('juragan_bakso_user') || localStorage.getItem('juragan_bakso_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setActiveUser(u);
        if (u.role === 'admin') {
          // Jika sudah admin, langsung ke dashboard
          // router.push('/admin');
        }
      }
    } catch (e) {}

    // Tangani parameter pesan error
    if (msgParam === 'admin_required') {
      showFeedback('Akses Dibatasi: Silakan login dengan akun Staf Admin untuk membuka Dashboard Kasir & Dapur.', 'bg-primary-container text-on-primary-container font-bold');
    } else if (msgParam === 'admin_only') {
      showFeedback('Akses Ditolak: Anda sedang login sebagai Pelanggan. Dashboard Admin khusus untuk Staf Pengelola Toko.', 'bg-error-container text-on-error-container font-bold');
    }
  }, [msgParam]);

  const showFeedback = (msg, style) => {
    setFeedback({ show: true, message: msg, style });
    setTimeout(() => {
      setFeedback({ show: false, message: '', style: '' });
    }, 5000);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const cleanId = (admIdentifier || '').trim();
    const cleanPass = (admPassword || '').trim();
    const cleanPin = (admPin || '').trim();

    if (!cleanId || !cleanPass) {
      showFeedback('Email / Nomor WhatsApp Admin dan Kata Sandi wajib diisi.', 'bg-error-container text-on-error-container font-bold');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'admin',
          identifier: cleanId,
          password: cleanPass,
          pin: cleanPin
        })
      });
      const data = await res.json();

      if (data.success && data.user) {
        showFeedback('Autentikasi Staf Berhasil! Membuka Terminal Kasir & Dashboard...', 'bg-inverse-surface text-inverse-on-surface');
        localStorage.setItem('juragan_bakso_user', JSON.stringify(data.user));
        sessionStorage.setItem('juragan_bakso_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('userSessionChange'));

        const target = redirectParam || '/admin';
        setTimeout(() => {
          router.push(target);
        }, 600);
      } else {
        showFeedback(data.message || 'Autentikasi admin gagal, periksa email, kata sandi, atau PIN kasir Anda.', 'bg-error-container text-on-error-container');
      }
    } catch (err) {
      showFeedback('Terjadi kesalahan server: ' + err.message, 'bg-error-container text-on-error-container');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoutCurrent = () => {
    try {
      sessionStorage.removeItem('juragan_bakso_user');
      localStorage.removeItem('juragan_bakso_user');
      setActiveUser(null);
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('userSessionChange'));
      showFeedback('Sesi telah diakhiri. Silakan login kembali dengan akun Admin.', 'bg-surface-container-highest text-on-surface');
    } catch (e) {}
  };

  return (
    <main className="w-full pt-28 pb-16 bg-surface min-h-[calc(100vh-80px)]">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        
        {/* Banner Alert Feedback */}
        {feedback.show && (
          <div className={`mb-6 p-4 rounded-xl shadow-md text-xs sm:text-sm flex items-start gap-3 transition-all duration-300 ${feedback.style}`}>
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">verified_user</span>
            <div className="flex-1 leading-relaxed">{feedback.message}</div>
            <button onClick={() => setFeedback({ show: false, message: '', style: '' })} className="hover:opacity-75">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Info Sesi Aktif */}
        {activeUser && (
          <div className="mb-6 p-4 rounded-xl bg-surface-container-highest border border-outline-variant/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[20px]">account_circle</span>
              <div>
                <span className="font-bold text-on-surface">Sedang Login: {activeUser.name}</span>
                <span className="text-on-surface-variant ml-1.5 font-mono">({activeUser.role.toUpperCase()})</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeUser.role === 'admin' ? (
                <Link href="/admin" className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-bold hover:bg-primary-container transition-colors">
                  Buka Dashboard
                </Link>
              ) : (
                <span className="text-[11px] text-secondary font-bold">Harap Masuk Akun Admin</span>
              )}
              <button onClick={handleLogoutCurrent} className="px-3 py-1.5 rounded-lg bg-error-container/30 text-error font-bold hover:bg-error-container/50 transition-colors">
                Ganti Akun
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Kolom Kiri: Showcase Backoffice & SOP */}
          <div className="lg:col-span-5 flex flex-col gap-5 order-2 lg:order-1">
            
            <div className="p-6 rounded-2xl bg-inverse-surface text-inverse-on-surface shadow-xl flex flex-col justify-between gap-4 border border-outline-variant/20 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary-fixed text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse"></span>
                  PORTAL INTERNAL TOKO
                </span>
                <span className="material-symbols-outlined text-primary-fixed text-[24px]">point_of_sale</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <h2 className="font-headline-sm text-xl font-bold text-white">
                  Terminal Kasir POS &amp; Dapur Juragan Bakso
                </h2>
                <p className="text-xs text-surface-container-high leading-relaxed opacity-90">
                  Halaman ini khusus untuk staf kasir, koki dapur, dan pemilik warung. Tidak disediakan pendaftaran publik untuk menjaga kerahasiaan data operasional dan keuangan.
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex flex-col gap-2 text-[11px]">
                <div className="flex items-center gap-2 text-surface-container-high">
                  <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">check_circle</span>
                  <span>Kelola Menu (Tambah, Edit, Hapus, Restock)</span>
                </div>
                <div className="flex items-center gap-2 text-surface-container-high">
                  <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">check_circle</span>
                  <span>Pantau Pesanan Masuk &amp; Antrean KDS Real-Time</span>
                </div>
                <div className="flex items-center gap-2 text-surface-container-high">
                  <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">check_circle</span>
                  <span>Simulasi Cetak Struk Thermal Kasir &amp; Laporan Omzet</span>
                </div>
              </div>
            </div>

            {/* Protokol Keamanan Kasir */}
            <div className="rounded-2xl p-5 bg-surface-container-highest shadow-sm border border-outline-variant/30 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">security</span>
                <span className="text-xs font-bold text-on-surface">Protokol Keamanan Kasir &amp; POS</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Setiap staf kasir dan operasional dapur wajib menggunakan kredensial akun terverifikasi dan PIN otorisasi pengaman. Hubungi Manager Toko jika membutuhkan akses akun.
              </p>
            </div>

            {/* Link Balik ke Customer Login */}
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">person</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">Bukan Staf Toko?</span>
                  <span className="text-[11px] text-on-surface-variant">Masuk sebagai pelanggan untuk pesan menu</span>
                </div>
              </div>
              <Link 
                href="/login" 
                className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-dim text-primary text-xs font-bold transition-colors shrink-0"
              >
                Login Pelanggan →
              </Link>
            </div>

          </div>

          {/* Kolom Kanan: Form Login Langsung Admin */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-6 sm:p-8 border border-outline-variant/30 flex flex-col gap-6">
              
              <div className="flex items-center gap-3 border-b border-surface-container-highest pb-4">
                <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Akses Terbatas Staf</span>
                  <h1 className="font-headline-sm text-xl sm:text-2xl font-bold text-on-surface">
                    Login Staf Admin Kasir
                  </h1>
                </div>
              </div>

              <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
                
                {/* Field Identifier Staf */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                    <span>Email Staf / ID Pengelola</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">badge</span>
                    <input 
                      type="text" 
                      required 
                      value={admIdentifier}
                      onChange={(e) => setAdmIdentifier(e.target.value)}
                      placeholder="Masukkan email staf / ID kasir"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs sm:text-sm outline-none focus:bg-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Field Password Staf */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                    <span>Kata Sandi Master</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                    <input 
                      type={showAdmPass ? 'text' : 'password'}
                      required 
                      value={admPassword}
                      onChange={(e) => setAdmPassword(e.target.value)}
                      placeholder="Masukkan kata sandi master"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs sm:text-sm outline-none focus:bg-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowAdmPass(!showAdmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-[18px]"
                    >
                      <span className="material-symbols-outlined">{showAdmPass ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {/* Field PIN Kasir 6-Digit */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                      <span>PIN Pengaman Kasir (6 Digit)</span>
                      <span className="material-symbols-outlined text-primary text-[14px]">pin</span>
                    </label>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">dialpad</span>
                    <input 
                      type="password" 
                      maxLength={6}
                      required 
                      value={admPin}
                      onChange={(e) => setAdmPin(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Masukkan PIN 6 digit"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs sm:text-sm tracking-widest font-mono font-bold outline-none focus:bg-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-on-surface-variant">
                    PIN otentikasi lapis ganda kasir untuk verifikasi transaksi &amp; cetak struk POS.
                  </span>
                </div>

                {/* Kiosk Mode Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input 
                    type="checkbox" 
                    id="admKiosk" 
                    checked={admKiosk}
                    onChange={(e) => setAdmKiosk(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="admKiosk" className="text-xs text-on-surface-variant cursor-pointer select-none">
                    Aktifkan Mode Kiosk / Kasir Layar Penuh POS
                  </label>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px]">terminal</span>
                  <span>{submitting ? 'Memverifikasi Staf Admin...' : 'Masuk ke Terminal Kasir & Dashboard'}</span>
                </button>

              </form>

              <div className="pt-4 border-t border-surface-container-highest text-center text-xs text-on-surface-variant">
                <span>Membutuhkan bantuan teknis login admin? Hubungi Head Office via WhatsApp: </span>
                <a href="https://wa.me/6282299548784" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">
                  0822-9954-8784
                </a>
              </div>

            </div>
          </div>

        </div>

      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen pt-32 flex flex-col items-center justify-center bg-surface">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-xs text-on-surface-variant">Memuat Portal Admin...</p>
        </div>
      }>
        <AdminLoginForm />
      </Suspense>
    </>
  );
}
