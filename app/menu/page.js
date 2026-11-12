'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MenuPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [menus, setMenus] = useState([]);
  const [category, setCategory] = useState('semua');
  const [loading, setLoading] = useState(true);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  
  // Cart State
  const [cart, setCart] = useState([]);

  const [toast, setToast] = useState({ show: false, message: '' });

  // 1. Fetch Menus from Backend API (MySQL & Fallback Store)
  const fetchMenus = async (cat = 'semua') => {
    try {
      setLoading(true);
      const url = cat === 'semua' ? `/api/menus?_t=${Date.now()}` : `/api/menus?category=${cat}&_t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        let menuList = json.data;
        const isFromMysql = json.source === 'mysql';

        // Sinkronisasi menu kustom & stok lokal jika Vercel serverless cold-start
        try {
          const localCustom = JSON.parse(localStorage.getItem('juragan_bakso_custom_menus') || '[]');
          if (localCustom.length > 0) {
            // Lindungi stok dari reset serverless cold-start
            const updatedLocal = localCustom.map(lm => {
              const serverMatch = menuList.find(sm => sm.name === lm.name || sm.id === lm.id);
              if (serverMatch) {
                if (isFromMysql) {
                  return {
                    ...lm,
                    stock: Number(serverMatch.stock || 0),
                    is_available: Number(serverMatch.stock || 0) > 0,
                    badge: serverMatch.badge,
                    badge_type: serverMatch.badge_type,
                    price: serverMatch.price
                  };
                }

                const lmStock = Number(lm.stock || 0);
                const smStock = Number(serverMatch.stock || 0);

                if (lm.updatedAt && smStock !== lmStock) {
                  serverMatch.stock = lmStock;
                  serverMatch.is_available = lmStock > 0;
                  serverMatch.badge = lm.badge || (lmStock > 0 ? (lmStock <= 5 ? `Menipis (${lmStock})` : 'Tersedia') : 'Habis / Sold Out');
                  serverMatch.badge_type = lm.badge_type || (lmStock > 0 ? (lmStock <= 5 ? 'primary' : 'tertiary') : 'error');
                  return lm;
                }

                return {
                  ...lm,
                  stock: smStock,
                  is_available: smStock > 0,
                  badge: serverMatch.badge,
                  badge_type: serverMatch.badge_type,
                  price: serverMatch.price
                };
              }
              return lm;
            });

            localStorage.setItem('juragan_bakso_custom_menus', JSON.stringify(updatedLocal));

            // Sinkronkan menuList dengan data lokal yang diproteksi
            menuList = menuList.map(sm => {
              const localMatch = updatedLocal.find(lm => lm.name === sm.name || lm.id === sm.id);
              if (localMatch && localMatch.updatedAt && !isFromMysql) {
                return {
                  ...sm,
                  stock: Number(localMatch.stock || 0),
                  is_available: Number(localMatch.stock || 0) > 0,
                  badge: localMatch.badge,
                  badge_type: localMatch.badge_type
                };
              }
              return sm;
            });

            // Hanya tambahkan menu yang benar-benar belum tercatat di server
            const extra = updatedLocal.filter(lm => !menuList.some(sm => sm.name === lm.name || sm.id === lm.id));
            if (extra.length > 0) {
              if (cat === 'semua') {
                menuList = [...menuList, ...extra];
              } else {
                menuList = [...menuList, ...extra.filter(m => m.category === cat)];
              }
            }
          }
        } catch (storageErr) {}
        setMenus(menuList);
      }
    } catch (e) {
      console.error('Failed to fetch menus:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auth Guard: Wajib login untuk akses pemilihan menu
    try {
      const savedUser = sessionStorage.getItem('juragan_bakso_user') || localStorage.getItem('juragan_bakso_user');
      if (!savedUser) {
        router.push('/login?redirect=/menu&msg=auth_required');
        return;
      }
      const u = JSON.parse(savedUser);
      setCurrentUser(u);
      setCheckingAuth(false);
    } catch (e) {
      router.push('/login?redirect=/menu&msg=auth_required');
      return;
    }

    fetchMenus(category);

    // Load saved cart from localStorage
    try {
      const savedCart = localStorage.getItem('juragan_bakso_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {}

    // Sinkronisasi pembaruan stok lintas tab / window
    const handleSync = () => fetchMenus(category);
    window.addEventListener('stockUpdated', handleSync);
    window.addEventListener('orderCreated', handleSync);

    return () => {
      window.removeEventListener('stockUpdated', handleSync);
      window.removeEventListener('orderCreated', handleSync);
    };
  }, []);

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    fetchMenus(newCat);
  };

  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2500);
  };

  const formatIDR = (num) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  // Cart operations
  const saveCartToStorage = (newCart) => {
    setCart(newCart);
    try {
      localStorage.setItem('juragan_bakso_cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

  const clearCart = () => {
    if (confirm('Apakah Anda yakin ingin membatalkan semua pesanan di keranjang?')) {
      saveCartToStorage([]);
      showToast('Keranjang pesanan telah dikosongkan');
    }
  };

  const addToCart = (menu) => {
    if (menu.stock <= 0 || !menu.is_available) {
      showToast('Maaf, menu ini sedang habis (sold out)');
      return;
    }
    const idx = cart.findIndex(it => (it.id && menu.id && it.id === menu.id) || it.name === menu.name);
    let updated = [...cart];
    if (idx > -1) {
      if (updated[idx].qty < menu.stock) {
        updated[idx].qty += 1;
        showToast(`Ditambahkan +1 ${menu.name}`);
      } else {
        showToast(`Batas stok tercapai (${menu.stock} porsi)`);
        return;
      }
    } else {
      updated.push({
        id: menu.id,
        name: menu.name,
        price: Number(menu.price),
        qty: 1,
        stock: Number(menu.stock)
      });
      showToast(`${menu.name} ditambahkan ke keranjang!`);
    }
    saveCartToStorage(updated);
  };

  const changeQty = (index, delta) => {
    let updated = [...cart];
    const newQty = updated[index].qty + delta;
    if (newQty <= 0) {
      const removed = updated[index].name;
      updated.splice(index, 1);
      showToast(`${removed} dihapus dari keranjang`);
    } else if (newQty > updated[index].stock) {
      showToast(`Stok maksimal hanya ${updated[index].stock} porsi`);
      return;
    } else {
      updated[index].qty = newQty;
    }
    saveCartToStorage(updated);
  };

  const removeItem = (index) => {
    let updated = [...cart];
    const removed = updated[index].name;
    updated.splice(index, 1);
    showToast(`${removed} dihapus dari keranjang`);
    saveCartToStorage(updated);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('juragan_bakso_user');
      localStorage.removeItem('juragan_bakso_user');
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('userSessionChange'));
      router.push('/');
    } catch (e) {
      window.location.href = '/';
    }
  };

  // Navigasi ke Halaman Pembayaran
  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      showToast('Pilih minimal 1 menu sebelum lanjut ke pembayaran');
      return;
    }
    router.push('/pembayaran');
  };

  // Calculations
  const subtotal = cart.reduce((sum, it) => sum + (it.price * it.qty), 0);
  const totalQty = cart.reduce((sum, it) => sum + it.qty, 0);

  // Helper untuk mengecek qty menu di keranjang
  const getItemQtyInCart = (menuName) => {
    const it = cart.find(c => c.name === menuName);
    return it ? it.qty : 0;
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-6 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-base font-bold text-on-surface">Memeriksa Status Login...</h2>
        <p className="text-xs text-on-surface-variant max-w-sm mt-1">
          Halaman katalog menu diproteksi. Mengarahkan Anda ke form login...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col antialiased font-body-md text-on-surface pb-32">
      
      {/* 1. HEADER KHUSUS PORTAL PEMESANAN CUSTOMER (PENGGANTI NAVBAR LANDING) */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 shadow-xs">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Logo & Portal Info */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img 
                alt="Logo Juragan Bakso" 
                className="h-9 w-9 object-contain rounded-lg p-0.5 bg-surface-container drop-shadow-xs" 
                src="/logo.png"
              />
              <div className="flex flex-col">
                <span className="font-headline-sm text-sm sm:text-base font-bold text-primary tracking-tight leading-none group-hover:text-primary-container transition-colors">
                  Juragan Bakso
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                  Portal Pemesanan Pelanggan
                </span>
              </div>
            </Link>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">home</span>
              <span className="hidden sm:inline">Beranda</span>
            </Link>

            <Link 
              href="/pesanan"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors shadow-xs"
              title="Lacak Status Pesanan Anda"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span className="hidden sm:inline">Cek Pesanan</span>
            </Link>

            {/* Profile badge */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                <span className="material-symbols-outlined text-[16px]">person</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-on-surface truncate max-w-[120px] leading-tight">
                  {currentUser?.name || 'Pelanggan'}
                </span>
                <span className="text-[10px] font-semibold text-tertiary leading-none">
                  Pelanggan
                </span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="Keluar dari akun"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-error bg-error-container/20 hover:bg-error-container/40 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. STEP PROGRESS INDICATOR */}
      <div className="w-full bg-surface-container-low border-b border-surface-container py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs">
          
          <div className="flex items-center gap-2 text-primary font-bold">
            <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-[12px] font-bold shadow-xs">
              1
            </span>
            <span className="hidden sm:inline">Langkah 1: Pilih Menu Kuliner</span>
            <span className="sm:hidden">1. Pilih Menu</span>
          </div>

          <span className="text-outline-variant">──────</span>

          <div className="flex items-center gap-2 text-on-surface-variant/70">
            <span className="w-6 h-6 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-[12px] font-bold">
              2
            </span>
            <span className="hidden sm:inline">Langkah 2: Pembayaran &amp; Konfirmasi</span>
            <span className="sm:hidden">2. Pembayaran</span>
          </div>

          <span className="text-outline-variant">──────</span>

          <div className="flex items-center gap-2 text-on-surface-variant/70">
            <span className="w-6 h-6 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-[12px] font-bold">
              3
            </span>
            <span className="hidden sm:inline">Langkah 3: Dapur &amp; Pengiriman</span>
            <span className="sm:hidden">3. Selesai</span>
          </div>

        </div>
      </div>

      {/* 3. MAIN CATALOG AREA */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        
        {/* Top Headline Strip */}
        <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[26px]">restaurant_menu</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-on-surface">Katalog Menu Kuliner Nusantara</h1>
                <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold">
                  100% Daging Sapi Murni
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Pilih menu dan tentukan porsi yang Anda inginkan, lalu tekan tombol <strong>Lanjut ke Pembayaran</strong> di bawah.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-surface-container-high px-3 py-1.5 rounded-full text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-tertiary">bolt</span>
              <span>Proses: <strong>10-15 Menit</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-primary-fixed/50 px-3 py-1.5 rounded-full text-on-primary-fixed-variant font-medium">
              <span className="material-symbols-outlined text-[16px] text-primary">payments</span>
              <span>QRIS &amp; Tunai</span>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="w-full bg-surface-container-lowest p-2 rounded-2xl shadow-xs flex items-center gap-2 overflow-x-auto border border-outline-variant/30">
          {[
            { id: 'semua', label: 'Semua Menu', icon: 'lunch_dining' },
            { id: 'bakso-kuah', label: 'Bakso Spesial Kuah', icon: 'soup_kitchen' },
            { id: 'mie-bihun', label: 'Mie & Bihun Bakso', icon: 'ramen_dining' },
            { id: 'pelengkap', label: 'Pelengkap & Gorengan', icon: 'bakery_dining' },
            { id: 'minuman', label: 'Minuman Segar Dingin', icon: 'local_drink' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-1.5 ${
                category === cat.id 
                  ? 'bg-primary text-on-primary font-bold shadow-xs' 
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Banner Chef Recommendation */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-fixed via-primary-fixed-dim to-surface-container-high p-5 shadow-xs flex items-center justify-between gap-4 border border-outline-variant/30">
          <div className="flex flex-col gap-1 z-10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-primary-fixed-variant bg-surface-container-lowest/80 px-2.5 py-0.5 rounded-full w-fit">
              Racikan Khas Mas Rananto Aji
            </span>
            <h3 className="text-base sm:text-lg font-bold text-on-primary-fixed">Kuah Kaldu Sumsum Tulang Sapi Asli</h3>
            <p className="text-xs text-on-surface-variant max-w-lg">
              Dimasak perlahan selama 12 jam dengan rempah pala alami, lada putih Bangka, dan taburan bawang goreng renyah wangi khas Solo.
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-container-lowest text-primary shadow-xs shrink-0">
            <span className="material-symbols-outlined text-[32px]">soup_kitchen</span>
          </div>
        </div>

        {/* Food Cards Grid */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-xs text-on-surface-variant">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>Memuat daftar menu lezat...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {menus.map((menu) => {
              const isOutOfStock = Number(menu.stock) <= 0;
              const inCartQty = getItemQtyInCart(menu.name);

              return (
                <div 
                  key={menu.id}
                  className={`bg-surface-container-lowest rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group border border-outline-variant/30 ${
                    isOutOfStock ? 'opacity-70' : ''
                  }`}
                >
                  {/* Food Thumbnail */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container-high">
                    <img 
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                        isOutOfStock ? 'grayscale' : ''
                      }`} 
                      src={menu.image} 
                      alt={menu.name} 
                    />
                    {menu.badge && (
                      <span className="absolute top-2.5 left-2.5 bg-secondary text-on-secondary text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        {menu.badge}
                      </span>
                    )}
                    <span className={`absolute top-2.5 right-2.5 text-[10px] px-2.5 py-0.5 rounded-full shadow-xs font-bold ${
                      isOutOfStock ? 'bg-error text-on-error' : 'bg-surface-container-lowest/90 backdrop-blur-sm text-tertiary'
                    }`}>
                      {isOutOfStock ? 'HABIS' : `Stok: ${menu.stock} Porsi`}
                    </span>
                  </div>

                  {/* Food Info & Action */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-on-surface leading-snug">{menu.name}</h3>
                        <span className="text-base text-primary font-bold whitespace-nowrap">
                          {formatIDR(menu.price)}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                        {menu.description}
                      </p>
                    </div>

                    <div className="pt-2.5 flex items-center justify-between border-t border-surface-container">
                      <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-tertiary">check_circle</span>
                        {menu.portion_info || '1 Porsi + Kuah Segar'}
                      </span>

                      {/* Tombol Tambah atau Counter jika sudah di keranjang */}
                      {inCartQty > 0 ? (
                        <div className="flex items-center gap-1.5 bg-primary-fixed/40 px-2 py-1 rounded-xl">
                          <button
                            onClick={() => {
                              const idx = cart.findIndex(c => c.name === menu.name);
                              if (idx > -1) changeQty(idx, -1);
                            }}
                            className="w-6 h-6 rounded-lg bg-surface text-primary flex items-center justify-center font-bold text-xs hover:bg-surface-container transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">remove</span>
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-primary">{inCartQty}</span>
                          <button
                            onClick={() => addToCart(menu)}
                            disabled={inCartQty >= menu.stock}
                            className="w-6 h-6 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-xs hover:bg-primary-container transition-colors disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToCart(menu)}
                          disabled={isOutOfStock}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isOutOfStock 
                              ? 'bg-surface-container text-outline cursor-not-allowed' 
                              : 'bg-primary text-on-primary hover:bg-primary-container active:scale-95 shadow-xs'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          <span>{isOutOfStock ? 'Habis' : 'Pilih Menu'}</span>
                        </button>
                      )}

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* 4. STICKY FLOATING CART BAR (NAVIGASI MENUJU HALAMAN PEMBAYARAN) */}
      <aside aria-label="Keranjang Belanja" className="fixed bottom-0 left-0 w-full z-40 bg-surface/95 backdrop-blur-xl border-t border-outline-variant/30 shadow-2xl px-4 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Sisi Kiri: Status Item & Rincian Total */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCartDrawerOpen(!cartDrawerOpen)}
                className="relative w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                title="Buka rincian keranjang"
              >
                <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
                {totalQty > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-secondary text-on-secondary text-[11px] font-bold shadow-xs">
                    {totalQty}
                  </span>
                )}
              </button>

              <div className="flex flex-col">
                <span className="text-xs text-on-surface-variant">
                  {totalQty === 0 ? 'Keranjang Kosong' : `${totalQty} Porsi Terpilih`}
                </span>
                <span className="text-base sm:text-lg font-bold text-primary">
                  {formatIDR(subtotal)}
                </span>
              </div>
            </div>

            {/* Tombol Lihat Rincian di Mobile */}
            {totalQty > 0 && (
              <button 
                onClick={() => setCartDrawerOpen(!cartDrawerOpen)}
                className="sm:hidden text-xs font-bold text-primary underline"
              >
                {cartDrawerOpen ? 'Tutup Rincian' : 'Lihat Rincian'}
              </button>
            )}
          </div>

          {/* Sisi Kanan: Tombol Eksekusi Menuju Halaman Pembayaran */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {totalQty > 0 && (
              <button
                type="button"
                onClick={() => setCartDrawerOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-dim text-on-surface text-xs font-bold transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
                <span>Rincian Menu</span>
              </button>
            )}

            <button
              onClick={handleProceedToPayment}
              disabled={totalQty === 0}
              className={`flex-1 sm:flex-initial py-3 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                totalQty > 0 
                  ? 'bg-tertiary text-on-tertiary hover:bg-tertiary-container shadow-tertiary/20' 
                  : 'bg-surface-container text-outline cursor-not-allowed'
              }`}
            >
              <span>{totalQty > 0 ? `Lanjut ke Pembayaran (${totalQty} Porsi)` : 'Pilih Menu Terlebih Dahulu'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

        </div>
      </aside>

      {/* 5. MODAL DRAWER RINCIAN KERANJANG (SLIDE-OVER/POPUP) */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header Drawer */}
            <div className="p-4 sm:p-5 bg-surface-container flex items-center justify-between border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">shopping_bag</span>
                <h3 className="text-sm sm:text-base font-bold text-on-surface">Keranjang Belanja Anda ({totalQty} Porsi)</h3>
              </div>
              <button 
                onClick={() => setCartDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-surface text-on-surface flex items-center justify-center font-bold"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* List Menu di Keranjang */}
            <div className="p-4 sm:p-5 flex flex-col gap-3 overflow-y-auto divide-y divide-surface-container flex-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-[36px] text-outline-variant">remove_shopping_cart</span>
                  <span>Keranjang Anda masih kosong. Silakan pilih menu di katalog.</span>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-on-surface truncate">{item.name}</span>
                      <span className="text-[11px] text-on-surface-variant">
                        {formatIDR(item.price)} x {item.qty} = <strong className="text-on-surface">{formatIDR(item.price * item.qty)}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => changeQty(index, -1)}
                        className="w-7 h-7 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface flex items-center justify-center font-bold"
                      >
                        <span className="material-symbols-outlined text-[14px]">remove</span>
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-on-surface">{item.qty}</span>
                      <button 
                        onClick={() => changeQty(index, 1)}
                        className="w-7 h-7 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface flex items-center justify-center font-bold"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                      </button>
                      <button 
                        onClick={() => removeItem(index)}
                        title="Hapus dari keranjang"
                        className="w-7 h-7 rounded-lg bg-error-container/50 hover:bg-error-container text-error flex items-center justify-center ml-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total & Action di Bawah Drawer */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-5 bg-surface-container-low border-t border-surface-container flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-on-surface-variant">Total Subtotal Menu:</span>
                  <span className="text-base sm:text-lg font-bold text-primary">{formatIDR(subtotal)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={clearCart}
                    className="py-2.5 px-3 rounded-xl bg-error-container/30 hover:bg-error-container text-error text-xs font-bold transition-colors"
                  >
                    Kosongkan
                  </button>
                  <button
                    onClick={() => {
                      setCartDrawerOpen(false);
                      handleProceedToPayment();
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-tertiary text-on-tertiary hover:bg-tertiary-container font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <span>Lanjut ke Pembayaran</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 6. TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 transition-all duration-300">
          <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">check_circle</span>
          <span className="text-xs sm:text-sm font-semibold">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
