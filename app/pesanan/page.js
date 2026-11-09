'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Barcode1D from '@/components/Barcode1D';

function PesananContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id') || '';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(queryId);
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'active', 'done'
  const [currentUser, setCurrentUser] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [slipModal, setSlipModal] = useState({ open: false, order: null });
  const [cashBarcodeModal, setCashBarcodeModal] = useState({ open: false, order: null });

  // 1. Ambil data user dari session / local storage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('juragan_bakso_user') || localStorage.getItem('juragan_bakso_user');
      if (saved) {
        const u = JSON.parse(saved);
        setCurrentUser(u);
        if (!queryId && (u.phone || u.identifier)) {
          setSearchQuery(u.phone || u.identifier);
        }
      }
    } catch (e) {}
  }, [queryId]);

  // 2. Fetch data pesanan dari API
  const fetchOrders = async (query = searchQuery) => {
    try {
      let url = `/api/orders?_t=${Date.now()}`;
      if (query && query.trim()) {
        url += `&q=${encodeURIComponent(query.trim())}`;
      }

      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        setOrders(json.data);
      }
      setLastUpdated(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
      setLoading(false);
    } catch (err) {
      console.error('Error fetching customer orders:', err);
      setLoading(false);
    }
  };

  // 3. Polling Real-time setiap 3 detik agar customer melihat perubahan status secara instan
  useEffect(() => {
    fetchOrders(searchQuery);

    const interval = setInterval(() => {
      fetchOrders(searchQuery);
    }, 3000);

    const handleStorage = (e) => {
      if (e.key === 'juragan_bakso_last_order') {
        fetchOrders(searchQuery);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchOrders(searchQuery);
  };

  const formatIDR = (num) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  // Helper status styling & labels
  const getStatusInfo = (status) => {
    switch (status) {
      case 'baru':
        return {
          stepIndex: 1,
          label: 'Pesanan Diterima',
          sublabel: 'Menunggu antrean koki di dapur',
          badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300',
          dotBg: 'bg-amber-500 animate-pulse',
          icon: 'receipt_long',
          desc: 'Pesanan Anda telah masuk ke sistem kasir dan siap diracik oleh koki kami.'
        };
      case 'masak':
        return {
          stepIndex: 2,
          label: 'Sedang Dimasak',
          sublabel: 'Koki sedang meracik kuah kaldu & bakso',
          badgeBg: 'bg-orange-100 text-orange-900 border border-orange-300',
          dotBg: 'bg-orange-500 animate-pulse',
          icon: 'soup_kitchen',
          desc: 'Kuah kaldu sumsum sapi sedang mendidih dan racikan bumbu khas sedang disiapkan dengan higienis.'
        };
      case 'siap':
        return {
          stepIndex: 3,
          label: 'Pesanan Siap Saji / Siap Diambil',
          sublabel: 'Matang & siap dinikmati',
          badgeBg: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
          dotBg: 'bg-emerald-500 animate-bounce',
          icon: 'check_circle',
          desc: 'Pesanan Anda sudah selesai dimasak! Silakan ambil di konter kasir atau tunggu pramusaji menyajikan ke meja Anda.'
        };
      case 'selesai':
        return {
          stepIndex: 4,
          label: 'Pesanan Selesai',
          sublabel: 'Transaksi telah selesai',
          badgeBg: 'bg-blue-100 text-blue-900 border border-blue-300',
          dotBg: 'bg-blue-500',
          icon: 'task_alt',
          desc: 'Terima kasih telah bersantap di Juragan Bakso Nusantara. Selamat menikmati sajian kami!'
        };
      case 'batal':
        return {
          stepIndex: 0,
          label: 'Pesanan Dibatalkan',
          sublabel: 'Pesanan ini tidak dapat diproses',
          badgeBg: 'bg-rose-100 text-rose-900 border border-rose-300',
          dotBg: 'bg-rose-600',
          icon: 'cancel',
          desc: 'Pesanan ini telah dibatalkan oleh pihak resto (misal: stok porsi habis atau permintaan pembatalan). Jika ada pembayaran yang telah dilakukan, silakan hubungi kasir via WhatsApp.'
        };
      default:
        return {
          stepIndex: 1,
          label: 'Menunggu Konfirmasi',
          sublabel: 'Sedang diproses',
          badgeBg: 'bg-neutral-100 text-neutral-800 border border-neutral-300',
          dotBg: 'bg-neutral-500',
          icon: 'hourglass_empty',
          desc: 'Pesanan sedang diverifikasi.'
        };
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(o => {
    if (filterTab === 'active') return ['baru', 'masak', 'siap'].includes(o.status);
    if (filterTab === 'done') return ['selesai', 'batal'].includes(o.status);
    return true;
  });

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased flex flex-col">
      
      {/* HEADER NAVBAR KHUSUS PELANGGAN */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 shadow-xs">
        <div className="max-w-5xl mx-auto h-18 px-4 sm:px-6 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img 
              alt="Logo Juragan Bakso" 
              className="h-10 w-10 object-contain rounded-xl p-0.5 bg-surface-container drop-shadow-xs" 
              src="/logo.png"
            />
            <div className="flex flex-col">
              <span className="font-headline-sm text-base sm:text-lg font-bold text-primary tracking-tight">
                Juragan Bakso
              </span>
              <span className="text-[10px] text-on-surface-variant font-semibold">
                Status &amp; Lacak Pesanan Real-Time
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/menu"
              className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">restaurant_menu</span>
              <span>Pesan Menu Baru</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col gap-6">

        {/* HERO TITLE & LIVE STATUS INDICATOR */}
        <div className="bg-gradient-to-r from-primary/10 via-surface-container-high to-surface-container-low p-5 sm:p-6 rounded-2xl border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase">
                Live Kitchen Sync
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              Pantau Status Pesanan Anda
            </h1>
            <p className="text-xs text-on-surface-variant">
              Tampilan ini terhubung langsung ke antrean dapur kasir. Perubahan status akan tampil seketika tanpa perlu memuat ulang halaman.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-mono shrink-0">
            <span className="material-symbols-outlined text-[16px] text-primary">sync</span>
            <span className="text-[11px] text-on-surface-variant">Update: {lastUpdated || 'Memuat...'}</span>
          </div>
        </div>

        {/* SEARCH FORM BAR */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-[20px]">
              search
            </span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID Pesanan (misal: #BKS-096) atau Nomor WhatsApp..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-container-lowest border-2 border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm font-medium text-on-surface outline-none transition-all shadow-xs"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-primary-container transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              Cari Pesanan
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchOrders('');
                }}
                className="px-3 py-3 rounded-xl bg-surface-container hover:bg-surface-dim text-on-surface text-xs font-semibold"
                title="Tampilkan Semua Pesanan"
              >
                Reset
              </button>
            )}
          </div>
        </form>

        {/* TABS FILTER */}
        <div className="flex items-center gap-2 border-b border-surface-container pb-2 overflow-x-auto">
          {[
            { id: 'all', label: `Semua Pesanan (${orders.length})` },
            { id: 'active', label: `Sedang Diproses (${orders.filter(o => ['baru', 'masak', 'siap'].includes(o.status)).length})` },
            { id: 'done', label: `Selesai / Batal (${orders.filter(o => ['selesai', 'batal'].includes(o.status)).length})` }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilterTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterTab === t.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* LIST PESANAN */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-on-surface-variant">Memuat status pesanan dari dapur...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/30 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[28px]">search_off</span>
            </div>
            <h3 className="font-bold text-base text-on-surface">Tidak Ditemukan Tiket Pesanan</h3>
            <p className="text-xs text-on-surface-variant max-w-md">
              {searchQuery 
                ? `Tidak ada pesanan dengan kata kunci "${searchQuery}". Pastikan Nomor Pesanan atau Nomor WhatsApp sudah sesuai.`
                : 'Belum ada data pesanan yang tercatat. Silakan pesan menu favorit Anda sekarang!'}
            </p>
            <Link
              href="/menu"
              className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">restaurant_menu</span>
              <span>Buka Menu &amp; Pesan Sekarang</span>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredOrders.map((ord) => {
              const statusInfo = getStatusInfo(ord.status);
              const waUrl = `https://api.whatsapp.com/send?phone=6282299548784&text=${encodeURIComponent(
                `Halo Admin Juragan Bakso! 🍜\nSaya ingin menanyakan status pesanan saya:\n• No. Pesanan: ${ord.id}\n• Nama: ${ord.customer_name}\n• Status saat ini: ${statusInfo.label}\n\nMohon bantuannya, terima kasih! 🙏`
              )}`;

              return (
                <div 
                  key={ord.id}
                  className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col transition-all hover:shadow-md"
                >
                  
                  {/* TOP HEADER PESANAN */}
                  <div className="p-4 sm:p-5 bg-surface-container-low border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                        <span className="material-symbols-outlined text-[20px]">receipt</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-headline-sm text-base font-bold text-primary">
                            {ord.id}
                          </span>
                          <span className="text-xs text-on-surface-variant font-medium">
                            • {ord.timestamp || 'Hari ini'}
                          </span>
                        </div>
                        <span className="text-xs text-on-surface font-semibold">
                          Pemesan: <strong className="text-on-surface">{ord.customer_name}</strong>
                          {ord.customer_phone && ord.customer_phone !== '-' && (
                            <span className="text-on-surface-variant font-normal"> ({ord.customer_phone})</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* STATUS BADGE & CETAK STRUK & BARCODE KASIR */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {ord.payment_method?.includes('Tunai') && (
                        <button
                          type="button"
                          onClick={() => setCashBarcodeModal({ open: true, order: ord })}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors shadow-2xs"
                          title="Tampilkan Barcode ke Kasir untuk Di-scan"
                        >
                          <span className="material-symbols-outlined text-[15px] text-amber-800">qr_code_scanner</span>
                          <span>Barcode Kasir</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSlipModal({ open: true, order: ord })}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-on-surface border border-outline-variant/40 hover:bg-neutral-50 transition-colors shadow-2xs"
                        title="Lihat & Cetak Struk Bukti Bayar"
                      >
                        <span className="material-symbols-outlined text-[15px] text-primary">receipt_long</span>
                        <span>Struk Bukti Bayar</span>
                      </button>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusInfo.badgeBg}`}>
                        <span className={`w-2 h-2 rounded-full ${statusInfo.dotBg}`}></span>
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* VISUAL STEPPER (JIKA BUKAN BATAL) */}
                  {ord.status !== 'batal' ? (
                    <div className="p-4 sm:p-6 bg-surface-container-lowest border-b border-surface-container">
                      <div className="flex flex-col gap-3">
                        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                          Tahapan Proses Dapur:
                        </span>

                        {/* Progress Stepper Bar */}
                        <div className="grid grid-cols-4 gap-2 relative">
                          {[
                            { step: 1, title: 'Diterima', icon: 'receipt_long' },
                            { step: 2, title: 'Dimasak', icon: 'soup_kitchen' },
                            { step: 3, title: 'Siap Saji', icon: 'check_circle' },
                            { step: 4, title: 'Selesai', icon: 'task_alt' }
                          ].map((st) => {
                            const isCurrent = statusInfo.stepIndex === st.step;
                            const isPast = statusInfo.stepIndex > st.step;
                            const isFuture = statusInfo.stepIndex < st.step;

                            return (
                              <div key={st.step} className="flex flex-col items-center text-center gap-1.5 relative">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                                  isCurrent
                                    ? 'bg-primary text-white ring-4 ring-primary/20 shadow-md font-bold scale-110'
                                    : isPast
                                    ? 'bg-primary/20 text-primary font-bold'
                                    : 'bg-surface-container-high text-on-surface-variant/40'
                                }`}>
                                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                                    {st.icon}
                                  </span>
                                </div>
                                <span className={`text-[10px] sm:text-xs leading-tight ${
                                  isCurrent
                                    ? 'font-bold text-primary'
                                    : isPast
                                    ? 'font-semibold text-on-surface'
                                    : 'text-on-surface-variant/50'
                                }`}>
                                  {st.title}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Penjelasan Status Terkini */}
                        <div className="mt-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-2.5">
                          <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                            info
                          </span>
                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            {statusInfo.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* JIKA STATUS BATAL */
                    <div className="p-4 sm:p-5 bg-rose-50 border-b border-rose-200 flex items-start gap-3">
                      <span className="material-symbols-outlined text-rose-600 text-[24px] shrink-0 mt-0.5">
                        cancel
                      </span>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                          Pemberitahuan Pembatalan:
                        </span>
                        <p className="text-xs text-rose-800 leading-relaxed">
                          {statusInfo.desc}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* DETAIL INFORMASI LAYANAN & MENU */}
                  <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    
                    {/* Kolom Kiri: Rincian Menu */}
                    <div className="flex flex-col gap-2.5">
                      <span className="font-bold text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[16px]">menu_book</span>
                        <span>Daftar Menu yang Dipesan:</span>
                      </span>

                      <div className="flex flex-col divide-y divide-surface-container bg-surface-container-low rounded-xl p-3 border border-outline-variant/30">
                        {(ord.items || []).map((it, idx) => (
                          <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-surface-container-high text-primary font-bold flex items-center justify-center text-[10px]">
                                {it.qty}x
                              </span>
                              <span className="font-semibold text-on-surface">{it.name}</span>
                            </div>
                            <span className="font-mono text-on-surface-variant shrink-0">
                              {formatIDR((Number(it.price) || 0) * (Number(it.qty) || 1))}
                            </span>
                          </div>
                        ))}

                        {/* Subtotal & Fee */}
                        <div className="pt-2 mt-2 border-t border-surface-container flex flex-col gap-1 text-[11px] text-on-surface-variant">
                          <div className="flex justify-between">
                            <span>Biaya Layanan/Kemasan:</span>
                            <span>{formatIDR(ord.packaging_fee || 0)}</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold text-on-surface pt-1 border-t border-surface-container">
                            <span>Total Pembayaran:</span>
                            <span className="text-primary font-mono text-sm">{formatIDR(ord.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Kolom Kanan: Detail Layanan, Meja, & Metode Bayar */}
                    <div className="flex flex-col gap-2.5">
                      <span className="font-bold text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[16px]">room_service</span>
                        <span>Informasi Layanan &amp; Pengambilan:</span>
                      </span>

                      <div className="bg-surface-container-low rounded-xl p-3.5 border border-outline-variant/30 flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-on-surface-variant">Tipe Layanan:</span>
                          <span className="font-bold text-on-surface capitalize">
                            {ord.order_type_label || ord.order_type || 'Makan di Tempat'}
                          </span>
                        </div>

                        <div className="flex justify-between items-start gap-2">
                          <span className="text-on-surface-variant">Detail Meja / Waktu:</span>
                          <span className="font-bold text-primary text-right">
                            {ord.order_detail_meta || ord.table_or_address || '-'}
                          </span>
                        </div>

                        <div className="flex justify-between items-start gap-2">
                          <span className="text-on-surface-variant">Metode Bayar:</span>
                          <span className="font-bold text-on-surface uppercase">
                            {ord.payment_method || 'Kasir / QRIS'}
                          </span>
                        </div>

                        {ord.notes && ord.notes !== '-' && (
                          <div className="flex flex-col gap-0.5 pt-1.5 border-t border-surface-container">
                            <span className="text-[10px] text-on-surface-variant font-bold">Catatan Khusus:</span>
                            <p className="text-on-surface italic bg-surface p-2 rounded-lg border border-outline-variant/30">
                              "{ord.notes}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* BOTTOM ACTION BUTTONS */}
                  <div className="p-4 sm:p-5 bg-surface-container-high/40 border-t border-surface-container flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-on-surface-variant">
                      Ada pertanyaan tentang pesanan ini?
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSlipModal({ open: true, order: ord })}
                        className="px-3.5 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs font-bold hover:bg-surface-container transition-all flex items-center gap-1.5 border border-outline-variant/40 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">print</span>
                        <span>Cetak Struk Resmi</span>
                      </button>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-tertiary text-white text-xs font-bold hover:bg-tertiary-container transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                        <span>Hubungi Kasir via WhatsApp</span>
                      </a>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* MODAL STRUK RESMI BUKTI PEMBAYARAN PELANGGAN */}
      {slipModal.open && slipModal.order && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative bg-surface rounded-3xl p-4 sm:p-6 max-w-md w-full flex flex-col items-center gap-3 text-center shadow-2xl animate-in zoom-in-95 duration-200 border border-outline-variant/30 my-auto max-h-[92vh] overflow-y-auto">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between w-full pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">receipt_long</span>
                <span className="text-sm font-bold text-on-surface">Struk Bukti Pembayaran Resmi</span>
              </div>
              <button 
                type="button"
                onClick={() => setSlipModal({ open: false, order: null })}
                className="w-7 h-7 rounded-full bg-surface-container hover:bg-surface-dim text-on-surface flex items-center justify-center text-xs transition-colors"
                title="Tutup"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {/* STRUK THERMAL POS RESMI BUKTI PEMBAYARAN */}
            <div 
              id="thermal-receipt-print-area" 
              className="w-full p-4 sm:p-5 font-mono text-xs bg-white text-black rounded-xl border border-dashed border-neutral-400 shadow-sm text-left leading-relaxed select-all"
            >
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>JURAGAN BAKSO NUSANTARA</div>
              <div style={{ textAlign: 'center', fontSize: '10px', color: '#555' }}>Jl. Malaka Baru 1, BKT Pd. Kopi • WA: 0822-9954-8784</div>
              <div style={{ textAlign: 'center', margin: '6px 0', color: '#888' }}>================================</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', padding: '4px 8px', borderRadius: '4px', border: '1px solid #a7f3d0', color: '#065f46', fontWeight: 'bold', fontSize: '11px', margin: '4px 0' }}>
                <span>STATUS PEMBAYARAN:</span>
                <span>{slipModal.order.payment_method?.includes('QRIS') ? '✓ LUNAS (QRIS BERHASIL)' : '✓ DITERIMA SISTEM'}</span>
              </div>

              <div>No Tiket: <strong>{slipModal.order.id}</strong></div>
              <div>Waktu   : {slipModal.order.timestamp || 'Hari Ini'}</div>
              <div>Pemesan : {slipModal.order.customer_name}</div>
              <div>Layanan : {slipModal.order.order_type_label || (slipModal.order.order_type === 'takeaway' ? 'Bungkus' : slipModal.order.order_type === 'delivery' ? 'Pesan Antar' : 'Makan di Tempat')}</div>
              <div>Detail  : {slipModal.order.order_detail_meta || slipModal.order.table_or_address || '-'}</div>
              
              <div style={{ margin: '6px 0', color: '#888' }}>--------------------------------</div>
              
              {(slipModal.order.items || []).map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>{it.name} x{it.qty}</span>
                  <span>{formatIDR((Number(it.price) || 0) * (Number(it.qty) || 1))}</span>
                </div>
              ))}
              
              <div style={{ margin: '6px 0', color: '#888' }}>--------------------------------</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Biaya Layanan/Bungkus:</span>
                <span>{formatIDR(slipModal.order.packaging_fee || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #ccc' }}>
                <span>TOTAL:</span>
                <span>{formatIDR(slipModal.order.total)}</span>
              </div>
              <div style={{ margin: '6px 0', color: '#888' }}>--------------------------------</div>
              
              <div>Metode Bayar: <strong>{slipModal.order.payment_method || 'QRIS Instan (AJI STORE)'}</strong></div>
              
              {slipModal.order.payment_method?.includes('QRIS') && (
                <div style={{ textAlign: 'center', margin: '8px 0', padding: '6px', border: '1px dashed #aaa', borderRadius: '4px', background: '#fafafa' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold' }}>SCAN QRIS: AJI STORE</div>
                  <img 
                    src="/qris-pembayaran.jpeg" 
                    alt="QRIS AJI STORE" 
                    style={{ width: '85px', height: '110px', objectFit: 'contain', margin: '4px auto', display: 'block' }} 
                  />
                  <div style={{ fontSize: '9px', fontWeight: 'bold' }}>NMID: ID1026632017442</div>
                  <div style={{ fontSize: '8px', color: '#666' }}>BCA / Mandiri / BRI / Dana / GoPay / OVO</div>
                </div>
              )}

              {slipModal.order.payment_method?.includes('Tunai') && (
                <div style={{ textAlign: 'center', margin: '8px 0', padding: '8px', border: '2px solid #8d4b00', borderRadius: '8px', background: '#fffcf7' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#8d4b00', marginBottom: '2px' }}>
                    BARCODE TIKET KASIR (BAYAR TUNAI)
                  </div>
                  <div style={{ fontSize: '9px', color: '#666', marginBottom: '6px' }}>
                    Tunjukkan ke kasir untuk di-scan dan divalidasi
                  </div>
                  <Barcode1D 
                    value={slipModal.order.id} 
                    height={46} 
                    subtitle="KASIR TUNAI • SCAN DISINI"
                  />
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#92400e', marginTop: '6px', background: '#fef3c7', padding: '4px', borderRadius: '4px' }}>
                    Siapkan uang pas: {formatIDR(slipModal.order.total)}
                  </div>
                </div>
              )}

              {slipModal.order.notes && slipModal.order.notes !== '-' && (
                <>
                  <div style={{ margin: '6px 0', color: '#888' }}>--------------------------------</div>
                  <div>Catatan Dapur:</div>
                  <div style={{ fontStyle: 'italic', color: '#333' }}>"{slipModal.order.notes}"</div>
                </>
              )}

              <div style={{ textAlign: 'center', margin: '8px 0', color: '#888' }}>================================</div>
              <div style={{ textAlign: 'center', fontSize: '10px', color: '#555' }}>Simpan struk ini sebagai bukti pembayaran sah.</div>
              <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 'bold', marginTop: '2px' }}>Terima Kasih Atas Kunjungan Anda!</div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-end gap-2 w-full pt-1">
              <button 
                type="button"
                onClick={() => setSlipModal({ open: false, order: null })} 
                className="py-2 px-3 rounded-xl bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-dim transition-colors"
              >
                Tutup
              </button>
              <button 
                type="button"
                onClick={() => window.print()} 
                className="py-2 px-4 rounded-xl bg-neutral-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-neutral-800 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Cetak Struk (Print)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL BARCODE KHUSUS BAYAR TUNAI KE KASIR */}
      {cashBarcodeModal.open && cashBarcodeModal.order && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-5 flex flex-col items-center gap-4 text-center shadow-2xl border border-outline-variant/30">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">point_of_sale</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-100 px-3 py-0.5 rounded-full w-fit mx-auto">
                Wajib Ke Meja Kasir
              </span>
              <h3 className="font-bold text-base text-on-surface mt-1">Barcode Tiket Pembayaran Kasir</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Tunjukkan barcode di bawah ini kepada petugas kasir untuk di-scan dan selesaikan pembayaran tunai Anda.
              </p>
            </div>

            <div className="w-full">
              <Barcode1D 
                value={cashBarcodeModal.order.id} 
                height={62} 
                subtitle="KODE TIKET KASIR RESMI"
              />
            </div>

            <div className="w-full p-3 rounded-xl bg-surface-container flex flex-col gap-1 text-xs text-left">
              <div className="flex justify-between text-on-surface-variant">
                <span>No. Tiket:</span>
                <strong className="text-primary font-bold font-mono">{cashBarcodeModal.order.id}</strong>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Pemesan:</span>
                <strong className="text-on-surface">{cashBarcodeModal.order.customer_name}</strong>
              </div>
              <div className="flex justify-between text-on-surface-variant pt-1 border-t border-outline-variant/20">
                <span>Total Bayar Tunai:</span>
                <strong className="text-amber-800 font-extrabold text-sm">{formatIDR(cashBarcodeModal.order.total)}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCashBarcodeModal({ open: false, order: null })}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white font-bold text-xs shadow-sm transition-all"
            >
              Tutup Barcode
            </button>
          </div>
        </div>
      )}

      {/* FOOTER SIMPLE */}
      <footer className="py-6 border-t border-outline-variant/20 text-center text-xs text-on-surface-variant">
        <p>© 2025 Juragan Bakso Nusantara. Sistem Pemesanan Kuliner Resmi.</p>
      </footer>

    </div>
  );
}

export default function PesananPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PesananContent />
    </Suspense>
  );
}
