'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export const WA_ORDER_URL = "https://api.whatsapp.com/send?phone=6282299548784&text=" + encodeURIComponent(
  `Halo Juragan Bakso! 🍜\nSaya ingin memesan bakso via WhatsApp:\n\n` +
  `• Nama Pemesan: \n` +
  `• Pilihan Menu: \n` +
  `• Jumlah Porsi: \n` +
  `• Opsi Layanan: (Makan di Tempat / Bungkus / Pesan Antar)\n` +
  `• Alamat / No. Meja: \n` +
  `• Catatan Racikan: (Contoh: Kuah dipisah, banyakin sambal)\n` +
  `• Metode Pembayaran: (QRIS Instan / Tunai)\n\n` +
  `Mohon konfirmasi ketersediaan menu dan total harganya ya, terima kasih! 🙏`
);

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('beranda');

  // Sinkronisasi tombol navbar aktif dengan posisi scroll di Beranda
  useEffect(() => {
    if (pathname !== '/') return;

    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (['tentang', 'cara-pesan', 'kontak-lokasi'].includes(hash)) {
        setActiveSection(hash);
      }
    }

    const handleScroll = () => {
      const scrollPos = window.scrollY + 160; // Offset navbar
      const tentangEl = document.getElementById('tentang');
      const caraPesanEl = document.getElementById('cara-pesan');
      const kontakEl = document.getElementById('kontak-lokasi');

      if (kontakEl && scrollPos >= kontakEl.offsetTop - 50) {
        setActiveSection('kontak-lokasi');
      } else if (caraPesanEl && scrollPos >= caraPesanEl.offsetTop - 50) {
        setActiveSection('cara-pesan');
      } else if (tentangEl && scrollPos >= tentangEl.offsetTop - 50) {
        setActiveSection('tentang');
      } else {
        setActiveSection('beranda');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // 1. Fetch Store Status & Listen to Auth/Cart State
  useEffect(() => {
    // Fetch live store status
    fetch('/api/settings')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setIsOpen(Boolean(json.data.is_open));
        }
      })
      .catch(() => {});

    const syncSession = () => {
      try {
        // Read Cart
        const savedCart = localStorage.getItem('juragan_bakso_cart');
        if (savedCart) {
          const items = JSON.parse(savedCart);
          const total = items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
          setCartCount(total);
        } else {
          setCartCount(0);
        }

        // Read User Auth
        const savedUser = sessionStorage.getItem('juragan_bakso_user') || localStorage.getItem('juragan_bakso_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      }
    };

    syncSession();
    window.addEventListener('storage', syncSession);
    window.addEventListener('userSessionChange', syncSession);

    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('userSessionChange', syncSession);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('juragan_bakso_user');
      localStorage.removeItem('juragan_bakso_user');
      setUser(null);
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('userSessionChange'));
      router.push('/');
    } catch (e) {
      window.location.href = '/';
    }
  };

  // Smooth scroll handler untuk tautan anchor section
  const handleScrollTo = (e, targetId) => {
    setActiveSection(targetId);
    if (pathname === '/') {
      if (e) e.preventDefault();
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', `#${targetId}`);
        setMobileMenuOpen(false);
      }
    } else {
      setMobileMenuOpen(false);
    }
  };

  const handleScrollToTop = (e) => {
    setActiveSection('beranda');
    if (pathname === '/') {
      if (e) e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState(null, '', '/');
      setMobileMenuOpen(false);
    } else {
      setMobileMenuOpen(false);
    }
  };

  // Jangan tampilkan navbar landing jika berada di tampilan aplikasi masing-masing user (/menu, /pembayaran, /checkout, /admin, atau /pesanan)
  if (['/menu', '/pembayaran', '/checkout', '/admin', '/pesanan'].includes(pathname) || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 shadow-sm">
      <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        
        {/* === SISI KIRI: BRAND & STATUS TOKO === */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img 
              alt="Logo Juragan Bakso" 
              className="h-10 w-10 object-contain rounded-lg p-0.5 bg-surface-container drop-shadow-xs" 
              src="/logo.png"
            />
            <div className="flex flex-col">
              <span className="font-headline-sm text-base sm:text-lg font-bold text-primary tracking-tight whitespace-nowrap group-hover:text-primary-container transition-colors">
                Juragan Bakso
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                  isOpen ? 'bg-tertiary-container/15 text-tertiary' : 'bg-surface-container-high text-outline'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isOpen ? 'bg-tertiary animate-pulse' : 'bg-outline'}`}></span>
                  {isOpen ? 'Buka' : 'Tutup'}
                </span>
                <span className="text-[10px] sm:text-[11px] text-on-surface-variant font-medium whitespace-nowrap">
                  10.00 - 21.30 WIB
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* === SISI TENGAH: NAVIGASI DINAMIS DENGAN PILL COKLAT AKTIF BERGESER (DESKTOP) === */}
        <nav className="hidden lg:flex items-center gap-1 bg-surface-container-low/90 p-1.5 rounded-full border border-outline-variant/30 shadow-xs relative">
          
          {/* 1. Belum Login: Link halaman Beranda dengan pill coklat bergeser */}
          {!user && (
            <>
              <Link 
                href="/" 
                onClick={handleScrollToTop}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ease-out whitespace-nowrap ${
                  pathname === '/' && activeSection === 'beranda' 
                    ? 'bg-primary text-on-primary shadow-xs scale-[1.03]' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                }`}
              >
                Beranda
              </Link>
              <Link 
                href="/#tentang" 
                onClick={(e) => handleScrollTo(e, 'tentang')}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ease-out whitespace-nowrap ${
                  pathname === '/' && activeSection === 'tentang' 
                    ? 'bg-primary text-on-primary shadow-xs scale-[1.03]' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                }`}
              >
                Tentang Warung
              </Link>
              <Link 
                href="/#cara-pesan" 
                onClick={(e) => handleScrollTo(e, 'cara-pesan')}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ease-out whitespace-nowrap ${
                  pathname === '/' && activeSection === 'cara-pesan' 
                    ? 'bg-primary text-on-primary shadow-xs scale-[1.03]' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                }`}
              >
                Cara Pesan
              </Link>
              <Link 
                href="/#kontak-lokasi" 
                onClick={(e) => handleScrollTo(e, 'kontak-lokasi')}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ease-out whitespace-nowrap ${
                  pathname === '/' && activeSection === 'kontak-lokasi' 
                    ? 'bg-primary text-on-primary shadow-xs scale-[1.03]' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                }`}
              >
                Kontak &amp; Lokasi
              </Link>
            </>
          )}

          {/* 2. Login sebagai Customer: Beranda + Akses Menu + Panduan */}
          {user && user.role === 'customer' && (
            <>
              <Link 
                href="/" 
                onClick={handleScrollToTop}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ease-out whitespace-nowrap ${
                  pathname === '/' && activeSection === 'beranda' 
                    ? 'bg-primary text-on-primary shadow-xs scale-[1.03]' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                }`}
              >
                Beranda
              </Link>
              <Link 
                href="/menu" 
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ease-out whitespace-nowrap flex items-center gap-1.5 ${
                  pathname === '/menu' 
                    ? 'bg-primary text-on-primary shadow-xs scale-[1.03]' 
                    : 'text-primary hover:bg-primary-fixed/20'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">restaurant_menu</span>
                <span>Daftar Menu &amp; Pesan</span>
              </Link>
              <Link 
                href="/#cara-pesan" 
                onClick={(e) => handleScrollTo(e, 'cara-pesan')}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ease-out whitespace-nowrap ${
                  pathname === '/' && activeSection === 'cara-pesan' 
                    ? 'bg-primary text-on-primary shadow-xs scale-[1.03]' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                }`}
              >
                Cara Pesan
              </Link>
              <Link 
                href="/#kontak-lokasi" 
                onClick={(e) => handleScrollTo(e, 'kontak-lokasi')}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ease-out whitespace-nowrap ${
                  pathname === '/' && activeSection === 'kontak-lokasi' 
                    ? 'bg-primary text-on-primary shadow-xs scale-[1.03]' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                }`}
              >
                Lokasi Gerai
              </Link>
            </>
          )}

          {/* 3. Login sebagai Admin: Dashboard Kasir + Kelola Menu + Beranda */}
          {user && user.role === 'admin' && (
            <>
              <Link 
                href="/admin" 
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ease-out whitespace-nowrap flex items-center gap-1.5 ${
                  pathname === '/admin' 
                    ? 'bg-primary text-on-primary shadow-xs scale-[1.03]' 
                    : 'text-primary hover:bg-primary-fixed/20'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">point_of_sale</span>
                <span>Dashboard Kasir &amp; Dapur</span>
                <span className="px-1.5 py-0.2 bg-secondary text-white text-[9px] font-bold rounded">Live</span>
              </Link>
              <Link 
                href="/menu" 
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ease-out whitespace-nowrap ${
                  pathname === '/menu' 
                    ? 'bg-primary text-on-primary shadow-xs scale-[1.03]' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                }`}
              >
                Katalog Menu
              </Link>
              <Link 
                href="/" 
                onClick={handleScrollToTop}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ease-out whitespace-nowrap ${
                  pathname === '/' && activeSection === 'beranda' 
                    ? 'bg-primary text-on-primary shadow-xs scale-[1.03]' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                }`}
              >
                Tampilan Beranda
              </Link>
            </>
          )}
        </nav>

        {/* === SISI KANAN: USER ACTION & PROFILE STATE === */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* STATE 1: BELUM LOGIN */}
          {!user && (
            <div className="flex items-center gap-2">
              <a 
                href={WA_ORDER_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-tertiary bg-tertiary-container/10 hover:bg-tertiary-container/20 transition-colors whitespace-nowrap"
                title="Pesan Langsung via WhatsApp dengan Format Otomatis"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>Pesan via WA</span>
              </a>

              <Link 
                href="/pesanan"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors whitespace-nowrap"
                title="Lacak Status Pesanan Anda"
              >
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                <span>Cek Pesanan</span>
              </Link>

              <Link 
                href="/login" 
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold shadow-sm hover:bg-primary-container transition-all hover:scale-[1.02] whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Masuk / Login</span>
              </Link>
            </div>
          )}

          {/* STATE 2: SUDAH LOGIN SEBAGAI CUSTOMER */}
          {user && user.role === 'customer' && (
            <div className="flex items-center gap-2">
              <Link 
                href="/pesanan"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors whitespace-nowrap shadow-xs"
                title="Lacak Status Pesanan Anda"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span className="hidden sm:inline">Cek Pesanan</span>
              </Link>

              <Link 
                href="/menu#cart-section"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition-colors whitespace-nowrap shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">shopping_bag</span>
                <span className="hidden sm:inline">Keranjang</span>
                {cartCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-secondary text-white text-[10px] font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User Identity Pill */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <img 
                  alt="Profile" 
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-primary/30 shrink-0" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_QHwoj-1XuUmGaPva3EoJu_HLwlhEuGYiYhHxgun0oAfbXaY4uZno8XvFscY2tYiaVojci3Et7h0iH6100EaU5JBa3oouVecRos3z15BzBg88RmwGu7osj5gMaCjcUzA9GizNhyoW7eFOXbwfaXwr66neww-ROCtofANJBnTcDsLvRzBS39IxEoNxwAc7j4Ay0FxDygu6JSKTzQ0pc6RTv2IQPHtxNvJabBZaFDY"
                />
                <div className="hidden sm:flex flex-col text-left max-w-[110px]">
                  <span className="text-xs font-bold text-on-surface truncate leading-tight">
                    {user.name || 'Pelanggan'}
                  </span>
                  <span className="text-[10px] font-semibold text-tertiary leading-none">
                    Customer
                  </span>
                </div>
                <button 
                  onClick={handleLogout} 
                  title="Keluar dari akun" 
                  className="p-1 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: SUDAH LOGIN SEBAGAI ADMIN */}
          {user && user.role === 'admin' && (
            <div className="flex items-center gap-2">
              <Link 
                href="/admin" 
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                <span>Dashboard Kasir</span>
              </Link>

              {/* Admin Identity Pill */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-primary-fixed/25 border border-primary/20">
                <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0">
                  ADM
                </div>
                <div className="hidden sm:flex flex-col text-left max-w-[110px]">
                  <span className="text-xs font-bold text-on-surface truncate leading-tight">
                    {user.name || 'Admin Kasir'}
                  </span>
                  <span className="text-[10px] font-bold text-primary leading-none uppercase">
                    Admin Staff
                  </span>
                </div>
                <button 
                  onClick={handleLogout} 
                  title="Tutup Sesi Admin (Keluar)" 
                  className="p-1 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </button>
              </div>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="lg:hidden p-2 rounded-xl text-on-surface hover:bg-surface-container-high transition-colors"
            aria-label="Toggle menu navigasi"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* === MOBILE DRAWER DROPDOWN (RAPI & TERSTRUKTUR DI LAYAR KECIL) === */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-outline-variant/20 bg-surface/98 backdrop-blur-xl px-4 py-4 flex flex-col gap-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
          
          {/* User Status Bar di Mobile */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
                  {user.role === 'admin' ? 'AD' : user.name?.charAt(0) || 'C'}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">{user.name}</span>
                  <span className="text-[10px] font-semibold text-primary capitalize">Peran: {user.role}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>Anda belum masuk ke akun</span>
              </div>
            )}

            {user ? (
              <button 
                onClick={handleLogout}
                className="px-2.5 py-1 rounded-lg bg-error-container/30 text-error font-bold text-xs flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">logout</span>
                <span>Keluar</span>
              </button>
            ) : (
              <Link 
                href="/login"
                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-bold text-xs flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">login</span>
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Links Navigasi Mobile */}
          <div className="flex flex-col gap-1">
            <Link 
              href="/" 
              onClick={handleScrollToTop}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                pathname === '/' && activeSection === 'beranda' ? 'bg-primary text-on-primary font-bold shadow-xs' : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              <span>Beranda</span>
            </Link>

            <Link 
              href="/pesanan" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 text-on-surface hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">receipt_long</span>
              <span>Cek Status Pesanan</span>
            </Link>

            {/* Menu katalog hanya muncul jika sudah login (customer/admin) */}
            {user && (
              <Link 
                href="/menu" 
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                  pathname === '/menu' ? 'bg-primary text-on-primary font-bold shadow-xs' : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
                <span>Daftar Menu &amp; Pesan</span>
              </Link>
            )}

            {/* Admin Dashboard hanya muncul jika login sebagai admin */}
            {user && user.role === 'admin' && (
              <Link 
                href="/admin" 
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                  pathname === '/admin' ? 'bg-primary text-on-primary font-bold shadow-xs' : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
                <span>Dashboard Kasir &amp; Dapur</span>
              </Link>
            )}

            <Link 
              href="/#tentang" 
              onClick={(e) => handleScrollTo(e, 'tentang')}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                pathname === '/' && activeSection === 'tentang' ? 'bg-primary text-on-primary font-bold shadow-xs' : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              <span>Tentang Warung</span>
            </Link>

            <Link 
              href="/#cara-pesan" 
              onClick={(e) => handleScrollTo(e, 'cara-pesan')}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                pathname === '/' && activeSection === 'cara-pesan' ? 'bg-primary text-on-primary font-bold shadow-xs' : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">checklist</span>
              <span>Cara Pemesanan</span>
            </Link>

            <Link 
              href="/#kontak-lokasi" 
              onClick={(e) => handleScrollTo(e, 'kontak-lokasi')}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                pathname === '/' && activeSection === 'kontak-lokasi' ? 'bg-primary text-on-primary font-bold shadow-xs' : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">pin_drop</span>
              <span>Kontak &amp; Lokasi Gerai</span>
            </Link>

            {!user && (
              <div className="pt-2 mt-2 border-t border-surface-container-highest flex flex-col gap-1">
                <Link 
                  href="/admin/login" 
                  className="px-3 py-2 rounded-xl text-xs font-bold text-primary hover:bg-primary-fixed/20 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                  <span>Portal Khusus Staf / Kasir Admin →</span>
                </Link>
              </div>
            )}
          </div>

          {/* Quick WhatsApp Support with Auto-Message */}
          <a 
            href={WA_ORDER_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-tertiary text-on-tertiary text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-tertiary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            <span>Pesan Langsung via WhatsApp</span>
          </a>
        </div>
      )}
    </header>
  );
}
