'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectParam = searchParams.get('redirect') || '/menu';
  const msgParam = searchParams.get('msg') || '';
  const initialTabParam = searchParams.get('tab') || 'login';
  const roleParam = searchParams.get('role') || '';

  // Jika URL memiliki parameter role=admin, alihkan otomatis ke portal admin khusus
  useEffect(() => {
    if (roleParam === 'admin') {
      router.replace('/admin/login?redirect=' + encodeURIComponent(redirectParam));
    }
  }, [roleParam, redirectParam, router]);

  // Tab State: 'login' atau 'register'
  const [activeTab, setActiveTab] = useState(initialTabParam === 'register' ? 'register' : 'login');
  const [activeUser, setActiveUser] = useState(null);

  // Field Form Login Pelanggan (Kosong secara default demi privasi dan keamanan pengguna)
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Field Form Registrasi Pelanggan Baru
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPassConfirm, setRegPassConfirm] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);

  // Status Feedback & Loading
  const [feedback, setFeedback] = useState({ show: false, message: '', style: '' });
  const [submitting, setSubmitting] = useState(false);

  // Periksa apakah sudah ada sesi yang aktif
  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem('juragan_bakso_user') || localStorage.getItem('juragan_bakso_user');
      if (savedUser) {
        setActiveUser(JSON.parse(savedUser));
      }
    } catch (e) {}

    // Tangani parameter pesan peringatan
    if (msgParam === 'auth_required') {
      showFeedback('Silakan masuk atau daftar akun pelanggan terlebih dahulu untuk melihat menu & memesan.', 'bg-primary-container text-on-primary-container font-bold');
    }
  }, [msgParam]);

  const showFeedback = (msg, style) => {
    setFeedback({ show: true, message: msg, style });
    setTimeout(() => {
      setFeedback({ show: false, message: '', style: '' });
    }, 4500);
  };

  const handleLogoutCurrent = () => {
    try {
      sessionStorage.removeItem('juragan_bakso_user');
      localStorage.removeItem('juragan_bakso_user');
      setActiveUser(null);
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('userSessionChange'));
      showFeedback('Sesi Anda telah diakhiri. Silakan masuk kembali.', 'bg-surface-container-highest text-on-surface');
    } catch (e) {}
  };

  // Submit Login Pelanggan
  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    const cleanPhone = (loginPhone || '').trim();
    const cleanPass = (loginPass || '').trim();

    if (!cleanPhone || !cleanPass) {
      showFeedback('Nomor WhatsApp dan kata sandi wajib diisi.', 'bg-error-container text-on-error-container font-bold');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'customer',
          identifier: cleanPhone,
          password: cleanPass
        })
      });
      const data = await res.json();

      if (data.success && data.user) {
        showFeedback(`Selamat datang kembali, ${data.user.name}! Mengarahkan ke menu...`, 'bg-tertiary text-on-tertiary font-bold');
        localStorage.setItem('juragan_bakso_user', JSON.stringify(data.user));
        sessionStorage.setItem('juragan_bakso_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('userSessionChange'));
        
        const target = redirectParam || '/menu';
        setTimeout(() => {
          router.push(target);
        }, 600);
      } else {
        showFeedback(data.message || 'Nomor WhatsApp atau kata sandi tidak cocok.', 'bg-error-container text-on-error-container');
      }
    } catch (err) {
      showFeedback('Terjadi kesalahan koneksi server: ' + err.message, 'bg-error-container text-on-error-container');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Registrasi Pelanggan Baru
  const handleCustomerRegister = async (e) => {
    e.preventDefault();
    const cleanName = (regName || '').trim();
    const cleanPhone = (regPhone || '').trim();
    const cleanPass = (regPass || '').trim();
    const cleanPassConfirm = (regPassConfirm || '').trim();

    if (!cleanName || !cleanPhone || !cleanPass) {
      showFeedback('Nama lengkap, nomor WhatsApp, dan kata sandi wajib diisi!', 'bg-error-container text-on-error-container font-bold');
      return;
    }

    if (cleanPass !== cleanPassConfirm) {
      showFeedback('Konfirmasi kata sandi tidak sama dengan kata sandi baru Anda!', 'bg-error-container text-on-error-container font-bold');
      return;
    }

    if (cleanPass.length < 6) {
      showFeedback('Kata sandi minimal 6 karakter demi keamanan akun Anda.', 'bg-error-container text-on-error-container font-bold');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          identifier: cleanPhone,
          password: cleanPass
        })
      });
      const data = await res.json();

      if (data.success && data.user) {
        showFeedback(`Pendaftaran akun berhasil! Selamat datang, ${data.user.name}!`, 'bg-tertiary text-on-tertiary font-bold');
        
        // Langsung simpan sesi aktif setelah registrasi berhasil
        localStorage.setItem('juragan_bakso_user', JSON.stringify(data.user));
        sessionStorage.setItem('juragan_bakso_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('userSessionChange'));

        setTimeout(() => {
          router.push('/menu');
        }, 800);
      } else {
        showFeedback(data.message || 'Pendaftaran gagal. Nomor mungkin sudah terdaftar.', 'bg-error-container text-on-error-container');
      }
    } catch (err) {
      showFeedback('Terjadi kesalahan server saat mendaftar: ' + err.message, 'bg-error-container text-on-error-container');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="w-full pt-28 pb-16 bg-surface min-h-[calc(100vh-80px)]">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        
        {/* Banner Alert Feedback */}
        {feedback.show && (
          <div className={`mb-6 p-4 rounded-xl shadow-md text-xs sm:text-sm flex items-start gap-3 transition-all duration-300 ${feedback.style}`}>
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">info</span>
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
              <Link href={activeUser.role === 'admin' ? '/admin' : '/menu'} className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-bold hover:bg-primary-container transition-colors">
                {activeUser.role === 'admin' ? 'Dashboard Admin' : 'Lihat Menu'}
              </Link>
              <button onClick={handleLogoutCurrent} className="px-3 py-1.5 rounded-lg bg-error-container/30 text-error font-bold hover:bg-error-container/50 transition-colors">
                Ganti Akun
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Kolom Kiri: Showcase Pengalaman Pelanggan */}
          <div className="lg:col-span-5 flex flex-col gap-6 order-2 lg:order-1">
            
            {/* Kartu Visual Ambience */}
            <div className="relative overflow-hidden rounded-2xl shadow-md bg-surface-container p-6 flex flex-col justify-between min-h-[350px] border border-outline-variant/30">
              <div className="absolute inset-0 z-0">
                <img 
                  className="w-full h-full object-cover brightness-[0.75] contrast-105" 
                  alt="Bakso Hangat Juragan Bakso" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsneHQKIsUbQOiWTHPDO3Y0tbUWQNA-Hk_Qt63aS6QSZjpO3lR63jfwNy04B-2Y_cks1cSFHlOxCAvxwWeJREmlWl6qrEo1x8Dm24eSToVIS2jcbHm4ImoXQRnj1bCbwE_pzupZMd-cb6WWp0mMdkguJqPuO7woI4WvM8aANe_PnG8cVuusKZ6z1O6QMumkLbladNbWdx_4DAQlcXoOhH3aYXO8rA5ayKsIforQiA"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/90 backdrop-blur-md shadow-sm text-[10px] text-on-surface uppercase font-bold tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                  Buka 10.00 - 21.30 WIB
                </span>
                <span className="font-headline-sm text-sm font-bold text-primary-fixed">#JuraganBakso</span>
              </div>

              <div className="relative z-10 flex flex-col gap-1.5 text-white">
                <span className="text-[11px] uppercase tracking-widest text-primary-fixed-dim font-bold">Portal Khusus Pelanggan</span>
                <h2 className="font-headline-md text-xl md:text-2xl font-bold leading-tight">
                  Pesan Semangkok Bakso Gurih Kapan Saja Langsung ke WhatsApp.
                </h2>
                <p className="text-xs text-white/80 line-clamp-2">
                  Daftarkan akun Anda sekali untuk menyimpan riwayat pesanan, racikan kuah favorit, dan proses checkout kilat.
                </p>
              </div>
            </div>

            {/* Keuntungan Akun Pelanggan */}
            <div className="rounded-2xl p-5 bg-surface-container-highest shadow-sm border border-outline-variant/30 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                <span className="text-xs font-bold text-on-surface">Keuntungan Masuk Akun Pelanggan</span>
              </div>
              <ul className="text-xs text-on-surface-variant flex flex-col gap-2">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[16px] shrink-0 mt-0.5">check_circle</span>
                  <span>Proses pemesanan &amp; checkout cepat langsung ke WhatsApp kasir.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[16px] shrink-0 mt-0.5">check_circle</span>
                  <span>Pantau status antrean dapur secara real-time dari halaman Pesanan Saya.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[16px] shrink-0 mt-0.5">check_circle</span>
                  <span>Akses struk bukti pembayaran digital resmi kapan pun dibutuhkan.</span>
                </li>
              </ul>
            </div>

            {/* Banner Redirect Khusus Admin */}
            <div className="p-4 rounded-xl bg-surface-container-lowest border-2 border-primary/20 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">Staf atau Kasir Toko?</span>
                  <span className="text-[11px] text-on-surface-variant">Masuk melalui Portal Khusus Admin</span>
                </div>
              </div>
              <Link 
                href="/admin/login" 
                className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all shrink-0 shadow-xs"
              >
                Portal Admin →
              </Link>
            </div>

          </div>

          {/* Kolom Kanan: Form Tab Pelanggan (Login & Register) */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-6 sm:p-8 border border-outline-variant/30 flex flex-col gap-6">
              
              {/* Header Tab Switcher (Masuk vs Daftar) */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Akun Pelanggan Juragan Bakso</span>
                <div className="flex items-center p-1 rounded-xl bg-surface-container-low border border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      activeTab === 'login' 
                        ? 'bg-primary text-on-primary shadow-xs' 
                        : 'text-on-surface hover:text-primary hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    <span>Masuk Akun</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      activeTab === 'register' 
                        ? 'bg-primary text-on-primary shadow-xs' 
                        : 'text-on-surface hover:text-primary hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span>Daftar Akun Baru</span>
                  </button>
                </div>
              </div>

              {/* ==================== TAB 1: FORM LOGIN PELANGGAN ==================== */}
              {activeTab === 'login' && (
                <form onSubmit={handleCustomerLogin} className="flex flex-col gap-4 animate-in fade-in duration-200">
                  
                  <div className="flex flex-col gap-0.5">
                    <h3 className="font-headline-sm text-lg font-bold text-on-surface">Masuk ke Akun Pelanggan</h3>
                    <p className="text-xs text-on-surface-variant">
                      Gunakan nomor WhatsApp Anda untuk melanjutkan ke katalog menu dan keranjang.
                    </p>
                  </div>

                  {/* Input Nomor WhatsApp */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                      <span>Nomor WhatsApp / ID Pelanggan</span>
                      <span className="text-[10px] text-on-surface-variant font-mono">Contoh: 0812xxxxxxxx</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">phone_iphone</span>
                      <input 
                        type="text" 
                        required 
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="Masukkan nomor WhatsApp terdaftar"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs sm:text-sm outline-none focus:bg-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Input Password */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-on-surface">Kata Sandi</label>
                      <button 
                        type="button" 
                        onClick={() => showFeedback('Silakan hubungi WhatsApp kami di 0822-9954-8784 untuk reset kata sandi akun pelanggan Anda.', 'bg-surface-container text-on-surface')}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Lupa Kata Sandi?
                      </button>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                      <input 
                        type={showLoginPass ? 'text' : 'password'}
                        required 
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        placeholder="Masukkan kata sandi akun Anda"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs sm:text-sm outline-none focus:bg-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowLoginPass(!showLoginPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-[18px]"
                      >
                        <span className="material-symbols-outlined">{showLoginPass ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Ingat Saya */}
                  <div className="flex items-center gap-2 pt-1">
                    <input 
                      type="checkbox" 
                      id="rememberMe" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="rememberMe" className="text-xs text-on-surface-variant cursor-pointer select-none">
                      Ingat sesi saya di perangkat ini
                    </label>
                  </div>

                  {/* Tombol Submit Login */}
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full mt-2 py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[20px]">login</span>
                    <span>{submitting ? 'Memproses Masuk...' : 'Masuk ke Halaman Menu'}</span>
                  </button>

                  <div className="text-center pt-2 text-xs text-on-surface-variant">
                    <span>Belum memiliki akun pelanggan? </span>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('register')}
                      className="font-bold text-primary hover:underline ml-1"
                    >
                      Daftar Akun Baru Sekarang →
                    </button>
                  </div>

                </form>
              )}

              {/* ==================== TAB 2: FORM REGISTRASI PELANGGAN ==================== */}
              {activeTab === 'register' && (
                <form onSubmit={handleCustomerRegister} className="flex flex-col gap-4 animate-in fade-in duration-200">
                  
                  <div className="flex flex-col gap-0.5">
                    <h3 className="font-headline-sm text-lg font-bold text-on-surface">Pendaftaran Akun Pelanggan Baru</h3>
                    <p className="text-xs text-on-surface-variant">
                      Daftarkan nomor WhatsApp Anda untuk kemudahan pesan antar &amp; update status masakan.
                    </p>
                  </div>

                  {/* Input Nama Lengkap */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface">Nama Lengkap Anda</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">badge</span>
                      <input 
                        type="text" 
                        required 
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs sm:text-sm outline-none focus:bg-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Input Nomor WhatsApp */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                      <span>Nomor WhatsApp Aktif</span>
                      <span className="text-[10px] text-tertiary font-semibold">Tersambung ke Notifikasi Pesanan</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">phone_iphone</span>
                      <input 
                        type="tel" 
                        required 
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Contoh: 081234567890"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs sm:text-sm outline-none focus:bg-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Input Kata Sandi Baru */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-on-surface">Buat Kata Sandi</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">lock</span>
                        <input 
                          type={showRegPass ? 'text' : 'password'}
                          required 
                          minLength={6}
                          value={regPass}
                          onChange={(e) => setRegPass(e.target.value)}
                          placeholder="Min. 6 Karakter"
                          className="w-full pl-9 pr-8 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs outline-none focus:bg-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-on-surface">Ulangi Kata Sandi</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">lock_reset</span>
                        <input 
                          type={showRegPass ? 'text' : 'password'}
                          required 
                          minLength={6}
                          value={regPassConfirm}
                          onChange={(e) => setRegPassConfirm(e.target.value)}
                          placeholder="Konfirmasi"
                          className="w-full pl-9 pr-8 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs outline-none focus:bg-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowRegPass(!showRegPass)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-[16px]"
                        >
                          <span className="material-symbols-outlined">{showRegPass ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Submit Registrasi */}
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full mt-2 py-3.5 px-4 rounded-xl bg-tertiary hover:bg-tertiary-container text-on-tertiary font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                    <span>{submitting ? 'Mendaftarkan Akun Anda...' : 'Daftar Sekarang & Langsung Masuk'}</span>
                  </button>

                  <div className="text-center pt-2 text-xs text-on-surface-variant">
                    <span>Sudah memiliki akun terdaftar? </span>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('login')}
                      className="font-bold text-primary hover:underline ml-1"
                    >
                      Masuk ke Akun Anda →
                    </button>
                  </div>

                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen pt-32 flex flex-col items-center justify-center bg-surface">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-xs text-on-surface-variant">Memuat Form Pelanggan...</p>
        </div>
      }>
        <CustomerLoginForm />
      </Suspense>
    </>
  );
}
