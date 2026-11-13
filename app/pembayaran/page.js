'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Barcode1D from '@/components/Barcode1D';

export default function PembayaranPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [cart, setCart] = useState([]);
  
  // Order Settings
  const [orderType, setOrderType] = useState('dine-in'); // 'dine-in', 'takeaway', 'delivery'
  const [tableNo, setTableNo] = useState('Meja No. 05');
  const [pickupTime, setPickupTime] = useState('15 Menit lagi');
  const [deliveryAddress, setDeliveryAddress] = useState('Jl. Malaka Baru 1 No. 039 (Dekat BKT Pondok Kopi)');
  
  // Customer Data
  const [custName, setCustName] = useState('Budi Santoso');
  const [custPhone, setCustPhone] = useState('0822-9954-8784');
  const [custNotes, setCustNotes] = useState('');
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('qris'); // 'qris', 'tunai', 'cod'
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [referenceCode, setReferenceCode] = useState('');
  const [activeOrderId, setActiveOrderId] = useState('');
  
  // Timer Batas Waktu QRIS (Tepat 10 Menit = 600 Detik)
  const QRIS_TIMEOUT_SECONDS = 600;
  const [countdown, setCountdown] = useState(QRIS_TIMEOUT_SECONDS);
  const [qrisExpired, setQrisExpired] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  
  // Order Confirmation Modal
  const [orderSuccessModal, setOrderSuccessModal] = useState({
    open: false,
    orderId: '',
    total: 0,
    paymentMethod: 'qris',
    waUrl: '',
    orderData: null
  });
  const [toast, setToast] = useState({ show: false, message: '' });

  // 1. Auth Guard & Load Cart
  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem('juragan_bakso_user') || localStorage.getItem('juragan_bakso_user');
      if (!savedUser) {
        router.push('/login?redirect=/pembayaran&msg=auth_required');
        return;
      }
      const u = JSON.parse(savedUser);
      setCurrentUser(u);
      if (u.name) setCustName(u.name);
      if (u.phone || u.identifier) setCustPhone(u.phone || u.identifier);

      // Load cart from storage
      const savedCart = localStorage.getItem('juragan_bakso_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCart(parsed);
      } else {
        setCart([]);
      }

      // Generate order ref code
      setReferenceCode(`BKS-${Math.floor(100 + Math.random() * 900)}`);
      setCheckingAuth(false);
    } catch (e) {
      router.push('/login?redirect=/pembayaran&msg=auth_required');
    }
  }, []);

  // Timer countdown untuk QRIS (Batas Waktu Tepat 10 Menit = 600 Detik)
  // PENTING: Timer HANYA BERJALAN saat popup modal QRIS muncul (showQrisModal === true)
  useEffect(() => {
    if (paymentMethod !== 'qris' || !showQrisModal) return;

    if (countdown <= 0) {
      if (!qrisExpired) {
        setQrisExpired(true);
      }
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setQrisExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, paymentMethod, showQrisModal, qrisExpired]);

  // Fungsi membuka popup modal QRIS & memulai timer 10 menit
  const handleOpenQrisModal = async () => {
    if (!custName.trim()) {
      showToast('Mohon isi nama pemesan terlebih dahulu');
      return;
    }
    if (!custPhone.trim()) {
      showToast('Mohon isi nomor WhatsApp aktif');
      return;
    }
    // Jika sebelumnya sudah expired atau timer 0, reset ke 10 menit baru
    if (qrisExpired || countdown <= 0) {
      setCountdown(QRIS_TIMEOUT_SECONDS);
      setQrisExpired(false);
      setReferenceCode(`BKS-${Math.floor(100 + Math.random() * 900)}`);
    }
    setShowQrisModal(true);

    // Otomatis masukkan pesanan ke antrean kasir & dapur di latar belakang
    // sehingga saat customer melihat popup barcode QRIS, pesanan sudah langsung tercatat di antrean admin
    if (!activeOrderId && cart.length > 0) {
      try {
        const itemsPayload = cart.map(it => ({
          id: it.id || undefined,
          name: it.name,
          price: it.price,
          qty: it.qty,
          subtotal: it.price * it.qty
        }));

        let orderTypeLabel = 'Makan di Tempat';
        let metaInfo = tableNo;
        if (orderType === 'takeaway') {
          orderTypeLabel = 'Bungkus';
          metaInfo = pickupTime;
        } else if (orderType === 'delivery') {
          orderTypeLabel = 'Pesan Antar';
          metaInfo = deliveryAddress;
        }

        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: custName,
            customer_phone: custPhone,
            order_type: orderType,
            order_type_label: orderTypeLabel,
            order_detail_meta: metaInfo,
            table_or_address: metaInfo,
            notes: custNotes,
            items: itemsPayload,
            subtotal: subtotal,
            packaging_fee: packagingFee,
            total: grandTotal,
            payment_method: 'QRIS Instan (Menunggu Pembayaran)'
          })
        });

        const json = await res.json();
        if (json.success && json.data) {
          const generatedId = json.data.id;
          setActiveOrderId(generatedId);

          // Simpan ke localStorage agar sinkron lintas tab
          try {
            const localOrders = JSON.parse(localStorage.getItem('juragan_bakso_orders') || '[]');
            const updated = [json.data, ...localOrders.filter(o => o.id !== generatedId)];
            localStorage.setItem('juragan_bakso_orders', JSON.stringify(updated));
            localStorage.setItem('juragan_bakso_last_order', JSON.stringify({ id: generatedId, time: Date.now() }));
            window.dispatchEvent(new Event('orderCreated'));
            window.dispatchEvent(new Event('stockUpdated'));
          } catch (e) {}
        }
      } catch (e) {
        console.warn('Latar belakang antrean QRIS:', e.message);
      }
    }
  };

  // Fungsi mengulang QRIS dengan timer 10 menit baru
  const handleRetryQris = () => {
    setCountdown(QRIS_TIMEOUT_SECONDS);
    setQrisExpired(false);
    setShowQrisModal(true);
    setReferenceCode(`BKS-${Math.floor(100 + Math.random() * 900)}`);
    showToast('Barcode QRIS baru berhasil dibuat. Selesaikan pembayaran dalam 10 menit.');
  };

  // Fungsi beralih metode pembayaran saat expired atau ingin mengganti metode
  const handleSwitchPaymentMethod = (method) => {
    setPaymentMethod(method);
    setQrisExpired(false);
    setShowQrisModal(false);
    if (method === 'qris') {
      setCountdown(QRIS_TIMEOUT_SECONDS);
      setReferenceCode(`BKS-${Math.floor(100 + Math.random() * 900)}`);
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

  const changeQty = (index, delta) => {
    let updated = [...cart];
    const newQty = updated[index].qty + delta;
    if (newQty <= 0) {
      const removed = updated[index].name;
      updated.splice(index, 1);
      showToast(`${removed} dihapus dari pesanan`);
    } else {
      updated[index].qty = newQty;
    }
    saveCartToStorage(updated);
  };

  const removeItem = (index) => {
    let updated = [...cart];
    const removed = updated[index].name;
    updated.splice(index, 1);
    showToast(`${removed} dihapus dari pesanan`);
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

  // Calculations
  const subtotal = cart.reduce((sum, it) => sum + (it.price * it.qty), 0);
  const packagingFee = orderType === 'dine-in' ? 0 : 2000;
  const grandTotal = subtotal > 0 ? (subtotal + packagingFee) : 0;
  const totalQty = cart.reduce((sum, it) => sum + it.qty, 0);

  // WhatsApp Message Generator
  const generateWhatsAppMessage = (customOrderId = null) => {
    let orderTypeLabel = 'Makan di Tempat (Dine-In)';
    let orderDetailMeta = `Nomor Meja: ${tableNo}`;

    if (orderType === 'takeaway') {
      orderTypeLabel = 'Bungkus (Takeaway)';
      orderDetailMeta = `Estimasi Diambil: ${pickupTime}`;
    } else if (orderType === 'delivery') {
      orderTypeLabel = 'Pesan Antar (Delivery)';
      orderDetailMeta = `Alamat Antar: ${deliveryAddress}`;
    }

    let itemsText = '';
    cart.forEach((it, idx) => {
      itemsText += `${idx + 1}. ${it.name} (${it.qty}x) = ${formatIDR(it.price * it.qty)}\n`;
    });

    let paymentInfo = 'QRIS Instan (AJI STORE - NMID: ID1026632017442)';
    if (paymentMethod === 'tunai') paymentInfo = 'Tunai / Langsung di Kasir';
    if (paymentMethod === 'cod') paymentInfo = 'COD (Bayar Tunai ke Kurir)';

    const displayOrderId = customOrderId 
      ? (String(customOrderId).startsWith('#') ? customOrderId : `#${customOrderId}`)
      : `#${referenceCode}`;

    return `*PESANAN BARU - JURAGAN BAKSO NUSANTARA*
---------------------------------------
*Kode Pesanan:* ${displayOrderId}
*Waktu:* ${new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} WIB
*Pelanggan:* ${custName}
*No. WhatsApp:* ${custPhone}
*Tipe Layanan:* ${orderTypeLabel}
*Detail Layanan:* ${orderDetailMeta}
---------------------------------------
*RINCIAN MENU DIPESAN:*
${itemsText}
---------------------------------------
*Subtotal Menu:* ${formatIDR(subtotal)}
*Biaya Kemasan/Antar:* ${formatIDR(packagingFee)}
*TOTAL TAGIHAN:* *${formatIDR(grandTotal)}*
*Metode Pembayaran:* *${paymentInfo}*
${paymentMethod === 'qris' ? '_Catatan: Bukti transfer QRIS dilampirkan setelah pesan ini._\n' : ''}*Catatan Racikan:* ${custNotes || '-'}
---------------------------------------
_Pesanan ini dikirim otomatis via Web Pemesanan Resmi Juragan Bakso Nusantara._`;
  };

  // Submit Order to Backend API & Open WhatsApp
  const submitOrder = async () => {
    if (paymentMethod === 'qris' && qrisExpired) {
      showToast('Waktu pembayaran QRIS telah habis (10 menit). Silakan generate ulang QRIS.');
      setShowQrisModal(true);
      return;
    }
    if (cart.length === 0) {
      showToast('Keranjang pesanan masih kosong');
      return;
    }
    if (!custName.trim()) {
      showToast('Mohon isi nama pemesan');
      return;
    }
    if (!custPhone.trim()) {
      showToast('Mohon isi nomor WhatsApp aktif');
      return;
    }

    setSubmitting(true);

    const itemsPayload = cart.map(it => ({
      id: it.id || undefined,
      name: it.name,
      price: it.price,
      qty: it.qty,
      subtotal: it.price * it.qty
    }));

    let orderTypeLabel = 'Makan di Tempat';
    let metaInfo = tableNo;
    if (orderType === 'takeaway') {
      orderTypeLabel = 'Bungkus';
      metaInfo = pickupTime;
    } else if (orderType === 'delivery') {
      orderTypeLabel = 'Pesan Antar';
      metaInfo = deliveryAddress;
    }

    const paymentMethodLabel = paymentMethod === 'qris' 
      ? 'QRIS Instan (AJI STORE)' 
      : paymentMethod === 'tunai' 
      ? 'Kasir Tunai • Menunggu Scan di Kasir' 
      : 'COD Kurir';

    try {
      let generatedOrderId = activeOrderId;
      let orderResponseData = null;

      if (activeOrderId) {
        try {
          const patchRes = await fetch(`/api/orders/${encodeURIComponent(activeOrderId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payment_method: paymentMethodLabel,
              status: 'baru'
            })
          });
          const patchJson = await patchRes.json();
          if (patchJson.success && patchJson.data) {
            orderResponseData = patchJson.data;
          }
        } catch (pe) {}
      }

      if (!orderResponseData) {
        // Kirim data pesanan ke backend API
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: custName,
            customer_phone: custPhone,
            order_type: orderType,
            order_type_label: orderTypeLabel,
            order_detail_meta: metaInfo,
            table_or_address: metaInfo,
            notes: custNotes,
            items: itemsPayload,
            subtotal: subtotal,
            packaging_fee: packagingFee,
            total: grandTotal,
            payment_method: paymentMethodLabel
          })
        });

        const json = await res.json();
        orderResponseData = json.data;
        generatedOrderId = json.data?.id || json.data?.order_id || `#${referenceCode}`;
      }

      // Perbarui stok di localStorage juragan_bakso_custom_menus
      try {
        const localCustom = JSON.parse(localStorage.getItem('juragan_bakso_custom_menus') || '[]');
        if (localCustom.length > 0) {
          const updatedCustom = localCustom.map(m => {
            const orderedItem = itemsPayload.find(it => (it.id && m.id && it.id === m.id) || it.name === m.name);
            if (orderedItem) {
              const newStk = Math.max(0, Number(m.stock || 0) - Number(orderedItem.qty || 1));
              return {
                ...m,
                stock: newStk,
                is_available: newStk > 0,
                badge: newStk > 0 ? (newStk <= 5 ? `Menipis (${newStk})` : m.badge) : 'Habis / Sold Out',
                badge_type: newStk > 0 ? (newStk <= 5 ? 'primary' : m.badge_type) : 'error',
                updatedAt: Date.now()
              };
            }
            return m;
          });
          localStorage.setItem('juragan_bakso_custom_menus', JSON.stringify(updatedCustom));
        }
      } catch (e) {}

      // Simpan pesanan ke localStorage juragan_bakso_orders agar pesanan baru tidak hilang saat Vercel cold-start
      try {
        const fullOrderObj = orderResponseData || {
          id: generatedOrderId,
          customer_name: custName,
          customer_phone: custPhone,
          order_type: orderType,
          order_type_label: orderTypeLabel,
          order_detail_meta: metaInfo,
          notes: custNotes,
          items: itemsPayload,
          packaging_fee: packagingFee,
          total: grandTotal,
          payment_method: paymentMethodLabel,
          status: 'baru',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
        };
        const localOrders = JSON.parse(localStorage.getItem('juragan_bakso_orders') || '[]');
        const updatedOrders = [fullOrderObj, ...localOrders.filter(o => o.id !== generatedOrderId)];
        localStorage.setItem('juragan_bakso_orders', JSON.stringify(updatedOrders));
      } catch (e) {}

      // Notifikasi real-time lintas tab / window agar dashboard admin langsung mendeteksi pesanan baru & update stok
      try {
        localStorage.setItem('juragan_bakso_last_order', JSON.stringify({ id: generatedOrderId, time: Date.now() }));
        window.dispatchEvent(new Event('orderCreated'));
        window.dispatchEvent(new Event('stockUpdated'));
      } catch (e) {}

      // Buat tautan WhatsApp resmi dengan nomor tiket yang sinkron
      const waMessage = generateWhatsAppMessage(generatedOrderId);
      const waUrl = `https://api.whatsapp.com/send?phone=6282299548784&text=${encodeURIComponent(waMessage)}`;

      // Data lengkap struk pesanan untuk bukti pembayaran resmi customer
      const completedSlip = {
        id: generatedOrderId,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        customer_name: custName,
        customer_phone: custPhone,
        order_type_label: orderTypeLabel,
        order_detail_meta: metaInfo,
        items: itemsPayload,
        packaging_fee: packagingFee,
        total: grandTotal,
        payment_method: paymentMethodLabel,
        notes: custNotes || '-'
      };

      // Kosongkan keranjang belanja setelah sukses kirim
      saveCartToStorage([]);
      setShowQrisModal(false);

      // Tampilkan modal struk pesanan sukses
      setOrderSuccessModal({
        open: true,
        orderId: generatedOrderId,
        total: grandTotal,
        paymentMethod: paymentMethodLabel,
        waUrl: waUrl,
        orderData: completedSlip
      });
    } catch (err) {
      console.error('Error submitting order:', err);
      // Fallback tetap buka WhatsApp
      const fallbackId = `#${referenceCode}`;
      const waMessage = generateWhatsAppMessage(fallbackId);
      const waUrl = `https://api.whatsapp.com/send?phone=6282299548784&text=${encodeURIComponent(waMessage)}`;
      const fallbackSlip = {
        id: fallbackId,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        customer_name: custName,
        customer_phone: custPhone,
        order_type_label: orderTypeLabel,
        order_detail_meta: metaInfo,
        items: itemsPayload,
        packaging_fee: packagingFee,
        total: grandTotal,
        payment_method: paymentMethodLabel,
        notes: custNotes || '-'
      };
      // Pastikan fallback tetap tersimpan di antrean lokal dan broadcast event
      try {
        const localOrders = JSON.parse(localStorage.getItem('juragan_bakso_orders') || '[]');
        const updated = [fallbackSlip, ...localOrders.filter(o => o.id !== fallbackId)];
        localStorage.setItem('juragan_bakso_orders', JSON.stringify(updated));
        localStorage.setItem('juragan_bakso_last_order', JSON.stringify({ id: fallbackId, time: Date.now() }));
        window.dispatchEvent(new Event('orderCreated'));
        window.dispatchEvent(new Event('stockUpdated'));
      } catch (e) {}

      setOrderSuccessModal({
        open: true,
        orderId: fallbackId,
        total: grandTotal,
        paymentMethod: paymentMethodLabel,
        waUrl: waUrl,
        orderData: fallbackSlip
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-6 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-base font-bold text-on-surface">Memeriksa Status Login...</h2>
        <p className="text-xs text-on-surface-variant max-w-sm mt-1">
          Halaman pembayaran diproteksi. Mengarahkan Anda ke form login...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col antialiased font-body-md text-on-surface">
      
      {/* 1. HEADER KHUSUS PORTAL PEMBAYARAN (PENGGANTI NAVBAR LANDING) */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 shadow-xs">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Logo & Breadcrumb Info */}
          <div className="flex items-center gap-3">
            <Link href="/menu" className="flex items-center gap-2.5 group">
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
                  Portal Pembayaran &amp; Checkout
                </span>
              </div>
            </Link>
          </div>

          {/* User Profile & Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link 
              href="/menu"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary-fixed/30 hover:bg-primary-fixed/50 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">restaurant_menu</span>
              <span className="hidden sm:inline">Ubah / Tambah Menu</span>
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
              title="Keluar dari sesi pemesanan"
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
          
          <Link href="/menu" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="w-6 h-6 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center text-[12px] font-bold">
              <span className="material-symbols-outlined text-[14px]">check</span>
            </span>
            <span className="font-semibold hidden sm:inline">Langkah 1: Pilih Menu Kuliner</span>
            <span className="font-semibold sm:hidden">1. Pilih Menu</span>
          </Link>

          <span className="text-outline-variant">──────</span>

          <div className="flex items-center gap-2 text-primary font-bold">
            <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-[12px] font-bold shadow-xs">
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

      {/* 3. MAIN CHECKOUT BODY */}
      <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* JIKA KERANJANG KOSONG */}
        {cart.length === 0 ? (
          <div className="max-w-md mx-auto py-16 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-8 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[36px]">remove_shopping_cart</span>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-on-surface">Keranjang Anda Masih Kosong</h2>
              <p className="text-xs text-on-surface-variant">
                Anda belum memilih menu bakso lezat untuk dipesan. Silakan kembali ke katalog menu untuk memilih porsi favorit Anda.
              </p>
            </div>
            <Link
              href="/menu"
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:bg-primary-container transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
              <span>Pilih Menu Sekarang</span>
            </Link>
          </div>
        ) : (
          
          /* LAYOUT 2 KOLOM: FORM PESANAN & DYNAMIC PEMBAYARAN */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* SISI KIRI (Col 1 to 7): DATA PEMESAN & METODE */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* KARTU 1: RINGKASAN MENU YANG DIPILIH */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
                <div className="bg-surface-container px-5 py-3.5 flex items-center justify-between border-b border-surface-container-high">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">shopping_bag</span>
                    <h3 className="text-sm font-bold text-on-surface">Rincian Menu yang Dipesan ({totalQty} Porsi)</h3>
                  </div>
                  <Link 
                    href="/menu" 
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    <span>Ubah / Tambah</span>
                  </Link>
                </div>

                <div className="p-4 flex flex-col gap-2.5 divide-y divide-surface-container">
                  {cart.map((item, index) => (
                    <div key={index} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-xs font-bold text-on-surface truncate">{item.name}</span>
                        <span className="text-[11px] text-on-surface-variant">
                          {formatIDR(item.price)} x {item.qty} Porsi = <strong className="text-on-surface">{formatIDR(item.price * item.qty)}</strong>
                        </span>
                      </div>
                      
                      {/* Qty Counter */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => changeQty(index, -1)}
                          className="w-7 h-7 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface flex items-center justify-center font-bold transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">remove</span>
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-on-surface">{item.qty}</span>
                        <button 
                          onClick={() => changeQty(index, 1)}
                          className="w-7 h-7 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface flex items-center justify-center font-bold transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                        </button>
                        <button 
                          onClick={() => removeItem(index)}
                          title="Hapus menu ini"
                          className="w-7 h-7 rounded-lg bg-error-container/50 hover:bg-error-container text-error flex items-center justify-center ml-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KARTU 2: OPSI LAYANAN (DINE-IN / BUNGKUS / ANTAR) */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden p-5 flex flex-col gap-4">
                <span className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">room_service</span>
                  1. Pilih Opsi Layanan
                </span>

                <div className="grid grid-cols-3 gap-2 bg-surface-container p-1 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setOrderType('dine-in')}
                    className={`py-2 px-2 rounded-lg text-xs transition-all flex flex-col items-center justify-center ${
                      orderType === 'dine-in' ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">table_bar</span>
                    <span>Dine-In</span>
                    <span className="text-[10px] opacity-75">Makan di Tempat</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setOrderType('takeaway')}
                    className={`py-2 px-2 rounded-lg text-xs transition-all flex flex-col items-center justify-center ${
                      orderType === 'takeaway' ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                    <span>Bungkus</span>
                    <span className="text-[10px] opacity-75">Takeaway</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`py-2 px-2 rounded-lg text-xs transition-all flex flex-col items-center justify-center ${
                      orderType === 'delivery' ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                    <span>Pesan Antar</span>
                    <span className="text-[10px] opacity-75">Delivery</span>
                  </button>
                </div>

                {/* Form Input Sesuai Opsi Layanan */}
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex flex-col gap-3">
                  {orderType === 'dine-in' && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-[18px]">table_bar</span>
                          <span>Nomor Meja Anda:</span>
                        </label>
                        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {tableNo || 'Belum diisi'}
                        </span>
                      </div>
                      <input 
                        type="text" 
                        value={tableNo}
                        onChange={(e) => setTableNo(e.target.value)}
                        className="w-full bg-surface-container-lowest px-3.5 py-2.5 rounded-xl text-xs font-semibold text-on-surface outline-none border-2 border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
                        placeholder="Contoh: Meja No. 05"
                      />
                      {/* Pilihan cepat nomor meja */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] text-on-surface-variant font-medium">Pilihan Meja:</span>
                        {['Meja No. 01', 'Meja No. 02', 'Meja No. 05', 'Meja No. 08', 'Meja No. 10'].map((meja) => (
                          <button
                            key={meja}
                            type="button"
                            onClick={() => setTableNo(meja)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                              tableNo === meja
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-surface-container hover:bg-surface-dim text-on-surface'
                            }`}
                          >
                            {meja}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {orderType === 'takeaway' && (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                          <span>Estimasi Waktu Pengambilan:</span>
                        </label>
                        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">timer</span>
                          <span>{pickupTime || 'Belum dipilih'}</span>
                        </span>
                      </div>

                      {/* Input teks kustom dengan tombol clear */}
                      <div className="relative flex items-center">
                        <span className="absolute left-3 material-symbols-outlined text-primary text-[18px] pointer-events-none">
                          schedule
                        </span>
                        <input 
                          type="text" 
                          id="pickupTimeInput"
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="w-full bg-surface-container-lowest pl-9 pr-9 py-2.5 rounded-xl text-xs font-semibold text-on-surface outline-none border-2 border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
                          placeholder="Ketik sendiri atau klik tombol waktu di bawah..."
                        />
                        {pickupTime && (
                          <button
                            type="button"
                            onClick={() => setPickupTime('')}
                            title="Hapus untuk mengetik ulang"
                            className="absolute right-2.5 w-6 h-6 rounded-full bg-surface-container hover:bg-error-container hover:text-error text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        )}
                      </div>

                      {/* Tombol Pilihan Cepat Waktu Pengambilan (Quick Chips) */}
                      <div className="flex flex-col gap-1.5 pt-0.5">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                          Pilihan Cepat Waktu Pengambilan:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { label: '⚡ 10 Menit', value: '10 Menit lagi' },
                            { label: '🕒 15 Menit', value: '15 Menit lagi' },
                            { label: '🕒 30 Menit', value: '30 Menit lagi' },
                            { label: '🕒 45 Menit', value: '45 Menit lagi' },
                            { label: '🕒 1 Jam', value: '1 Jam lagi' }
                          ].map((preset) => {
                            const isSelected = pickupTime === preset.value || pickupTime === preset.label;
                            return (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => setPickupTime(preset.value)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                  isSelected 
                                    ? 'bg-primary text-white shadow-sm ring-2 ring-primary/40 font-bold' 
                                    : 'bg-surface-container-high hover:bg-surface-container text-on-surface border border-outline-variant/40'
                                }`}
                              >
                                {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                                <span>{preset.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dropdown Pilihan Jam Siap Diambil (Makan Siang / Sore / Malam) */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[11px] text-on-surface-variant shrink-0 font-medium">Atau pilih jam:</span>
                        <select
                          onChange={(e) => {
                            if (e.target.value) setPickupTime(e.target.value);
                          }}
                          value={['Jam 11:30 WIB', 'Jam 12:00 WIB', 'Jam 12:30 WIB', 'Jam 13:00 WIB', 'Jam 14:00 WIB', 'Jam 17:00 WIB', 'Jam 18:00 WIB', 'Jam 19:00 WIB', 'Jam 20:00 WIB'].includes(pickupTime) ? pickupTime : ''}
                          className="bg-surface-container-lowest text-xs font-medium text-on-surface px-2.5 py-1.5 rounded-lg border-2 border-outline-variant/50 outline-none focus:border-primary cursor-pointer w-full transition-all"
                        >
                          <option value="">-- Pilih Jam Pengambilan --</option>
                          <option value="Jam 11:30 WIB">Jam 11:30 WIB</option>
                          <option value="Jam 12:00 WIB">Jam 12:00 WIB (Makan Siang)</option>
                          <option value="Jam 12:30 WIB">Jam 12:30 WIB</option>
                          <option value="Jam 13:00 WIB">Jam 13:00 WIB</option>
                          <option value="Jam 14:00 WIB">Jam 14:00 WIB</option>
                          <option value="Jam 17:00 WIB">Jam 17:00 WIB (Sore)</option>
                          <option value="Jam 18:00 WIB">Jam 18:00 WIB</option>
                          <option value="Jam 19:00 WIB">Jam 19:00 WIB (Makan Malam)</option>
                          <option value="Jam 20:00 WIB">Jam 20:00 WIB</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {orderType === 'delivery' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                        <span>Alamat Lengkap Pengiriman &amp; Patokan:</span>
                      </label>
                      <textarea 
                        rows={2}
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full bg-surface-container-lowest px-3.5 py-2.5 rounded-xl text-xs font-medium text-on-surface outline-none border-2 border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-xs resize-none"
                        placeholder="Contoh: Jl. Malaka Baru 1 No. 039 (Dekat BKT Pondok Kopi)..."
                      />
                    </div>
                  )}
                </div>

                {/* Form Data Pemesan & Catatan */}
                <div className="flex flex-col gap-3 pt-2 border-t border-surface-container">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">person</span>
                    Data Pemesan &amp; Catatan Racikan
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-on-surface-variant">Nama Pemesan</label>
                      <input 
                        type="text" 
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        className="bg-surface px-3 py-2 rounded-lg text-xs text-on-surface outline-none border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="Nama Pemesan"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-on-surface-variant">Nomor WhatsApp</label>
                      <input 
                        type="text" 
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        className="bg-surface px-3 py-2 rounded-lg text-xs text-on-surface outline-none border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-on-surface-variant">Catatan Racikan Khusus (Opsional)</label>
                    <input 
                      type="text" 
                      value={custNotes}
                      onChange={(e) => setCustNotes(e.target.value)}
                      className="bg-surface px-3 py-2 rounded-lg text-xs text-on-surface outline-none border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Contoh: Kuah dipisah, banyak sambal &amp; daun bawang gurih..."
                    />
                  </div>
                </div>
              </div>

              {/* KARTU 3: PILIHAN METODE PEMBAYARAN */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden p-5 flex flex-col gap-3">
                <span className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
                  2. Pilih Metode Pembayaran
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* METODE 1: QRIS INSTAN */}
                  <div 
                    onClick={() => {
                      if (paymentMethod === 'qris' && qrisExpired) {
                        handleRetryQris();
                      } else {
                        handleSwitchPaymentMethod('qris');
                      }
                    }}
                    className={`cursor-pointer p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center relative ${
                      paymentMethod === 'qris' 
                        ? 'border-primary bg-primary-fixed/20 shadow-xs ring-2 ring-primary/20' 
                        : 'border-outline-variant/40 bg-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]">qr_code_2</span>
                    </div>
                    <span className="text-xs font-bold text-on-surface">QRIS Instan (10 Mnt)</span>
                    <span className="text-[10px] text-tertiary font-bold bg-tertiary-fixed/30 px-2 py-0.5 rounded-full">
                      AJI STORE
                    </span>
                    <span className="text-[10px] text-on-surface-variant leading-tight">
                      BCA, BRI, Mandiri, GoPay, OVO, Dana
                    </span>
                    {paymentMethod === 'qris' && qrisExpired && (
                      <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-error text-white text-[9px] font-bold shadow-xs">
                        Expired
                      </span>
                    )}
                  </div>

                  {/* METODE 2: TUNAI DI KASIR */}
                  <div 
                    onClick={() => handleSwitchPaymentMethod('tunai')}
                    className={`cursor-pointer p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      paymentMethod === 'tunai' 
                        ? 'border-primary bg-primary-fixed/20 shadow-xs ring-2 ring-primary/20' 
                        : 'border-outline-variant/40 bg-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]">point_of_sale</span>
                    </div>
                    <span className="text-xs font-bold text-on-surface">Tunai di Kasir</span>
                    <span className="text-[10px] text-on-surface-variant">
                      Bayar langsung di kasir toko
                    </span>
                  </div>

                  {/* METODE 3: COD KURIR */}
                  <div 
                    onClick={() => handleSwitchPaymentMethod('cod')}
                    className={`cursor-pointer p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      paymentMethod === 'cod' 
                        ? 'border-primary bg-primary-fixed/20 shadow-xs ring-2 ring-primary/20' 
                        : 'border-outline-variant/40 bg-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]">local_shipping</span>
                    </div>
                    <span className="text-xs font-bold text-on-surface">COD Kurir</span>
                    <span className="text-[10px] text-on-surface-variant">
                      Bayar saat pesanan tiba
                    </span>
                  </div>

                </div>
              </div>

            </div>

            {/* SISI KANAN (Col 8 to 12): DYNAMIC GENERATE PEMBAYARAN & SUBMIT */}
            <div className="lg:col-span-5 flex flex-col gap-5 sticky top-24">
              
              {/* AREA PEMBAYARAN DINAMIS: QRIS ATAU TUNAI ATAU COD */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-md border border-outline-variant/30 overflow-hidden flex flex-col">
                
                <div className="bg-surface-container px-5 py-3.5 flex items-center justify-between border-b border-surface-container-high">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      {paymentMethod === 'qris' ? 'qr_code_scanner' : paymentMethod === 'tunai' ? 'receipt_long' : 'local_shipping'}
                    </span>
                    <h3 className="text-sm font-bold text-on-surface">
                      {paymentMethod === 'qris' ? 'Barcode QRIS Tergenerate' : paymentMethod === 'tunai' ? 'Instruksi Bayar Tunai' : 'Instruksi Pembayaran COD'}
                    </h3>
                  </div>
                  {paymentMethod === 'qris' && (
                    <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold">
                      Scan Langsung
                    </span>
                  )}
                </div>

                <div className="p-5 flex flex-col items-center gap-4 text-center">
                  
                  {/* JIKA METODE QRIS DIPILIH: TAMPILKAN KARTU INFORMASI (POPUP DIBUKA DENGAN TOMBOL, TIMER BARU BERJALAN SAAT POPUP MUNCUL) */}
                  {paymentMethod === 'qris' && (
                    <div className="w-full flex flex-col items-center gap-3.5 py-2">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[32px]">qr_code_2</span>
                      </div>

                      <div className="flex flex-col gap-1 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-xs font-bold text-on-surface">QRIS Instan Nasional</span>
                          <span className="text-[10px] text-tertiary font-bold bg-tertiary-fixed/30 px-2 py-0.5 rounded-full">AJI STORE</span>
                        </div>
                        <span className="text-[11px] font-mono text-on-surface-variant font-semibold">NMID: ID1026632017442</span>
                        <div className="mt-1 px-3 py-1 bg-primary/10 rounded-full w-fit mx-auto">
                          <span className="text-xs font-bold text-primary">Tagihan: {formatIDR(grandTotal)}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant max-w-xs mt-1.5 leading-relaxed">
                          Tekan tombol di bawah untuk membuka popup barcode QRIS resmi. <strong>Batas waktu 10 menit akan mulai berjalan saat popup barcode muncul.</strong>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenQrisModal}
                        className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                        <span>Buka Barcode QRIS &amp; Mulai Waktu (10 Menit)</span>
                      </button>
                    </div>
                  )}

                  {/* JIKA PILIH TUNAI */}
                  {paymentMethod === 'tunai' && (
                    <div className="w-full flex flex-col items-center gap-3 py-2 text-left">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[28px]">point_of_sale</span>
                      </div>
                      
                      <div className="flex flex-col gap-1 text-center">
                        <span className="text-xs font-bold text-on-surface">Pembayaran Tunai di Meja Kasir</span>
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full w-fit mx-auto">
                          Wajib Langsung Menuju ke Kasir
                        </span>
                        <p className="text-xs text-on-surface-variant max-w-xs mt-1 leading-relaxed">
                          Customer wajib membawa barcode tiket ini langsung ke meja kasir untuk di-scan oleh petugas kasir.
                        </p>
                      </div>

                      {/* Barcode Tiket Preview */}
                      <div className="w-full">
                        <Barcode1D 
                          value={referenceCode || 'BKS-KASIR'} 
                          subtitle="TUNJUKKAN & SCAN DI MEJA KASIR" 
                          height={52} 
                        />
                      </div>

                      <div className="w-full p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                        <span className="font-semibold">Total Tagihan Tunai:</span>
                        <strong className="text-sm font-extrabold text-amber-950">{formatIDR(grandTotal)}</strong>
                      </div>

                      <p className="text-[11px] text-on-surface-variant text-center leading-normal">
                        Tekan tombol konfirmasi di bawah untuk menerbitkan tiket resmi dan menyimpannya ke antrean kasir.
                      </p>
                    </div>
                  )}

                  {/* JIKA PILIH COD */}
                  {paymentMethod === 'cod' && (
                    <div className="w-full flex flex-col items-center gap-3 py-4 text-left">
                      <div className="w-12 h-12 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[28px]">local_shipping</span>
                      </div>
                      <div className="flex flex-col gap-1 text-center">
                        <h4 className="text-sm font-bold text-on-surface">Pembayaran Cash on Delivery (COD)</h4>
                        <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
                          Pembayaran tunai diserahkan langsung kepada kurir pengantar saat pesanan tiba di alamat tujuan.
                        </p>
                      </div>
                      <div className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0">check_circle</span>
                        <span>Siapkan uang pas: <strong className="text-on-surface font-bold">{formatIDR(grandTotal)}</strong></span>
                      </div>
                    </div>
                  )}

                </div>

                {/* RINCIAN TAGIHAN */}
                <div className="px-5 py-3.5 bg-surface-container-low flex flex-col gap-1.5 border-t border-surface-container">
                  <div className="flex items-center justify-between text-xs text-on-surface-variant">
                    <span>Subtotal {totalQty} Porsi Menu</span>
                    <span className="text-on-surface font-semibold">{formatIDR(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span>Biaya Layanan &amp; Kemasan</span>
                      {packagingFee === 0 ? (
                        <span className="text-[10px] text-tertiary font-bold bg-tertiary/10 px-1.5 py-0.2 rounded">Gratis</span>
                      ) : null}
                    </span>
                    <span className="text-on-surface font-semibold">{formatIDR(packagingFee)}</span>
                  </div>
                  <div className="w-full h-px bg-surface-container-highest my-1"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-on-surface">Total Pembayaran</span>
                    <span className="text-lg font-bold text-primary">{formatIDR(grandTotal)}</span>
                  </div>
                </div>

                {/* TOMBOL FINAL: BUKA POPUP QRIS ATAU KIRIM PESANAN */}
                <div className="p-5 bg-surface-container-lowest flex flex-col gap-3 border-t border-surface-container">
                  {paymentMethod === 'qris' ? (
                    <button 
                      onClick={handleOpenQrisModal}
                      className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs md:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                        qr_code_scanner
                      </span>
                      <span>
                        Buka Barcode QRIS &amp; Bayar (10 Menit)
                      </span>
                    </button>
                  ) : (
                    <button 
                      onClick={submitOrder}
                      disabled={submitting}
                      className="w-full py-3.5 px-4 rounded-xl bg-tertiary hover:bg-tertiary-container text-on-tertiary font-bold text-xs md:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                        {submitting ? 'hourglass_top' : 'chat'}
                      </span>
                      <span>
                        {submitting ? 'Memproses Pesanan...' : 'Konfirmasi & Kirim Pesanan via WhatsApp'}
                      </span>
                    </button>
                  )}

                  <p className="text-[11px] text-on-surface-variant text-center leading-tight">
                    Pesanan akan otomatis masuk ke antrean KDS Dapur &amp; membuka WhatsApp admin warung.
                  </p>

                  {/* Accordion Preview Pesan WhatsApp */}
                  <div className="w-full bg-surface-container-low rounded-xl p-2.5 flex flex-col gap-1 border border-outline-variant/30">
                    <div 
                      className="flex items-center justify-between cursor-pointer" 
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <span className="text-[11px] font-bold text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-tertiary">terminal</span>
                        Lihat Draf Pesan WhatsApp
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                        {showPreview ? 'expand_less' : 'expand_more'}
                      </span>
                    </div>
                    {showPreview && (
                      <pre className="text-[10px] text-on-surface-variant font-mono whitespace-pre-wrap bg-surface p-2.5 rounded-lg border border-outline-variant/20 max-h-40 overflow-y-auto mt-1">
                        {generateWhatsAppMessage()}
                      </pre>
                    )}
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* POPUP MODAL PEMBAYARAN QRIS RESMI (TIMER 10 MENIT HANYA BERJALAN SAAT POPUP MUNCUL) */}
      {showQrisModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative bg-white text-neutral-900 rounded-3xl p-5 sm:p-6 max-w-sm w-full flex flex-col items-center gap-3 text-center shadow-2xl animate-in zoom-in-95 duration-200 border border-outline-variant/30">
            
            {/* Tombol Tutup Modal */}
            <button 
              onClick={() => {
                setShowQrisModal(false);
                if (qrisExpired) setQrisExpired(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold transition-colors"
              title="Tutup Popup"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            {!qrisExpired ? (
              <>
                {/* Header & Live Timer Countdown (10 Menit) */}
                <div className="flex flex-col items-center gap-1 w-full pr-6">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold animate-pulse">
                    <span className="material-symbols-outlined text-[16px]">timer</span>
                    <span>Batas Waktu: {formatTimer(countdown)} (10 Mnt)</span>
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 mt-1">AJI STORE - HOME SERVICE</h3>
                  <span className="text-[11px] font-mono text-neutral-600 font-bold">NMID: ID1026632017442</span>
                  <span className="text-[10px] text-neutral-500 font-mono">Kode Ref: #{referenceCode}</span>
                </div>

                {/* Barcode QRIS Resmi */}
                <div className="w-full bg-neutral-50 p-2 rounded-2xl border border-neutral-200 flex items-center justify-center">
                  <img 
                    src="/qris-pembayaran.jpeg" 
                    alt="Barcode QRIS AJI STORE"
                    className="w-full max-h-[260px] object-contain rounded-xl"
                  />
                </div>

                {/* Total Tagihan */}
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[11px] text-neutral-500">Total Nominal Pembayaran:</span>
                  <span className="text-xl font-bold text-primary">{formatIDR(grandTotal)}</span>
                  <span className="text-[10px] text-neutral-500">Mendukung BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay</span>
                </div>

                {/* Tombol Aksi */}
                <div className="flex flex-col gap-2 w-full pt-1">
                  <button 
                    onClick={submitOrder}
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-xl bg-tertiary hover:bg-tertiary-container text-on-tertiary font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Saya Sudah Bayar via QRIS</span>
                  </button>

                  <div className="flex items-center gap-2 w-full">
                    <a
                      href="/qris-pembayaran.jpeg"
                      download={`QRIS-Juragan-Bakso-${referenceCode}.jpeg`}
                      className="flex-1 py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      title="Unduh Gambar Barcode"
                    >
                      <span className="material-symbols-outlined text-[15px]">download</span>
                      <span>Unduh QRIS</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowQrisModal(false)}
                      className="py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-semibold text-xs"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* SAAT TIMER 10 MENIT HABIS (EXPIRED / GAGAL) */
              <div className="flex flex-col items-center gap-3 py-3 w-full">
                <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined text-[32px]">timer_off</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
                    Batas Waktu 10 Menit Habis
                  </span>
                  <h3 className="text-base font-bold text-neutral-900">
                    Pembayaran QRIS Gagal &amp; Kedaluwarsa
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed max-w-xs">
                    Waktu pembayaran 10 menit telah berakhir. Barcode QRIS sebelumnya sudah tidak berlaku demi keamanan transaksi Anda.
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full pt-2">
                  <button
                    onClick={handleRetryQris}
                    className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    <span>Generate Ulang QRIS (Mulai 10 Menit Baru)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                      onClick={() => handleSwitchPaymentMethod('tunai')}
                      className="py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">point_of_sale</span>
                      <span>Bayar Tunai</span>
                    </button>
                    <button
                      onClick={() => handleSwitchPaymentMethod('cod')}
                      className="py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">local_shipping</span>
                      <span>Bayar COD</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 5. MODAL STRUK PESANAN SUKSES & BUKTI PEMBAYARAN THERMAL */}
      {orderSuccessModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative bg-surface rounded-3xl p-4 sm:p-6 max-w-md w-full flex flex-col items-center gap-3 text-center shadow-2xl animate-in zoom-in-95 duration-200 border border-outline-variant/30 my-auto max-h-[92vh] overflow-y-auto">
            
            {/* Header Konfirmasi Sukses */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <div className="text-left">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Pesanan Berhasil Dicatat!</span>
                <h3 className="text-base font-bold text-on-surface">Struk &amp; Tiket Pesanan Resmi</h3>
              </div>
            </div>

            {/* Peringatan Khusus untuk Pembayaran Tunai Kasir */}
            {orderSuccessModal.paymentMethod?.includes('Tunai') && (
              <div className="w-full p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs flex items-start gap-2.5 text-left">
                <span className="material-symbols-outlined text-[24px] text-amber-700 shrink-0 mt-0.5 animate-pulse">point_of_sale</span>
                <div className="flex-1">
                  <span className="font-bold text-sm block text-amber-950">Harap Langsung Menuju ke Meja Kasir!</span>
                  <span className="text-xs text-amber-900 leading-relaxed block mt-0.5">
                    Tunjukkan barcode tiket di bawah ini kepada petugas kasir untuk di-scan dan selesaikan pembayaran tunai sebesar <strong>{formatIDR(orderSuccessModal.total)}</strong>.
                  </span>
                </div>
              </div>
            )}

            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Pesanan telah masuk ke antrean dapur kasir. Simpan atau cetak struk di bawah ini sebagai bukti transaksi sah Anda:
            </p>

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
                <span>{orderSuccessModal.paymentMethod?.includes('QRIS') ? '✓ LUNAS (QRIS)' : '✓ DITERIMA KASIR'}</span>
              </div>

              <div>No Tiket: <strong>{orderSuccessModal.orderData?.id || orderSuccessModal.orderId}</strong></div>
              <div>Waktu   : {orderSuccessModal.orderData?.timestamp || 'Baru Saja'}</div>
              <div>Pemesan : {orderSuccessModal.orderData?.customer_name || custName}</div>
              <div>Layanan : {orderSuccessModal.orderData?.order_type_label || (orderType === 'takeaway' ? 'Bungkus' : orderType === 'delivery' ? 'Pesan Antar' : 'Makan di Tempat')}</div>
              <div>Detail  : {orderSuccessModal.orderData?.order_detail_meta || (orderType === 'takeaway' ? pickupTime : orderType === 'delivery' ? deliveryAddress : tableNo)}</div>
              
              <div style={{ margin: '6px 0', color: '#888' }}>--------------------------------</div>
              
              {(orderSuccessModal.orderData?.items || []).map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>{it.name} x{it.qty}</span>
                  <span>{formatIDR((Number(it.price) || 0) * (Number(it.qty) || 1))}</span>
                </div>
              ))}
              
              <div style={{ margin: '6px 0', color: '#888' }}>--------------------------------</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Biaya Layanan/Bungkus:</span>
                <span>{formatIDR(orderSuccessModal.orderData?.packaging_fee || packagingFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #ccc' }}>
                <span>TOTAL:</span>
                <span>{formatIDR(orderSuccessModal.orderData?.total || orderSuccessModal.total)}</span>
              </div>
              <div style={{ margin: '6px 0', color: '#888' }}>--------------------------------</div>
              
              <div>Metode Bayar: <strong>{orderSuccessModal.orderData?.payment_method || orderSuccessModal.paymentMethod}</strong></div>
              
              {orderSuccessModal.paymentMethod?.includes('QRIS') && (
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

              {orderSuccessModal.paymentMethod?.includes('Tunai') && (
                <div style={{ textAlign: 'center', margin: '8px 0', padding: '8px', border: '2px solid #8d4b00', borderRadius: '8px', background: '#fffcf7' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#8d4b00', marginBottom: '2px' }}>
                    BARCODE TIKET KASIR (BAYAR TUNAI)
                  </div>
                  <div style={{ fontSize: '9px', color: '#666', marginBottom: '6px' }}>
                    Wajib langsung ditunjukkan ke meja kasir untuk di-scan
                  </div>
                  <Barcode1D 
                    value={orderSuccessModal.orderData?.id || orderSuccessModal.orderId} 
                    height={48} 
                    subtitle="KASIR TUNAI • SCAN DISINI"
                  />
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#92400e', marginTop: '6px', background: '#fef3c7', padding: '4px', borderRadius: '4px' }}>
                    Siapkan uang pas: {formatIDR(orderSuccessModal.orderData?.total || orderSuccessModal.total)}
                  </div>
                </div>
              )}

              {orderSuccessModal.orderData?.notes && orderSuccessModal.orderData.notes !== '-' && (
                <>
                  <div style={{ margin: '6px 0', color: '#888' }}>--------------------------------</div>
                  <div>Catatan Dapur:</div>
                  <div style={{ fontStyle: 'italic', color: '#333' }}>"{orderSuccessModal.orderData.notes}"</div>
                </>
              )}

              <div style={{ textAlign: 'center', margin: '8px 0', color: '#888' }}>================================</div>
              <div style={{ textAlign: 'center', fontSize: '10px', color: '#555' }}>Simpan struk ini sebagai bukti pembayaran sah.</div>
              <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 'bold', marginTop: '2px' }}>Terima Kasih Atas Kunjungan Anda!</div>
            </div>

            {/* Tombol Aksi Final */}
            <div className="flex flex-col gap-2 w-full pt-1">
              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2.5 px-3 rounded-xl bg-neutral-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-neutral-800 active:scale-95 transition-all shadow-sm"
                  title="Cetak struk ke printer thermal atau simpan sebagai PDF"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>Cetak Struk</span>
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    window.open(orderSuccessModal.waUrl, '_blank');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-tertiary hover:bg-tertiary-container text-on-tertiary font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  <span>Kirim ke WA</span>
                </button>
              </div>

              <Link 
                href={`/pesanan?id=${encodeURIComponent(orderSuccessModal.orderId)}`}
                onClick={() => setOrderSuccessModal({ ...orderSuccessModal, open: false })}
                className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 hover:bg-primary-container active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">track_changes</span>
                <span>Lacak Status Pesanan Ini (Live Dapur) →</span>
              </Link>
              
              <Link 
                href="/menu"
                onClick={() => setOrderSuccessModal({ ...orderSuccessModal, open: false })}
                className="w-full py-2 rounded-xl bg-surface-container hover:bg-surface-dim text-on-surface text-xs font-semibold transition-colors"
              >
                Pesan Menu Lainnya
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* 6. TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 transition-all duration-300">
          <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">check_circle</span>
          <span className="text-xs sm:text-sm font-semibold">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
