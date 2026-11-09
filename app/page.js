'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const WA_ORDER_URL = "https://wa.me/6282299548784?text=" + encodeURIComponent(
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

export default function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const syncUser = () => {
      try {
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

    syncUser();
    window.addEventListener('storage', syncUser);
    window.addEventListener('userSessionChange', syncUser);

    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('userSessionChange', syncUser);
    };
  }, []);

  // Determine dynamic link targets based on auth state
  const menuTarget = user ? '/menu' : '/login?redirect=/menu&msg=auth_required';

  return (
    <>
      <Navbar />

      <main className="w-full pt-20 bg-surface">
        
        {/* 1. HERO SECTION */}
        <section className="relative w-full pt-12 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-surface-container-high via-surface-container-low to-surface">
          <div className="absolute -top-24 right-0 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-10 -left-20 w-80 h-80 bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            
            {/* Left Editorial Pitch */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary text-xs font-bold shadow-xs whitespace-nowrap">
                  <span className="material-symbols-outlined text-[15px]">verified</span>
                  100% Halal MUI Resmi
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest text-on-surface text-xs font-medium whitespace-nowrap">
                  <span className="material-symbols-outlined text-primary text-[15px]">eco</span>
                  Daging Sapi Segar Tiap Hari
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest text-on-surface text-xs font-medium whitespace-nowrap">
                  <span className="material-symbols-outlined text-secondary text-[15px]">health_and_safety</span>
                  Tanpa Bahan Pengawet
                </span>
              </div>

              {/* Status Sesi Login User */}
              {user ? (
                <div className="p-3 rounded-xl bg-tertiary-container/15 border border-tertiary/30 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">account_circle</span>
                    <span>
                      Selamat datang, <strong>{user.name}</strong> ({user.role === 'admin' ? 'Administrator' : 'Pelanggan'})!
                    </span>
                  </div>
                  <Link 
                    href={user.role === 'admin' ? '/admin' : '/menu'} 
                    className="font-bold text-tertiary hover:underline whitespace-nowrap"
                  >
                    Buka {user.role === 'admin' ? 'Dashboard Kasir' : 'Daftar Menu'} &rarr;
                  </Link>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-surface-container-highest border border-outline-variant/30 flex items-center justify-between gap-3 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">info</span>
                    <span>Masuk ke akun Anda untuk melihat seluruh menu dan memesan langsung secara online.</span>
                  </div>
                  <Link href="/login" className="font-bold text-primary hover:underline whitespace-nowrap">
                    Masuk Sekarang &rarr;
                  </Link>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <span className="text-xs md:text-sm text-primary tracking-widest uppercase font-bold">
                  Resep Tradisi Autentik Sejak 1998
                </span>
                <h1 className="font-display-lg text-3xl md:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
                  Cita Rasa Bakso Sapi Asli Nusantara, <span className="text-primary italic">Kuah Gurih Rempah Warisan</span>
                </h1>
              </div>

              <p className="text-base md:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
                Daging sapi pilihan segar 100%, kuah kaldu sapi sumsum kental mendidih 12 jam, dipadu racikan bumbu rempah alami tanpa pengawet. Gurih mantap sampai tetes terakhir.
              </p>

              {/* CTA Buttons yang menyesuaikan status login */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {user ? (
                  // Jika SUDAH Login
                  <>
                    <Link 
                      href={user.role === 'admin' ? '/admin' : '/menu'} 
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-on-primary font-bold shadow-md hover:bg-primary-container transition-all hover:scale-[1.02] whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {user.role === 'admin' ? 'point_of_sale' : 'restaurant_menu'}
                      </span>
                      <span>
                        {user.role === 'admin' ? 'Buka Dashboard Kasir & Dapur' : 'Lihat Menu & Pesan Sekarang'}
                      </span>
                    </Link>
                    {user.role === 'customer' && (
                      <Link 
                        href="/menu#cart-section"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold transition-all shadow-xs whitespace-nowrap"
                      >
                        <span className="material-symbols-outlined text-[20px] text-primary">shopping_bag</span>
                        <span>Buka Keranjang Saya</span>
                      </Link>
                    )}
                  </>
                ) : (
                  // Jika BELUM Login: Flow mewajibkan login sebelum bisa memesan
                  <>
                    <Link 
                      href="/login?redirect=/menu&msg=auth_required" 
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-on-primary font-bold shadow-md hover:bg-primary-container transition-all hover:scale-[1.02] whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-[20px]">login</span>
                      <span>Masuk untuk Mulai Pesan</span>
                    </Link>
                    <a 
                      href={WA_ORDER_URL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-tertiary text-on-tertiary font-bold shadow-xs hover:bg-tertiary-container transition-all hover:scale-[1.02] whitespace-nowrap"
                      title="Pesan Langsung via WhatsApp dengan Format Pesanan Otomatis"
                    >
                      <span className="material-symbols-outlined text-[20px]">chat</span>
                      <span>Pesan Cepat via WhatsApp</span>
                    </a>
                  </>
                )}
              </div>

              {/* Social Proof Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-outline-variant/30 mt-2">
                <div className="flex flex-col">
                  <span className="font-headline-lg text-2xl md:text-3xl text-primary font-extrabold">26+ Thn</span>
                  <span className="text-xs md:text-sm text-on-surface-variant">Warisan Khas Solo &amp; Wonogiri</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-lg text-2xl md:text-3xl text-secondary font-extrabold">850+</span>
                  <span className="text-xs md:text-sm text-on-surface-variant">Mangkok Terjual Tiap Hari</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-lg text-2xl md:text-3xl text-tertiary font-extrabold">4.9 / 5</span>
                  <span className="text-xs md:text-sm text-on-surface-variant">Ulasan 4.200+ Pelanggan</span>
                </div>
              </div>
            </div>

            {/* Right Visual Hero Composite */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md lg:max-w-none aspect-square rounded-2xl overflow-hidden shadow-xl bg-surface-container">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Semangkuk Bakso Hangat Juragan Bakso" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCavvOMkGAMJ7VcudVIt0lHlsgfMnYx0evtdOVuoyNYAyr8rAS0pBvDF_gj52Rj0qRAjbWkFvhE7nHvt-YVScQiy8xLlAPDBmDLX-ZmP70zRVtsT_Ca55OB_4_x0rr3ZYDB6ZUS-MOqOHa6ty4qld5dyoKzGXR8i1mGtJe7x3LoGTddyTFzOZZjzxGCkEM2A73l07fhk1NDV7o9S9UAAJ9UCXEUMOFx8xeN8d4KmhY"
                />
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-surface/95 backdrop-blur-md rounded-xl shadow-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[24px]">soup_kitchen</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface">Sumsum Tulang Sapi Murni</span>
                      <span className="text-xs text-on-surface-variant">Tanpa MSG berlebih, kaldu alami kental</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-bold shrink-0">
                    Favorit #1
                  </span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 2. OPERATIONAL INFO BAR */}
        <section className="w-full bg-surface-container-lowest border-y border-outline-variant/30 py-6 px-4 sm:px-6 lg:px-8" id="jam-operasional">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-center">
            
            {/* Operational Hours */}
            <div className="lg:col-span-4 flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-fixed/40 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">schedule</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-on-surface">Jam Operasional</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary-container/15 text-tertiary">
                    Buka Setiap Hari
                  </span>
                </div>
                <span className="text-base font-bold text-on-surface mt-0.5">Senin - Minggu: 10.00 - 21.30 WIB</span>
                <span className="text-xs text-tertiary font-semibold">Melayani Makan di Tempat, Bungkus &amp; Antar</span>
              </div>
            </div>

            {/* Address */}
            <div className="lg:col-span-4 flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">pin_drop</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-on-surface">Alamat Lengkap Gerai</span>
                <p className="text-sm text-on-surface-variant">Jl. Malaka Baru 1, Jl. Raya BKT Bojong Rangkong No. 039, RT.5/RW.11, Pondok Kopi, Duren Sawit, Jakarta Timur 13460</p>
                <div className="flex items-center gap-1 text-on-surface-variant text-xs mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">local_parking</span>
                  <span>Tepi Jalur BKT • Area Parkir Luas &amp; Nyaman</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-4 flex flex-col gap-2 justify-end">
              <div className="flex items-center gap-2">
                <a 
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-xs font-bold hover:bg-surface-container-highest transition-colors shadow-xs" 
                  href="https://maps.app.goo.gl/VfA2fCtDV8ZXa67d8?g_st=ac" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <span className="material-symbols-outlined text-primary text-[18px]">near_me</span>
                  <span>Google Maps</span>
                </a>
                <a 
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-tertiary text-on-tertiary text-xs font-bold hover:bg-tertiary-container transition-colors shadow-xs" 
                  href={WA_ORDER_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="Kirim Pesanan via WhatsApp Otomatis"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span>Pesan via WhatsApp</span>
                </a>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant text-xs px-1">
                <span>Pusat: Pondok Kopi, Jaktim</span>
                <span>WhatsApp: 0822-9954-8784</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. TOP 3 MENU UNGGULAN */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase font-bold text-primary tracking-wider">Paling Digemari Pelanggan</span>
                <h2 className="font-headline-lg text-2xl md:text-3xl font-bold text-on-surface">3 Menu Favorit Legendaris</h2>
                <p className="text-sm text-on-surface-variant max-w-xl">
                  Pilihan utama pecinta bakso nusantara dengan tekstur daging asli dan kuah rempah gurih khas warung kami.
                </p>
              </div>
              <Link 
                className="inline-flex items-center gap-1.5 text-primary text-sm font-bold hover:text-primary-container group whitespace-nowrap" 
                href={menuTarget}
              >
                <span>{user ? 'Jelajahi Seluruh Menu (8+ Pilihan)' : 'Masuk untuk Lihat Semua Menu'}</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Item 1 */}
              <div className="flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group">
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-surface-container">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    alt="Bakso Urat Granat Jumbo" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlG5IThUnnsSf04s_nGZ3NIaMijcFR5xv7_lkwzZzTHrCj54HFlTkPf00D2t6xMUQwcg2X3cqYqvQCazO6GfNPR9_mGETsb30QtoTNqUbnQxPqv7CAujR58Z5Np9rr4I8KfcacABLR7umeiAAGbgknPFY4jvrzvFOqyPRhEsQvnuX5IP25Gc8xO3bXm4CLJFae9IG1KlP2uBa2xSFqMW0od7EitdfjwY3NDPo5-vI" 
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-secondary text-on-secondary text-xs font-bold shadow flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                    <span>Pedas Rawit Level 3</span>
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-surface-container-highest/90 backdrop-blur text-xs font-semibold text-on-surface">
                    Stok: 24 Porsi
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-headline-sm text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                        Bakso Urat Granat Jumbo
                      </h3>
                      <span className="text-base font-bold text-primary shrink-0">Rp 32.000</span>
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-2">
                      Bakso urat jumbo sapi kasar dengan isian racikan cabai rawit pedas meledak, kuah kaldu rempah, dan taburan bawang renyah.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-surface-container">
                    <span className="text-xs text-tertiary flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-[16px]">thumb_up</span> 98% Puas
                    </span>
                    <Link 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-xs" 
                      href={menuTarget}
                    >
                      <span className="material-symbols-outlined text-[16px]">{user ? 'shopping_cart' : 'login'}</span>
                      <span>{user ? 'Pesan Menu Ini' : 'Masuk untuk Pesan'}</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group ring-2 ring-primary/20">
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-surface-container">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    alt="Bakso Halus Komplit Tetelan" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbDeCyDnVOL2BBmoItdgN1cMQBMddSg4m0PtkMZob5JkXQnLM-n_ayf6h57yY09pB3_qiCRAEeft26JGjE0K6zLnWi43vaHx_7kqWx1vnFyflOFb53XEo0H8j5pbSy6GZhlOOcS05UY7SDHze5dsIO4ye8wgvUGPz9LAjGiQw9jbr-cVpQipUAj0s2TZ7BEpkq-r5jT942-1ekc8KSQt4gULNgH9Drjg9qCEVnNh4" 
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary text-on-primary text-xs font-bold shadow flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    <span>Best Seller Favorit</span>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-inverse-surface/85 backdrop-blur text-inverse-on-surface text-xs font-semibold">
                    Ekstra Tetelan Gurih
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-headline-sm text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                        Bakso Halus Komplit Tetelan
                      </h3>
                      <span className="text-base font-bold text-primary shrink-0">Rp 35.000</span>
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-2">
                      5 butir bakso halus lembut kenyal, 1 tahu bakso lembut, dan limpahan tetelan sapi gurih berkaldu sumsum autentik.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-surface-container">
                    <span className="text-xs text-primary font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">verified</span> Paling Laris
                    </span>
                    <Link 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-xs" 
                      href={menuTarget}
                    >
                      <span className="material-symbols-outlined text-[16px]">{user ? 'shopping_cart' : 'login'}</span>
                      <span>{user ? 'Pesan Menu Ini' : 'Masuk untuk Pesan'}</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group">
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-surface-container">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    alt="Es Campur Durian Asli" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3bauJM3uwpbPN2aw5kL18GaX_4Xif9c4Co1Z5GHu6z_xm6tODvur1mjR8aIxIdAy19sxgaeaBoFYt3FVMXvlXuxYPHKeHl9XJ4LVsIXL-JVoVBOiYWOU3e_xdfZWJAHzvTk5JzTYNWbrpTdFnVkWtkvkEUynHs5Ljo8GBpK-3eTdGOvCryqWjT2NKqyBWBIPoVqEp5PqdJopxwB-kg3PkznMDQJlmtw1u0yc4XC0" 
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-tertiary text-on-tertiary text-xs font-bold shadow flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">ac_unit</span>
                    <span>Penyegar Dingin</span>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-headline-sm text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                        Es Campur Durian Asli
                      </h3>
                      <span className="text-base font-bold text-primary shrink-0">Rp 18.000</span>
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-2">
                      Es serut melimpah dengan legitnya daging buah durian asli Medan, kelapa muda, alpukat mentega, dan sirup cocopandan.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-surface-container">
                    <span className="text-xs text-on-surface-variant flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-[16px] text-tertiary">eco</span> Durian Asli
                    </span>
                    <Link 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-xs" 
                      href={menuTarget}
                    >
                      <span className="material-symbols-outlined text-[16px]">{user ? 'shopping_cart' : 'login'}</span>
                      <span>{user ? 'Pesan Menu Ini' : 'Masuk untuk Pesan'}</span>
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. CERITA SINGKAT WARUNG */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-surface-container-low" id="tentang">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6 relative">
              <div className="rounded-2xl overflow-hidden shadow-lg aspect-[4/3] bg-surface-container">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Suasana Dapur Tradisional Juragan Bakso" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsneHQKIsUbQOiWTHPDO3Y0tbUWQNA-Hk_Qt63aS6QSZjpO3lR63jfwNy04B-2Y_cks1cSFHlOxCAvxwWeJREmlWl6qrEo1x8Dm24eSToVIS2jcbHm4ImoXQRnj1bCbwE_pzupZMd-cb6WWp0mMdkguJqPuO7woI4WvM8aANe_PnG8cVuusKZ6z1O6QMumkLbladNbWdx_4DAQlcXoOhH3aYXO8rA5ayKsIforQiA"
                />
              </div>
              <div className="absolute -bottom-6 -right-4 md:right-6 bg-surface-container-lowest p-4 rounded-xl shadow-xl max-w-xs border border-outline-variant/30 hidden sm:block">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary text-[20px]">format_quote</span>
                  <span className="text-xs font-bold text-primary">Prinsip Kami</span>
                </div>
                <p className="text-xs text-on-surface-variant italic">
                  "Kelezatan sejati datang dari kejujuran bahan baku. Kami hanya menggiling daging sapi murni tanpa boraks dan bahan pengawet."
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase font-bold text-primary tracking-widest">Tentang Juragan Bakso</span>
                <h2 className="font-headline-lg text-2xl md:text-3xl font-bold text-on-surface leading-tight">
                  Warisan Rasa Kuah Sumsum Sejak 1998 di Jantung Ibukota
                </h2>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Berawal dari gerobak pikul sederhana di sudut Solo pada tahun 1998, <strong>Juragan Bakso</strong> hadir membawa komitmen menghidangkan bakso sapi dengan standar kualitas tertinggi. Setiap hari sebelum fajar, kami memilih potongan daging paha segar yang langsung digiling halus dan dibentuk tangan secara higienis.
              </p>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Keistimewaan kami terletak pada kuah kaldu sapi sumsum yang digodok perlahan selama 12 jam bersama rempah pala, lada putih Bangka, dan bawang merah goreng wangi. Menghasilkan kuah bening pekat gurih yang menghangatkan jiwa.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-container-lowest shadow-xs">
                  <span className="material-symbols-outlined text-tertiary text-[22px]">health_and_safety</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">100% Bebas Boraks</span>
                    <span className="text-[11px] text-on-surface-variant">Uji Lab Higienis</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-container-lowest shadow-xs">
                  <span className="material-symbols-outlined text-primary text-[22px]">soup_kitchen</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">Kaldu Sumsum 12 Jam</span>
                    <span className="text-[11px] text-on-surface-variant">Rempah Tradisional</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 5. CARA PEMESANAN WHATSAPP */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16" id="cara-pesan">
          <div className="max-w-7xl mx-auto flex flex-col gap-10">
            <div className="text-center flex flex-col items-center gap-2 max-w-2xl mx-auto">
              <span className="text-xs uppercase font-bold text-primary tracking-widest">Alur Cepat &amp; Praktis</span>
              <h2 className="font-headline-lg text-2xl md:text-3xl font-bold text-on-surface">
                Cara Pesan Bakso Langsung ke WhatsApp
              </h2>
              <p className="text-sm text-on-surface-variant">
                Pesan semangkok bakso hangat tanpa ribet unduh aplikasi. Cukup 4 langkah mudah, pesanan Anda langsung tersambung ke WhatsApp penjual dan antrean dapur.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="flex flex-col gap-3 p-6 rounded-2xl bg-surface-container-lowest shadow-xs border border-outline-variant/30">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-lg">01</div>
                <h3 className="text-base font-bold text-on-surface">Masuk ke Akun Anda</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Login dengan nomor HP/WhatsApp pelanggan atau gunakan tombol 1-Klik Demo untuk mengakses menu dan keranjang belanja.
                </p>
              </div>

              <div className="flex flex-col gap-3 p-6 rounded-2xl bg-surface-container-lowest shadow-xs border border-outline-variant/30">
                <div className="w-12 h-12 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center font-bold text-lg">02</div>
                <h3 className="text-base font-bold text-on-surface">Pilih Menu &amp; Porsi</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Buka katalog menu, tentukan porsi bakso kuah, mie ayam, atau gorengan renyah, lalu klik Tambah ke Keranjang.
                </p>
              </div>

              <div className="flex flex-col gap-3 p-6 rounded-2xl bg-surface-container-lowest shadow-xs border border-outline-variant/30">
                <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold text-lg">03</div>
                <h3 className="text-base font-bold text-on-surface">Pilih Opsi Pengiriman</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Pilih apakah Makan di Tempat (isi nomor meja), Bungkus / Takeaway, atau Pesan Antar ke alamat rumah Anda.
                </p>
              </div>

              <div className="flex flex-col gap-3 p-6 rounded-2xl bg-surface-container-lowest shadow-xs border border-outline-variant/30">
                <div className="w-12 h-12 rounded-xl bg-surface-container-highest text-on-surface flex items-center justify-center font-bold text-lg">04</div>
                <h3 className="text-base font-bold text-on-surface">Otomatis Sync ke WhatsApp &amp; Kasir</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Data otomatis tersimpan di antrean sistem kasir &amp; dapur, sekaligus membuka konfirmasi chat WhatsApp dengan format rapi.
                </p>
              </div>

            </div>

            <div className="flex justify-center pt-2">
              <Link 
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold shadow-md transition-all active:scale-95 whitespace-nowrap" 
                href={menuTarget}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {user ? 'restaurant_menu' : 'login'}
                </span>
                <span>{user ? 'Mulai Pesan Sekarang' : 'Masuk untuk Memesan'}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 6. DEDICATED KONTAK & LOKASI GERAI RESMI */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16 lg:py-20 bg-surface-container-low border-t border-outline-variant/30 scroll-mt-24" id="kontak-lokasi">
          <div className="max-w-7xl mx-auto flex flex-col gap-10">
            
            {/* Header Section */}
            <div className="text-center flex flex-col items-center gap-2 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold shadow-xs">
                <span className="material-symbols-outlined text-[15px]">location_on</span>
                Titik Kunjungan &amp; Hubungi Kami
              </span>
              <h2 className="font-headline-lg text-2xl md:text-4xl font-extrabold text-on-surface tracking-tight">
                Lokasi Gerai Juragan Bakso &amp; Kontak Resmi
              </h2>
              <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">
                Kunjungi gerai kami langsung di tepi Jalur BKT Pondok Kopi untuk menikmati semangkuk bakso hangat kuah sumsum, atau hubungi kontak kasir untuk layanan pesan antar cepat.
              </p>
            </div>

            {/* 2-Column Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Kolom Kiri: Peta Lokasi & Detail Alamat */}
              <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-6 shadow-md border border-outline-variant/30 flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-[22px]">store</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-base text-on-surface">Gerai Utama Juragan Bakso</span>
                        <span className="text-xs text-primary font-semibold">Pondok Kopi / BKT Jakarta Timur</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-tertiary-container/15 text-tertiary text-xs font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                      Buka Setiap Hari
                    </span>
                  </div>

                  {/* Alamat Fisik Lengkap */}
                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider text-outline">Alamat Lengkap</span>
                    <p className="text-sm font-semibold text-on-surface leading-relaxed">
                      Jl. Malaka Baru 1, Jl. Raya BKT Bojong Rangkong No. 039, RT.5/RW.11, Pondok Kopi, Kec. Duren Sawit, Kota Jakarta Timur, DKI Jakarta 13460
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-surface-container text-xs text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[16px]">navigation</span>
                        <span>Patokan: Tepi Jalur Banjir Kanal Timur (BKT)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-tertiary text-[16px]">train</span>
                        <span>Dekat Stasiun KRL Klender Baru</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-secondary text-[16px]">local_parking</span>
                        <span>Area Parkir Motor &amp; Mobil Nyaman</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[16px]">table_bar</span>
                        <span>Kapasitas 40+ Tempat Duduk</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Map Preview Box */}
                  <div className="relative w-full h-56 rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container flex items-center justify-center group shadow-inner">
                    <img 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsneHQKIsUbQOiWTHPDO3Y0tbUWQNA-Hk_Qt63aS6QSZjpO3lR63jfwNy04B-2Y_cks1cSFHlOxCAvxwWeJREmlWl6qrEo1x8Dm24eSToVIS2jcbHm4ImoXQRnj1bCbwE_pzupZMd-cb6WWp0mMdkguJqPuO7woI4WvM8aANe_PnG8cVuusKZ6z1O6QMumkLbladNbWdx_4DAQlcXoOhH3aYXO8rA5ayKsIforQiA"
                      alt="Peta dan Suasana Gerai Juragan Bakso"
                      className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-4 text-white">
                      <span className="text-xs uppercase tracking-widest text-primary-fixed font-bold">Google Maps Navigation</span>
                      <span className="text-base font-bold text-white">JURAGAN BAKSO • Pondok Kopi, Duren Sawit</span>
                      <span className="text-xs text-white/80">Jl. Malaka Baru 1, Jl. Raya BKT Bojong Rangkong No. 039</span>
                    </div>
                  </div>
                </div>

                {/* Tombol Buka di Google Maps */}
                <a 
                  href="https://maps.app.goo.gl/VfA2fCtDV8ZXa67d8?g_st=ac" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px]">near_me</span>
                  <span>Buka Navigasi Rute di Google Maps</span>
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </a>
              </div>

              {/* Kolom Kanan: Kartu Kontak Langsung, Jam Buka & QRIS */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                
                {/* Jam Operasional Box */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-md border border-outline-variant/30 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-tertiary-container/20 text-tertiary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]">schedule</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-on-surface">Jam Operasional Layanan</span>
                      <span className="text-xs text-on-surface-variant">Siap melayani pesanan Anda setiap hari</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface">
                    <div className="flex justify-between items-center py-1 border-b border-surface-container">
                      <span className="font-semibold text-on-surface-variant">Senin - Jumat:</span>
                      <strong className="text-primary font-bold">10:00 - 21:30 WIB</strong>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-surface-container">
                      <span className="font-semibold text-on-surface-variant">Sabtu - Minggu:</span>
                      <strong className="text-secondary font-bold">09:30 - 22:00 WIB</strong>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="font-semibold text-on-surface-variant">Layanan Antar Kilat:</span>
                      <strong className="text-tertiary font-bold">15 - 30 Menit Sampai</strong>
                    </div>
                  </div>
                </div>

                {/* Saluran Kontak Resmi */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-md border border-outline-variant/30 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-tertiary text-on-tertiary flex items-center justify-center shadow-xs">
                      <span className="material-symbols-outlined text-[22px]">chat</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-on-surface">Hubungi Kasir Langsung</span>
                      <span className="text-xs text-on-surface-variant">WhatsApp &amp; Panggilan Telepon Resmi</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {/* Tombol WhatsApp Resmi dengan Auto-Message Pesanan */}
                    <a 
                      href={WA_ORDER_URL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-tertiary hover:bg-tertiary-container text-on-tertiary font-bold text-xs sm:text-sm shadow-sm flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.98]"
                      title="Klik untuk langsung membuka WhatsApp dengan format pesan otomatis"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">chat</span>
                        <div className="flex flex-col text-left">
                          <span>Pesan via WhatsApp (Auto-Message)</span>
                          <span className="text-[10px] font-normal opacity-90">+62 822-9954-8784</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </a>

                    {/* Tombol Telepon Langsung */}
                    <a 
                      href="tel:082299548784" 
                      className="w-full py-3 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs sm:text-sm shadow-xs border border-outline-variant/30 flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-primary">call</span>
                        <div className="flex flex-col text-left">
                          <span>Panggilan Telepon</span>
                          <span className="text-[10px] text-on-surface-variant font-normal">0822-9954-8784</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[18px]">phone_in_talk</span>
                    </a>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* Floating Action Button WhatsApp (Auto-Message Langsung) */}
        <aside aria-label="WhatsApp Floating Action Button">
          <a
            href={WA_ORDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-20 right-4 sm:right-6 z-40 px-3.5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group font-bold text-xs border border-white/20"
            title="Klik untuk Pesan Bakso Langsung via WhatsApp (Format Otomatis)"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span className="hidden sm:inline">Pesan via WA</span>
          </a>
        </aside>

      </main>

      {/* FOOTER */}
      <footer className="w-full bg-surface-container-low shadow-[0_1px_8px_rgba(41,37,36,0.04)] border-t border-outline-variant/30">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-surface-container-highest">
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <img 
                  alt="Logo Juragan Bakso" 
                  className="h-8 w-8 object-contain rounded-lg p-0.5 bg-surface-container drop-shadow-xs" 
                  src="/logo.png"
                />
                <span className="font-headline-sm text-lg font-bold text-primary">Juragan Bakso</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Sajian otentik bakso urat dan kuah sumsum rempah warisan nusantara. Dibuat dengan 100% daging sapi pilihan segar setiap hari tanpa bahan pengawet.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-surface-container-highest w-fit">
                <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
                <span className="text-xs font-semibold text-on-surface">Tersertifikasi Halal ID3211000291029</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-on-surface">Alamat &amp; Cabang Utama</span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Jl. Malaka Baru 1, Jl. Raya BKT Bojong Rangkong No. 039, RT.5/RW.11, Pondok Kopi, Duren Sawit, Jakarta Timur 13460
              </p>
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-1">
                <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                <span>Pondok Kopi / Jalur BKT Duren Sawit</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-on-surface">Jam Layanan &amp; Antar</span>
              <div className="flex flex-col gap-1 text-xs text-on-surface-variant">
                <div className="flex justify-between">
                  <span className="font-semibold text-on-surface">Senin - Jumat</span>
                  <span>10:00 - 21:30 WIB</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-on-surface">Sabtu - Minggu</span>
                  <span>09:30 - 22:00 WIB</span>
                </div>
                <div className="flex items-center gap-1 text-tertiary mt-1 font-semibold">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span>Dapur melayani pesanan kilat 15 menit</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold text-on-surface">Kontak &amp; Komunitas</span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Terima pesanan katering, prasmanan pesta, &amp; kemitraan warung.
              </p>
              <div className="flex items-center gap-2">
                <a 
                  href={WA_ORDER_URL} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors"
                  title="Pesan via WhatsApp (Auto-Message)"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                </a>
                <a 
                  href="tel:082299548784" 
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </a>
              </div>
            </div>

          </div>

          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
            <p>© 2025 Juragan Bakso Nusantara. Hak Cipta Dilindungi Undang-Undang.</p>
            <div className="flex items-center gap-4">
              <Link className="hover:text-primary transition-colors" href={menuTarget}>Daftar Menu</Link>
              <Link className="hover:text-primary transition-colors" href="/login">Masuk Akun</Link>
              <Link className="hover:text-primary transition-colors" href={user?.role === 'admin' ? '/admin' : '/admin/login'}>Portal Admin</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
