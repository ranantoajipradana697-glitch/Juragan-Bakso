'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Barcode1D from '@/components/Barcode1D';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [orders, setOrders] = useState([]);
  const [menus, setMenus] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [storeOpen, setStoreOpen] = useState(true);
  
  // Modul Tampilan Khusus Dashboard Admin ('orders' | 'inventory' | 'reports')
  const [adminView, setAdminView] = useState('orders');
  const [reportTimeframe, setReportTimeframe] = useState('today');
  
  // Menu Category, Search & Stock Filters (Fitur Menu Terpisah Rapi)
  const [menuCategoryFilter, setMenuCategoryFilter] = useState('all');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [menuStockFilter, setMenuStockFilter] = useState('all');
  
  // Modals state
  const [menuModal, setMenuModal] = useState({ open: false, mode: 'add', data: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
  const [slipModal, setSlipModal] = useState({ open: false, order: null });
  const [qrisModalOpen, setQrisModalOpen] = useState(false);

  // WhatsApp & Scanner States
  const [waModal, setWaModal] = useState({
    open: false,
    order: null,
    template: 'default',
    message: '',
    targetPhone: '',
    copied: false
  });
  const [waToast, setWaToast] = useState({ show: false, order: null, status: '' });
  const [cashScanCode, setCashScanCode] = useState('');
  const [cashScanResult, setCashScanResult] = useState({ show: false, success: false, message: '' });

  // Form State for Add/Edit Menu
  const [formName, setFormName] = useState('');
  const [formCat, setFormCat] = useState('Bakso Spesial Kuah');
  const [formPrice, setFormPrice] = useState(32000);
  const [formStock, setFormStock] = useState(25);
  const [formDesc, setFormDesc] = useState('');
  const [formPortion, setFormPortion] = useState('1 Porsi + Kuah Segar');
  const [formImage, setFormImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Preset foto kuliner siap pakai untuk admin
  const PRESET_IMAGES = [
    { 
      label: 'Bakso Lava', 
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlG5IThUnnsSf04s_nGZ3NIaMijcFR5xv7_lkwzZzTHrCj54HFlTkPf00D2t6xMUQwcg2X3cqYqvQCazO6GfNPR9_mGETsb30QtoTNqUbnQxPqv7CAujR58Z5Np9rr4I8KfcacABLR7umeiAAGbgknPFY4jvrzvFOqyPRhEsQvnuX5IP25Gc8xO3bXm4CLJFae9IG1KlP2uBa2xSFqMW0od7EitdfjwY3NDPo5-vI' 
    },
    { 
      label: 'Bakso Urat Granat', 
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbDeCyDnVOL2BBmoItdgN1cMQBMddSg4m0PtkMZob5JkXQnLM-n_ayf6h57yY09pB3_qiCRAEeft26JGjE0K6zLnWi43vaHx_7kqWx1vnFyflOFb53XEo0H8j5pbSy6GZhlOOcS05UY7SDHze5dsIO4ye8wgvUGPz9LAjGiQw9jbr-cVpQipUAj0s2TZ7BEpkq-r5jT942-1ekc8KSQt4gULNgH9Drjg9qCEVnNh4' 
    },
    { 
      label: 'Bakso Halus Sumsum', 
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2bMAqanLrzT4BAK249I0BpdJJrZYcP4hH9S-qr_17w5aHLPtLHdKzUmsTzzPgahZJNQ-yNJRGlBvJ5hsSE5iVd178hbTdjZAWRBxGyIYgWHGyhM4ehKd3zP5LY4-GVrUcapi63ufDRwT5t8yeDZN_Nq2O3bzFlsZJUoZI2U52Ix0vaePe_b795ygmfpe4D2lfys200R5KU9XEB0agYS5k502pdQTVIlYnrIgkgOU' 
    },
    { 
      label: 'Mie Ayam Bakso', 
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxc7d7tBOtzjnPh99GRQ9a5MN8vGVspP-exgrD4sA9ShaoR6l5AVQzx3U8A1JOa8oxFauHHivzGDoKLvtj5QBneUxog15dUcVXaPhVXvd-2-J84MQUxGoulpNvoiGencOD8yd_OK0KukUqZgn6tHk82aIEcl0eMcD8ySHwg52rIUWDeQuYQhoQwdquc0EKFY1kIhU-CMVqx3MhNmtneMQNBTaKOnmsABhE1ZhJX4M' 
    },
    { 
      label: 'Pangsit Goreng', 
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd-6mbhB99waNRTqJYZKIRQ_1MXhZCxhIbmWin5-gnXHbidaMUxV1ceDn0Aj_S9Cz4qiq9QE_VzTj6GSK8cUWvDdzLMF4-PF84RQy_HolUP2iB3AQc_2mWFs7l4eRV-YTv8YuOCmwP2oEgtfLyYqqtB-vRP-uP6y9RIls3J7yCMoPCBBAmQFTfJApb1ATiqbqHHJuaXk6XthHSaFjQMNk2ZObNP_rQxPXXDNKYQvc' 
    },
    { 
      label: 'Es Teh Jumbo', 
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuq5sYJ1Jl8aL53dNvvDKPGZgdGF6XCbuGgpQqPVFRfLrco6xgZuX6gQX8-ohstFQDhmHpAkC2MrfgH9LlLivU4dfEXk7-jQEOedaRqcKpFW_hFPh7LxVbv8_JI2quq_lmtd8H7TVMKg2krkxH5IcgiQD0zRUAL0miQ8r-Aj0DofmKd5-a8pm8d8G06No4uD2tIciavsAYztNwC1Fqhf1YTBcNNCJKKj6I7Xd7ZJI' 
    }
  ];

  // 1. Check Auth Guard (Fitur 12)
  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem('juragan_bakso_user') || localStorage.getItem('juragan_bakso_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.role === 'admin') {
          setAuthorized(true);
        } else {
          router.push('/admin/login?msg=admin_only');
          return;
        }
      } else {
        router.push('/admin/login?msg=admin_required');
        return;
      }
    } catch (e) {
      router.push('/admin/login?msg=admin_required');
      return;
    }

    loadDashboardData();

    // Auto-polling real-time setiap 3 detik agar pesanan yang baru masuk otomatis tampil
    const pollInterval = setInterval(() => {
      loadDashboardData();
    }, 3000);

    // Sinkronisasi lintas tab jika ada pesanan baru masuk
    const handleStorageSync = (e) => {
      if (e.key === 'juragan_bakso_last_order' || e.key === 'juragan_bakso_custom_menus') {
        loadDashboardData();
      }
    };
    window.addEventListener('storage', handleStorageSync);
    window.addEventListener('orderCreated', loadDashboardData);
    window.addEventListener('stockUpdated', loadDashboardData);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageSync);
      window.removeEventListener('orderCreated', loadDashboardData);
      window.removeEventListener('stockUpdated', loadDashboardData);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      // 1. Fetch Orders dari API dengan cache-busting
      const ordRes = await fetch(`/api/orders?_t=${Date.now()}`, { cache: 'no-store' });
      const ordJson = await ordRes.json();
      if (ordJson.success && ordJson.data) {
        setOrders(ordJson.data);
      }

      // 2. Fetch Menus
      const mRes = await fetch(`/api/menus?_t=${Date.now()}`, { cache: 'no-store' });
      const mJson = await mRes.json();
      if (mJson.success && mJson.data) {
        let menuList = mJson.data;
        // Sinkronisasi menu kustom & stok lokal jika Vercel serverless cold-start
        try {
          const localCustom = JSON.parse(localStorage.getItem('juragan_bakso_custom_menus') || '[]');
          if (localCustom.length > 0) {
            // Server adalah sumber kebenaran (Source of Truth) untuk stok menu
            // Perbarui item yang ada di localCustom dengan status & stok aktual dari server
            const updatedLocal = localCustom.map(lm => {
              const serverMatch = menuList.find(sm => sm.name === lm.name || sm.id === lm.id);
              if (serverMatch) {
                return {
                  ...lm,
                  stock: Number(serverMatch.stock || 0),
                  is_available: Number(serverMatch.stock || 0) > 0,
                  badge: serverMatch.badge,
                  badge_type: serverMatch.badge_type,
                  price: serverMatch.price
                };
              }
              return lm;
            });
            localStorage.setItem('juragan_bakso_custom_menus', JSON.stringify(updatedLocal));

            // Hanya sertakan menu yang benar-benar belum tercatat di server (menu kustom baru)
            const missing = updatedLocal.filter(lm => !menuList.some(sm => sm.name === lm.name || sm.id === lm.id));
            if (missing.length > 0) {
              menuList = [...menuList, ...missing];
              // Re-sync otomatis ke serverless memory
              for (const mm of missing) {
                await fetch('/api/menus', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(mm)
                });
              }
            }
          }
        } catch (storageErr) {}
        setMenus(menuList);
      }

      // 3. Fetch Settings
      const sRes = await fetch(`/api/settings?_t=${Date.now()}`, { cache: 'no-store' });
      const sJson = await sRes.json();
      if (sJson.success && sJson.data) {
        setStoreOpen(Boolean(sJson.data.is_open));
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  const formatIDR = (num) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  // Toggle Warung Buka / Tutup
  const toggleStoreStatus = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: !storeOpen })
      });
      const json = await res.json();
      if (json.success) {
        setStoreOpen(!storeOpen);
      }
    } catch (e) {}
  };

  // Helper normalisasi nomor WhatsApp untuk API (selalu format 62xxx tanpa awalan 0 atau +)
  const formatWaPhone = (rawPhone) => {
    if (!rawPhone) return '';
    let cleaned = String(rawPhone).replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  };

  // Helper generator template pesan WhatsApp resmi untuk pelanggan
  const generateAdminWaMessage = (order, customStatus = null) => {
    if (!order) return '';
    const statusToUse = customStatus || order.status;
    let statusLabel = 'Sedang Diproses';
    let statusEmoji = '⏳';
    let statusNotes = 'Pesanan Anda sedang kami siapkan dengan bahan berkualitas pilihan. Mohon ditunggu ya! 🙏';

    if (statusToUse === 'baru') {
      statusLabel = 'Pesanan Diterima di Kasir';
      statusEmoji = '⚡';
      statusNotes = 'Pesanan Anda telah masuk ke antrean kasir & dapur dan segera diproses.';
    } else if (statusToUse === 'masak') {
      statusLabel = 'Sedang Diracik & Dimasak Dapur';
      statusEmoji = '🍳';
      statusNotes = 'Kuah kaldu dan olahan bakso pesanan Anda sedang dimasak dengan tingkat kematangan pas.';
    } else if (statusToUse === 'siap') {
      statusLabel = 'SUDAH SIAP SAJI / SIAP DIAMBIL';
      statusEmoji = '📦';
      statusNotes = '🎉 Hore! Pesanan Anda sudah matang & siap saji. Silakan dinikmati hangat-hangat atau diambil di meja kasir.';
    } else if (statusToUse === 'selesai') {
      statusLabel = 'Selesai & Lunas';
      statusEmoji = '✅';
      statusNotes = '🙏 Terima kasih banyak telah menikmati sajian Juragan Bakso Nusantara. Semoga cocok dan kami tunggu pesanan Anda kembali!';
    } else if (statusToUse === 'batal') {
      statusLabel = 'Dibatalkan oleh Resto';
      statusEmoji = '❌';
      statusNotes = 'Mohon maaf, pesanan ini tidak dapat diproses karena kendala operasional/stok. Silakan hubungi kasir kami untuk info lebih lanjut.';
    }

    const itemsList = (order.items || [])
      .map(it => `• ${it.qty}x ${it.name}`)
      .join('\n');

    return (
`Halo Kak *${order.customer_name}*! 🍜
Salam hangat dari *Juragan Bakso Nusantara*.

Berikut update status pesanan Anda:
📋 *No. Tiket:* ${order.id}
🔔 *Status:* ${statusEmoji} ${statusLabel}
🛵 *Layanan:* ${order.order_type_label || '-'} (${order.order_detail_meta || '-'})

🍲 *Rincian Pesanan:*
${itemsList}

💰 *Total Tagihan:* ${formatIDR(order.total)} (${order.payment_method || '-'})
${order.notes && order.notes !== '-' ? `📝 *Catatan Dapur:* "${order.notes}"\n` : ''}
${statusNotes}`
    );
  };

  const openWaModal = (order, presetStatus = null) => {
    const phone = formatWaPhone(order.customer_phone);
    const msg = generateAdminWaMessage(order, presetStatus || order.status);
    setWaModal({
      open: true,
      order: order,
      template: presetStatus || order.status,
      message: msg,
      targetPhone: phone,
      copied: false
    });
  };

  const handleApplyWaTemplate = (tplKey) => {
    if (!waModal.order) return;
    const msg = generateAdminWaMessage(waModal.order, tplKey);
    setWaModal(prev => ({
      ...prev,
      template: tplKey,
      message: msg
    }));
  };

  const handleLaunchWhatsApp = (mode = 'universal') => {
    const phone = formatWaPhone(waModal.targetPhone);
    if (!phone || phone.length < 9) {
      alert(`Nomor WhatsApp pemesan (${waModal.targetPhone || 'kosong'}) tidak valid! Pastikan minimal 9 digit angka.`);
      return;
    }

    let url = '';
    if (mode === 'web') {
      url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(waModal.message)}`;
    } else {
      url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(waModal.message)}`;
    }

    window.open(url, '_blank');
  };

  const handleCopyWaMessage = () => {
    if (!waModal.message) return;
    navigator.clipboard.writeText(waModal.message);
    setWaModal(prev => ({ ...prev, copied: true }));
    setTimeout(() => {
      setWaModal(prev => ({ ...prev, copied: false }));
    }, 3000);
  };

  // Validasi Pembayaran Tunai Kasir via Barcode / Tombol Kasir
  const handleValidateCash = async (orderId) => {
    try {
      const target = orders.find(o => o.id === orderId);
      if (!target) return;

      const newPaymentMethod = 'Kasir Tunai • Lunas';
      const nextStatus = target.status === 'baru' ? 'masak' : target.status;

      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          payment_method: newPaymentMethod,
          status: nextStatus 
        })
      });
      const json = await res.json();
      if (json.success) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, payment_method: newPaymentMethod, status: nextStatus } : o));
        setCashScanResult({
          show: true,
          success: true,
          message: `Sukses! Pembayaran Tunai untuk ${orderId} (${target.customer_name}) sebesar ${formatIDR(target.total)} telah divalidasi LUNAS!`
        });
        setTimeout(() => setCashScanResult({ show: false, success: false, message: '' }), 5000);
        // Sinkronkan seluruh data dashboard & stok menu
        loadDashboardData();
      }
    } catch (e) {
      alert('Gagal memvalidasi pembayaran tunai: ' + e.message);
    }
  };

  const handleScanInputSubmit = (e) => {
    e.preventDefault();
    const query = cashScanCode.trim().toUpperCase().replace(/^#/, '');
    if (!query) return;

    // Cari tiket berdasarkan id atau nomor barcode
    const matched = orders.find(o => {
      const cleanId = String(o.id).toUpperCase().replace(/^#/, '');
      return cleanId === query || cleanId === `BKS-${query}` || o.id === query;
    });

    if (matched) {
      handleValidateCash(matched.id);
      setCashScanCode('');
    } else {
      setCashScanResult({
        show: true,
        success: false,
        message: `Tiket "${cashScanCode}" tidak ditemukan di antrean kasir. Pastikan format tiket benar (contoh: BKS-097).`
      });
      setTimeout(() => setCashScanResult({ show: false, success: false, message: '' }), 5000);
    }
  };

  // Update Status Pesanan (PATCH)
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        // Sinkronkan data dashboard agar stok menu dan rekap status langsung terupdate
        loadDashboardData();
        
        // Tampilkan toast untuk menawarkan pengiriman notifikasi WhatsApp ke pemesan
        const targetOrder = orders.find(o => o.id === orderId);
        if (targetOrder) {
          const updated = { ...targetOrder, status: newStatus };
          setWaToast({
            show: true,
            order: updated,
            status: newStatus
          });
          setTimeout(() => {
            setWaToast(prev => ({ ...prev, show: false }));
          }, 8000);
        }
      }
    } catch (e) {}
  };

  // Quick Stock Change (+1, +10)
  const quickStockChange = async (menu, delta) => {
    const newStock = Math.max(0, Number(menu.stock) + delta);
    try {
      const res = await fetch(`/api/menus/${menu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });
      const json = await res.json();
      if (json.success) {
        setMenus(menus.map(m => m.id === menu.id ? { ...m, stock: newStock, is_available: newStock > 0 } : m));
        // Perbarui stok di penyimpanan lokal agar tidak hilang saat Vercel cold-start
        try {
          const localCustom = JSON.parse(localStorage.getItem('juragan_bakso_custom_menus') || '[]');
          const idx = localCustom.findIndex(m => m.name === menu.name || m.id === menu.id);
          if (idx > -1) {
            localCustom[idx].stock = newStock;
            localCustom[idx].is_available = newStock > 0;
            localStorage.setItem('juragan_bakso_custom_menus', JSON.stringify(localCustom));
          } else {
            localCustom.push({ ...menu, stock: newStock, is_available: newStock > 0 });
            localStorage.setItem('juragan_bakso_custom_menus', JSON.stringify(localCustom));
          }
        } catch (storageErr) {}
      }
    } catch (e) {}
  };

  // Kompresi dan optimasi gambar otomatis dari kamera HP / file komputer (Direct Device Upload)
  const compressImageFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800; // Ukuran optimal untuk gambar kuliner web & mobile

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Hasilkan format JPEG teroptimasi (~35-60KB, tajam dan ringan)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressedDataUrl);
        };
        img.onerror = () => resolve(event.target.result);
        img.src = event.target.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Handler Upload Berkas Gambar Menu dari Komputer / HP
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // 1. Kompresi gambar langsung dari HP / Komputer secara instan (< 60KB)
      const dataUrl = await compressImageFile(file);
      if (dataUrl) {
        setFormImage(dataUrl);
      }

      // 2. Coba upload via endpoint /api/upload jika lingkungan mendukung penyimpanan disk
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: fd
        });
        const data = await res.json();
        if (data.success && data.url) {
          setFormImage(data.url);
        }
      } catch (uploadErr) {
        // Pada Vercel (read-only filesystem), dataUrl terkompresi langsung digunakan secara mulus
      }
    } catch (err) {
      console.warn('Upload API notice, using direct device image:', err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Open Add/Edit Modal (Mendukung pre-select kategori)
  const openMenuModal = (mode, menu = null, defaultCat = 'Bakso Spesial Kuah') => {
    if (mode === 'add') {
      setMenuModal({ open: true, mode: 'add', data: null });
      setFormName('');
      setFormCat(defaultCat);
      setFormPrice(32000);
      setFormStock(25);
      setFormDesc('');
      setFormPortion('1 Porsi + Kuah Segar');
      setFormImage(PRESET_IMAGES[0].url);
    } else {
      setMenuModal({ open: true, mode: 'edit', data: menu });
      setFormName(menu.name);
      setFormCat(menu.category_label || defaultCat);
      setFormPrice(menu.price);
      setFormStock(menu.stock);
      setFormDesc(menu.description || '');
      setFormPortion(menu.portion_info || '1 Porsi + Kuah Segar');
      setFormImage(menu.image || PRESET_IMAGES[0].url);
    }
  };

  // Submit Menu (POST or PUT)
  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    let catSlug = 'bakso-kuah';
    if (formCat.includes('Mie')) catSlug = 'mie-bihun';
    else if (formCat.includes('Pelengkap')) catSlug = 'pelengkap';
    else if (formCat.includes('Minuman')) catSlug = 'minuman';

    const finalImage = formImage || PRESET_IMAGES[0].url;
    const finalPortion = formPortion || '1 Porsi + Kuah Segar';

    if (menuModal.mode === 'add') {
      const res = await fetch('/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          category: catSlug,
          category_label: formCat,
          price: Number(formPrice),
          stock: Number(formStock),
          description: formDesc,
          portion_info: finalPortion,
          image: finalImage
        })
      });
      const json = await res.json();
      if (json.success) {
        alert(`Menu "${formName}" berhasil ditambahkan!`);
        // Simpan backup ke localStorage agar menu kustom tidak hilang saat Vercel serverless cold-start
        try {
          const localCustom = JSON.parse(localStorage.getItem('juragan_bakso_custom_menus') || '[]');
          const newMenuObj = json.data || {
            id: Date.now(),
            name: formName,
            category: catSlug,
            category_label: formCat,
            price: Number(formPrice),
            stock: Number(formStock),
            description: formDesc,
            portion_info: finalPortion,
            image: finalImage,
            is_available: Number(formStock) > 0,
            badge: Number(formStock) > 0 ? 'Tersedia' : 'Habis / Sold Out',
            badge_type: Number(formStock) > 0 ? 'tertiary' : 'error'
          };
          localStorage.setItem('juragan_bakso_custom_menus', JSON.stringify([newMenuObj, ...localCustom.filter(m => m.name !== formName)]));
        } catch (storageErr) {}
        loadDashboardData();
      }
    } else {
      const res = await fetch(`/api/menus/${menuModal.data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          category: catSlug,
          category_label: formCat,
          price: Number(formPrice),
          stock: Number(formStock),
          description: formDesc,
          portion_info: finalPortion,
          image: finalImage
        })
      });
      const json = await res.json();
      if (json.success) {
        alert(`Menu "${formName}" berhasil diperbarui!`);
        // Simpan pembaruan ke localStorage
        try {
          const localCustom = JSON.parse(localStorage.getItem('juragan_bakso_custom_menus') || '[]');
          const updatedLocal = localCustom.map(m => (m.id === menuModal.data.id || m.name === formName) ? {
            ...m,
            name: formName,
            category: catSlug,
            category_label: formCat,
            price: Number(formPrice),
            stock: Number(formStock),
            description: formDesc,
            portion_info: finalPortion,
            image: finalImage,
            is_available: Number(formStock) > 0,
            badge: Number(formStock) > 0 ? 'Tersedia' : 'Habis / Sold Out',
            badge_type: Number(formStock) > 0 ? 'tertiary' : 'error'
          } : m);
          localStorage.setItem('juragan_bakso_custom_menus', JSON.stringify(updatedLocal));
        } catch (storageErr) {}
        loadDashboardData();
      }
    }
    setMenuModal({ open: false, mode: 'add', data: null });
  };

  // Delete Menu (DELETE)
  const executeDelete = async () => {
    if (!deleteModal.id) return;
    try {
      const res = await fetch(`/api/menus/${deleteModal.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setMenus(menus.filter(m => m.id !== deleteModal.id));
        // Hapus juga dari localStorage
        try {
          const localCustom = JSON.parse(localStorage.getItem('juragan_bakso_custom_menus') || '[]');
          const filtered = localCustom.filter(m => m.id !== deleteModal.id && m.name !== deleteModal.name);
          localStorage.setItem('juragan_bakso_custom_menus', JSON.stringify(filtered));
        } catch (storageErr) {}
        alert('Menu berhasil dihapus dari sistem kasir.');
      }
    } catch (e) {}
    setDeleteModal({ open: false, id: null, name: '' });
  };

  const handleLogout = () => {
    if (confirm('Keluar dari sesi Administrator?')) {
      sessionStorage.removeItem('juragan_bakso_user');
      localStorage.removeItem('juragan_bakso_user');
      router.push('/admin/login?msg=logged_out');
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-6 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-base font-bold text-on-surface">Memverifikasi Hak Akses Staf...</h2>
        <p className="text-xs text-on-surface-variant max-w-sm mt-1">
          Dashboard POS Kasir &amp; KDS Dapur diproteksi. Mengarahkan ke form otentikasi...
        </p>
      </div>
    );
  }

  // Calculated Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const newOrdersCount = orders.filter(o => o.status === 'baru').length;
  const criticalMenusCount = menus.filter(m => Number(m.stock) <= 5).length;

  // Definisi Kategori Menu Kasir & Dapur
  const MENU_CATEGORIES = [
    { id: 'all', label: 'Semua Menu', icon: 'lunch_dining', desc: 'Seluruh katalog hidangan bakso, mie, pelengkap, & minuman' },
    { id: 'bakso-kuah', label: 'Bakso Spesial Kuah', icon: 'soup_kitchen', desc: 'Varian bakso kuah kaldu sapi asli & urat spesial' },
    { id: 'mie-bihun', label: 'Mie & Bihun Bakso', icon: 'ramen_dining', desc: 'Mie ayam, bihun, dan olahan mie gurih' },
    { id: 'pelengkap', label: 'Pelengkap & Gorengan', icon: 'bakery_dining', desc: 'Pangsit renyah, tetelan gurih, tahu bakso & ekstra topping' },
    { id: 'minuman', label: 'Minuman Segar Dingin', icon: 'local_drink', desc: 'Es teh jumbo, jeruk peras segar, & aneka minuman' }
  ];

  // Helper identifikasi slug kategori menu
  const getCategoryKey = (m) => {
    const cat = (m.category || '').toLowerCase();
    const label = (m.category_label || '').toLowerCase();
    if (cat === 'bakso-kuah') return 'bakso-kuah';
    if (cat === 'mie-bihun' || label.includes('mie') || label.includes('bihun')) return 'mie-bihun';
    if (cat === 'pelengkap' || label.includes('pelengkap') || label.includes('gorengan')) return 'pelengkap';
    if (cat === 'minuman' || label.includes('minum') || label.includes('teh') || label.includes('jeruk') || label.includes('dingin') || label.includes('es')) return 'minuman';
    if (label.includes('kuah') || label.includes('bakso')) return 'bakso-kuah';
    return 'bakso-kuah';
  };

  // Helper filter menu per kategori dan status pencarian/stok
  const getCategoryMenus = (catId) => {
    return menus.filter((menu) => {
      // 1. Kategori
      if (catId !== 'all' && getCategoryKey(menu) !== catId) {
        return false;
      }
      // 2. Filter Stok
      const stock = Number(menu.stock);
      if (menuStockFilter === 'critical' && (stock <= 0 || stock > 5)) return false;
      if (menuStockFilter === 'out_of_stock' && stock > 0) return false;
      if (menuStockFilter === 'available' && stock <= 5) return false;

      // 3. Pencarian
      if (menuSearchQuery.trim()) {
        const q = menuSearchQuery.toLowerCase();
        const nameMatch = (menu.name || '').toLowerCase().includes(q);
        const descMatch = (menu.description || '').toLowerCase().includes(q);
        const portionMatch = (menu.portion_info || '').toLowerCase().includes(q);
        const catMatch = (menu.category_label || '').toLowerCase().includes(q);
        if (!nameMatch && !descMatch && !portionMatch && !catMatch) return false;
      }
      return true;
    });
  };

  // Total menu yang lolos filter global
  const totalFilteredMenusCount = menus.filter((menu) => {
    if (menuCategoryFilter !== 'all' && getCategoryKey(menu) !== menuCategoryFilter) return false;
    const stock = Number(menu.stock);
    if (menuStockFilter === 'critical' && (stock <= 0 || stock > 5)) return false;
    if (menuStockFilter === 'out_of_stock' && stock > 0) return false;
    if (menuStockFilter === 'available' && stock <= 5) return false;
    if (menuSearchQuery.trim()) {
      const q = menuSearchQuery.toLowerCase();
      const nameMatch = (menu.name || '').toLowerCase().includes(q);
      const descMatch = (menu.description || '').toLowerCase().includes(q);
      const portionMatch = (menu.portion_info || '').toLowerCase().includes(q);
      const catMatch = (menu.category_label || '').toLowerCase().includes(q);
      if (!nameMatch && !descMatch && !portionMatch && !catMatch) return false;
    }
    return true;
  }).length;

  const filteredOrders = orderFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === orderFilter);

  // --- STATISTIK REKAP PENDAPATAN LENGKAP ---
  const validReportOrders = orders.filter(o => o.status !== 'batal');
  const completedReportOrders = orders.filter(o => o.status === 'selesai');
  const activeReportOrders = orders.filter(o => o.status === 'baru' || o.status === 'masak' || o.status === 'siap');
  const cancelledReportOrders = orders.filter(o => o.status === 'batal');

  // 1. Finansial Utama
  const reportTotalRevenue = validReportOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const reportCompletedRevenue = completedReportOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const reportAov = validReportOrders.length > 0 ? Math.round(reportTotalRevenue / validReportOrders.length) : 0;

  // 2. Total Porsi Makanan & Minuman Terjual
  const reportTotalPortions = validReportOrders.reduce((sum, o) => {
    return sum + (o.items || []).reduce((iSum, it) => iSum + (Number(it.qty) || 0), 0);
  }, 0);

  // 3. Breakdown Metode Pembayaran
  const qrisOrders = validReportOrders.filter(o => (o.payment_method || '').toLowerCase().includes('qris'));
  const qrisTotal = qrisOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const qrisPercent = reportTotalRevenue > 0 ? Math.round((qrisTotal / reportTotalRevenue) * 100) : 0;

  const cashOrders = validReportOrders.filter(o => !(o.payment_method || '').toLowerCase().includes('qris'));
  const cashTotal = cashOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const cashPercent = reportTotalRevenue > 0 ? Math.round((cashTotal / reportTotalRevenue) * 100) : 0;

  // 4. Breakdown Tipe Layanan (Dine-In vs Takeaway)
  const dineInOrders = validReportOrders.filter(o => o.order_type === 'dine_in' || (o.order_type_label || '').toLowerCase().includes('tempat'));
  const dineInTotal = dineInOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const dineInPercent = reportTotalRevenue > 0 ? Math.round((dineInTotal / reportTotalRevenue) * 100) : 0;

  const takeawayOrders = validReportOrders.filter(o => o.order_type === 'takeaway' || (o.order_type_label || '').toLowerCase().includes('bungkus'));
  const takeawayTotal = takeawayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const takeawayPercent = reportTotalRevenue > 0 ? Math.round((takeawayTotal / reportTotalRevenue) * 100) : 0;
  const takeawayFeeCollected = takeawayOrders.length * 2000;

  // 5. Leaderboard Menu Terlaris (Best Sellers)
  const itemMap = {};
  validReportOrders.forEach(o => {
    (o.items || []).forEach(it => {
      const name = it.name || 'Menu';
      if (!itemMap[name]) {
        itemMap[name] = {
          name,
          qty: 0,
          revenue: 0,
          image: menus.find(m => m.name === name)?.image || PRESET_IMAGES[0].url,
          category: menus.find(m => m.name === name)?.category_label || 'Bakso Spesial'
        };
      }
      const itQty = Number(it.qty) || 0;
      const itPrice = Number(it.price) || 0;
      itemMap[name].qty += itQty;
      itemMap[name].revenue += itQty * itPrice;
    });
  });
  const bestSellers = Object.values(itemMap).sort((a, b) => b.qty - a.qty);
  const maxBestSellerQty = bestSellers.length > 0 ? Math.max(...bestSellers.map(b => b.qty)) : 1;

  // 6. Rasio Sukses
  const completionRate = orders.length > 0 
    ? Math.round((completedReportOrders.length / orders.length) * 100) 
    : 100;

  // 7. Estimasi Waktu Jam Sibuk Dapur
  const timeSlotStats = {
    lunch: { label: 'Siang (10:00 - 14:00 WIB)', count: 0, total: 0, name: 'Makan Siang' },
    afternoon: { label: 'Sore (14:01 - 18:00 WIB)', count: 0, total: 0, name: 'Sore Santai' },
    dinner: { label: 'Malam (18:01 - 22:00 WIB)', count: 0, total: 0, name: 'Peak Dapur Malam' }
  };
  validReportOrders.forEach((o, idx) => {
    const ts = (o.timestamp || '').toLowerCase();
    let slot = 'lunch';
    if (ts.includes('14:') || ts.includes('15:') || ts.includes('16:') || ts.includes('17:')) {
      slot = 'afternoon';
    } else if (ts.includes('18:') || ts.includes('19:') || ts.includes('20:') || ts.includes('21:')) {
      slot = 'dinner';
    } else {
      const slotKeys = ['lunch', 'afternoon', 'dinner'];
      slot = slotKeys[idx % 3];
    }
    timeSlotStats[slot].count += 1;
    timeSlotStats[slot].total += Number(o.total) || 0;
  });

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      
      {/* MOBILE BACKDROP OVERLAY */}
      {mobileSidebar && (
        <div 
          onClick={() => setMobileSidebar(false)} 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* LEFT SIDEBAR (RESPONSIVE) */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-surface-container-low shadow-[0_1px_8px_rgba(41,37,36,0.06)] z-50 flex flex-col justify-between p-5 border-r border-outline-variant/30 transition-transform duration-200 ${
        mobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <img 
                alt="Logo Juragan Bakso" 
                className="h-8 w-8 object-contain rounded-lg p-0.5 bg-surface-container drop-shadow-xs" 
                src="/logo.png"
              />
              <div className="flex flex-col">
                <span className="font-headline-sm text-base font-bold text-primary tracking-tight leading-none">Juragan POS</span>
                <span className="text-[10px] text-on-surface-variant font-semibold">Kitchen &amp; POS Console</span>
              </div>
            </div>
            <button 
              onClick={() => setMobileSidebar(false)}
              className="lg:hidden p-1 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-outline">Operasional Meja</span>
            <nav className="flex flex-col gap-1.5">
              <button 
                onClick={() => { setAdminView('orders'); setMobileSidebar(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 transition-all text-xs rounded-xl ${
                  adminView === 'orders' 
                    ? 'bg-primary text-on-primary font-bold shadow-sm' 
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-semibold'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">table_restaurant</span>
                  <span>Pesanan Masuk</span>
                </div>
                {newOrdersCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    adminView === 'orders' ? 'bg-white text-primary' : 'bg-primary text-on-primary animate-pulse'
                  }`}>
                    {newOrdersCount}
                  </span>
                )}
              </button>

              <button 
                onClick={() => { setAdminView('inventory'); setMobileSidebar(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 transition-all text-xs rounded-xl ${
                  adminView === 'inventory' 
                    ? 'bg-primary text-on-primary font-bold shadow-sm' 
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-semibold'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">ramen_dining</span>
                  <span>Katalog &amp; Stok Porsi</span>
                </div>
                {criticalMenusCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    adminView === 'inventory' ? 'bg-white text-primary' : 'bg-secondary text-on-secondary'
                  }`}>
                    {criticalMenusCount}
                  </span>
                )}
              </button>

              <button 
                onClick={() => { setAdminView('reports'); setMobileSidebar(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 transition-all text-xs rounded-xl ${
                  adminView === 'reports' 
                    ? 'bg-primary text-on-primary font-bold shadow-sm' 
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-semibold'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">analytics</span>
                  <span>Rekap Pendapatan</span>
                </div>
                <span className={`text-[10px] font-bold ${adminView === 'reports' ? 'text-white' : 'text-tertiary'}`}>
                  Statistik
                </span>
              </button>
            </nav>
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/30 flex flex-col gap-2">
          <Link 
            onClick={() => setMobileSidebar(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all text-xs font-semibold" 
            href="/menu"
          >
            <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
            <span>Buka Katalog Menu</span>
          </Link>
          <Link 
            onClick={() => setMobileSidebar(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all text-xs font-semibold" 
            href="/"
          >
            <span className="material-symbols-outlined text-[18px]">storefront</span>
            <span>Kembali ke Beranda</span>
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-secondary hover:bg-error-container text-xs font-bold transition-all text-left">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Keluar (Logout)</span>
          </button>
          <div className="flex items-center gap-2 px-1 pt-1">
            <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            <span className="text-[10px] text-on-surface-variant">POS Terminal: Aktif (Kasir 01)</span>
          </div>
        </div>
      </aside>

      {/* MAIN BODY (RESPONSIVE PL-0 LG:PL-64) */}
      <div className="pl-0 lg:pl-64">
        {/* TOP BAR */}
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(41,37,36,0.04)] z-40 flex items-center justify-between px-4 sm:px-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileSidebar(true)} 
              className="lg:hidden p-1.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
              title="Buka menu navigasi"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <span className="text-xs md:text-sm font-bold text-on-surface">
              {adminView === 'orders' ? 'Antrean Pesanan Masuk (POS & KDS Dapur)' : adminView === 'inventory' ? 'Manajemen Katalog & Stok Porsi' : 'Laporan Rekap Pendapatan & Statistik Kasir'}
            </span>
            <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-surface-container-high text-tertiary text-[10px] font-bold">
              {adminView === 'orders' ? 'Mode Real-Time KDS' : adminView === 'inventory' ? 'Mode Katalog Produk' : 'Mode Audit Keuangan'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={loadDashboardData} className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">sync</span>
              <span className="hidden sm:inline">Sinkronisasi</span>
            </button>
            <div className="flex items-center gap-2.5 pl-2 border-l border-outline-variant/30">
              <img 
                alt="Admin Profile" 
                className="w-8 h-8 rounded-full object-cover border border-outline-variant/30" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_QHwoj-1XuUmGaPva3EoJu_HLwlhEuGYiYhHxgun0oAfbXaY4uZno8XvFscY2tYiaVojci3Et7h0iH6100EaU5JBa3oouVecRos3z15BzBg88RmwGu7osj5gMaCjcUzA9GizNhyoW7eFOXbwfaXwr66neww-ROCtofANJBnTcDsLvRzBS39IxEoNxwAc7j4Ay0FxDygu6JSKTzQ0pc6RTv2IQPHtxNvJabBZaFDY"
              />
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-on-surface leading-tight">Admin Kasir</span>
                <span className="text-[10px] text-on-surface-variant leading-none">Shift Pagi (ID: ADM-JKT-09)</span>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT (pt-24 md:pt-28 memastikan kotak Pusat Kendali tidak terpotong oleh fixed header) */}
        <main className="relative pt-24 md:pt-28 pb-12 px-4 sm:px-6 md:px-8 bg-surface min-h-screen">
          <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">

            {/* MODUL NAVIGASI TAMPILAN ADMIN (SWITCHER MODUL TUNGGAL) */}
            <div className="bg-surface-container-lowest p-2 rounded-2xl shadow-xs border border-outline-variant/30 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setAdminView('orders')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    adminView === 'orders'
                      ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/20'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">table_restaurant</span>
                  <span>Pesanan Masuk</span>
                  {newOrdersCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-error text-on-error text-[10px] font-extrabold animate-pulse">
                      {newOrdersCount} Baru
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAdminView('inventory')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    adminView === 'inventory'
                      ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/20'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">ramen_dining</span>
                  <span>Katalog &amp; Stok Porsi</span>
                  {criticalMenusCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-on-secondary text-[10px] font-extrabold">
                      {criticalMenusCount} Menipis
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAdminView('reports')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    adminView === 'reports'
                      ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/20'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">analytics</span>
                  <span>Rekap Pendapatan &amp; Statistik</span>
                </button>
              </div>

              {/* Status Warung & Tombol Sinkronisasi Cepat */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/30">
                  <span className={`text-[11px] font-bold ${storeOpen ? 'text-tertiary' : 'text-outline'}`}>
                    {storeOpen ? 'Warung Buka' : 'Warung Tutup'}
                  </span>
                  <button 
                    onClick={toggleStoreStatus}
                    className={`w-9 h-5 rounded-full relative p-0.5 transition-colors focus:outline-none ${storeOpen ? 'bg-tertiary-container' : 'bg-surface-dim'}`}
                    type="button"
                    title={storeOpen ? 'Klik untuk jeda operasional' : 'Klik untuk buka warung'}
                  >
                    <span className={`w-4 h-4 rounded-full bg-on-tertiary block shadow-sm transform transition-transform ${storeOpen ? 'translate-x-4' : 'translate-x-0'}`}></span>
                  </button>
                </div>
                <button 
                  onClick={loadDashboardData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-all shadow-xs border border-outline-variant/30"
                  title="Sinkronisasi data real-time"
                >
                  <span className="material-symbols-outlined text-[17px]">sync</span>
                  <span className="hidden sm:inline">Sinkronisasi</span>
                </button>
              </div>
            </div>

            {/* MODUL 1: PESANAN MASUK (HANYA MENAMPILKAN TABEL PESANAN MASUK) */}
            {adminView === 'orders' && (
              <div className="flex flex-col gap-6">
                {/* Top Administrative Status Bar */}
                <div className="bg-surface-container-low rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md shrink-0">
                      <span className="material-symbols-outlined text-[28px]">shield_person</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-headline-sm text-lg font-bold text-on-surface">Pusat Kendali Juragan Bakso</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                          Mode Administrator Resmi • Terhubung Real-Time
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-tertiary">lock</span>
                        Sesi terenkripsi • Hanya dapat diakses oleh akun Admin terverifikasi (ID: ADM-JKT-09)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <span>Total Antrean: <strong>{orders.length} Tiket</strong></span>
                    <span>•</span>
                    <span className="text-primary font-bold">{newOrdersCount} Perlu Respon</span>
                  </div>
                </div>

                {/* WIDGET SCANNER BARCODE KASIR (VALIDASI BAYAR TUNAI) */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-amber-950">Pemindai Barcode Kasir &amp; Validasi Tunai</h4>
                      <p className="text-[11px] text-amber-900 leading-tight">
                        Scan barcode pelanggan yang datang ke meja kasir atau ketik kode tiket untuk memvalidasi pembayaran tunai.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleScanInputSubmit} className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amber-800 text-[18px]">barcode</span>
                      <input 
                        type="text" 
                        value={cashScanCode}
                        onChange={(e) => setCashScanCode(e.target.value)}
                        placeholder="Scan / ketik ID tiket (mis: BKS-097)"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-mono font-bold text-black outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors whitespace-nowrap active:scale-95 flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Validasi Tunai</span>
                    </button>
                  </form>
                </div>

                {/* Banner Notifikasi Hasil Scan */}
                {cashScanResult.show && (
                  <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 transition-all ${
                    cashScanResult.success 
                      ? 'bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold' 
                      : 'bg-error-container border border-error/30 text-error font-semibold'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">
                        {cashScanResult.success ? 'task_alt' : 'error'}
                      </span>
                      <span>{cashScanResult.message}</span>
                    </div>
                    <button 
                      onClick={() => setCashScanResult({ show: false, success: false, message: '' })}
                      className="hover:opacity-75"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                )}

                {/* SECTION 1: ANTREAN PESANAN REALTIME (KDS) */}
                <section className="flex flex-col gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30" id="orders-section">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-surface-container">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
                    <span className="font-headline-md text-lg font-bold text-on-surface">Antrean Pesanan Masuk (Realtime Sync)</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Pesanan tersinkronisasi otomatis dari etalase pelanggan dan langsung masuk ke antrean dapur.</p>
                </div>

                {/* Filter Tab Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {[
                    { id: 'all', label: `Semua (${orders.length})` },
                    { id: 'baru', label: `Baru Masuk (${orders.filter(o => o.status === 'baru').length})` },
                    { id: 'masak', label: `Dimasak Dapur (${orders.filter(o => o.status === 'masak').length})` },
                    { id: 'siap', label: `Siap Saji (${orders.filter(o => o.status === 'siap').length})` },
                    { id: 'selesai', label: `Selesai (${orders.filter(o => o.status === 'selesai').length})` },
                    { id: 'batal', label: `Dibatalkan (${orders.filter(o => o.status === 'batal').length})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setOrderFilter(tab.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${orderFilter === tab.id ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-high text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 rounded-l-lg">ID &amp; Waktu</th>
                      <th className="py-3 px-4">Pemesan &amp; Tipe Layanan</th>
                      <th className="py-3 px-4">Item Pesanan</th>
                      <th className="py-3 px-4">Catatan Dapur</th>
                      <th className="py-3 px-4">Total &amp; Metode Bayar</th>
                      <th className="py-3 px-4">Status Pesanan</th>
                      <th className="py-3 px-4 rounded-r-lg text-right">Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-on-surface-variant">Tidak ada tiket pesanan pada kategori filter ini.</td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => {
                        const isCashWaiting = order.payment_method?.includes('Tunai') && !order.payment_method?.includes('Lunas');
                        return (
                          <tr key={order.id} className="hover:bg-surface-container-low transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-primary font-mono">{order.id}</span>
                                <span className="text-[11px] text-on-surface-variant">{order.timestamp || 'Hari ini'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-on-surface">{order.customer_name}</span>
                                <span className="text-[10px] text-on-surface-variant">{order.order_type_label} • {order.order_detail_meta}</span>
                                <span className="text-[10px] text-outline font-mono">{order.customer_phone}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <ul className="list-disc pl-4 space-y-0.5 text-on-surface text-[11px]">
                                {(order.items || []).map((it, idx) => (
                                  <li key={idx}><strong>{it.qty}x</strong> {it.name}</li>
                                ))}
                              </ul>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block p-1.5 rounded-lg bg-surface-container text-secondary text-[10px] font-semibold max-w-[160px]">
                                "{order.notes || '-'}"
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-on-surface block">{formatIDR(order.total)}</span>
                              <div className="flex flex-col gap-1 mt-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit flex items-center gap-1 ${
                                  isCashWaiting 
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                                    : order.payment_method?.includes('QRIS')
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-surface-container text-on-surface'
                                }`}>
                                  <span>{order.payment_method}</span>
                                  {order.payment_method?.includes('QRIS') && (
                                    <button
                                      onClick={() => setQrisModalOpen(true)}
                                      className="text-primary hover:underline text-[9px] font-bold ml-0.5"
                                      title="Lihat Barcode QRIS"
                                    >
                                      [QR]
                                    </button>
                                  )}
                                </span>
                                {isCashWaiting && (
                                  <button
                                    onClick={() => handleValidateCash(order.id)}
                                    className="text-[10px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 underline"
                                    title="Klik untuk memvalidasi pembayaran tunai lunas"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">check</span>
                                    <span>Validasi Tunai Sekarang</span>
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <select 
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border-0 focus:ring-2 focus:ring-primary cursor-pointer transition-colors ${
                                  order.status === 'baru' 
                                    ? 'bg-primary-fixed text-on-primary-fixed animate-pulse' 
                                    : order.status === 'masak'
                                    ? 'bg-amber-100 text-amber-900'
                                    : order.status === 'siap' 
                                    ? 'bg-tertiary-container text-on-tertiary font-extrabold' 
                                    : order.status === 'batal'
                                    ? 'bg-error-container text-error font-extrabold'
                                    : 'bg-surface-container text-on-surface'
                                }`}
                              >
                                <option value="baru">⚡ Baru Masuk</option>
                                <option value="masak">🍳 Sedang Dimasak</option>
                                <option value="siap">📦 Siap Saji / Diambil</option>
                                <option value="selesai">✅ Selesai</option>
                                <option value="batal">❌ Dibatalkan</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Tombol Notifikasi WhatsApp ke Pemesan */}
                                <button 
                                  onClick={() => openWaModal(order)}
                                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs flex items-center justify-center" 
                                  title="Kirim Pesan &amp; Update WhatsApp ke Pemesan"
                                >
                                  <span className="material-symbols-outlined text-[16px]">chat</span>
                                </button>

                                {/* Tombol Validasi Tunai Cepat */}
                                {isCashWaiting && (
                                  <button
                                    onClick={() => handleValidateCash(order.id)}
                                    className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-xs flex items-center justify-center"
                                    title="Validasi Barcode Tiket &amp; Terima Tunai Kasir"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                                  </button>
                                )}

                                {/* Tombol Cetak Struk Dapur POS */}
                                <button 
                                  onClick={() => setSlipModal({ open: true, order })}
                                  className="p-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors" 
                                  title="Cetak Tiket Struk Dapur POS"
                                >
                                  <span className="material-symbols-outlined text-[16px]">print</span>
                                </button>

                                {order.status !== 'selesai' && order.status !== 'batal' && (
                                  <>
                                    <button 
                                      onClick={() => handleStatusChange(order.id, 'selesai')}
                                      className="p-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors" 
                                      title="Tandai Selesai"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if (confirm(`Batalkan pesanan ${order.id}?`)) {
                                          handleStatusChange(order.id, 'batal');
                                        }
                                      }}
                                      className="p-1.5 rounded-lg bg-error-container/40 text-error hover:bg-error-container transition-colors" 
                                      title="Batalkan Pesanan"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* MODUL 2: KATALOG & STOK PORSI (HANYA MENAMPILKAN KATALOG MENU) */}
        {adminView === 'inventory' && (
          <section className="flex flex-col gap-5 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30" id="inventory-section">
              {/* Header Bagian Menu */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-container">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[24px]">ramen_dining</span>
                    <span className="font-headline-md text-lg font-bold text-on-surface">Manajemen Menu &amp; Stok Porsi (Kategori Terpisah)</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Katalog menu dipisah per kategori (Bakso Kuah, Mie &amp; Bihun, Pelengkap, Minuman) agar lebih tertata rapi dan mudah dikelola.
                  </p>
                </div>

                <button 
                  onClick={() => openMenuModal('add', null, menuCategoryFilter !== 'all' ? (MENU_CATEGORIES.find(c => c.id === menuCategoryFilter)?.label || 'Bakso Spesial Kuah') : 'Bakso Spesial Kuah')}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all shadow-md active:scale-95 shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>+ Tambah Menu Baru</span>
                </button>
              </div>

              {/* 1. TAB FILTER KATEGORI MENU (PILLS) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                {MENU_CATEGORIES.map(cat => {
                  const count = cat.id === 'all' 
                    ? menus.length 
                    : menus.filter(m => getCategoryKey(m) === cat.id).length;
                  const isSelected = menuCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setMenuCategoryFilter(cat.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shadow-xs ${
                        isSelected 
                          ? 'bg-primary text-on-primary ring-2 ring-primary/30 shadow-sm' 
                          : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[17px]">{cat.icon}</span>
                      <span>{cat.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isSelected ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 2. TOOLBAR PENCARIAN & STATUS STOK */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
                {/* Kolom Pencarian */}
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                  <input 
                    type="text"
                    value={menuSearchQuery}
                    onChange={(e) => setMenuSearchQuery(e.target.value)}
                    placeholder="Cari nama menu, deskripsi, atau keterangan paket porsi..."
                    className="w-full pl-9 pr-8 py-2 rounded-lg bg-surface text-on-surface border border-outline-variant/40 text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                  {menuSearchQuery && (
                    <button 
                      onClick={() => setMenuSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                      title="Hapus pencarian"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                {/* Filter Cepat Stok */}
                <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 text-xs">
                  <span className="text-[11px] text-on-surface-variant font-semibold mr-1 hidden sm:inline">Filter Stok:</span>
                  {[
                    { id: 'all', label: `Semua (${menus.length})` },
                    { id: 'critical', label: `⚠️ Menipis (${menus.filter(m => Number(m.stock) > 0 && Number(m.stock) <= 5).length})` },
                    { id: 'out_of_stock', label: `❌ Habis (${menus.filter(m => Number(m.stock) <= 0).length})` },
                    { id: 'available', label: `✅ Tersedia (${menus.filter(m => Number(m.stock) > 5).length})` }
                  ].map(sf => (
                    <button
                      key={sf.id}
                      onClick={() => setMenuStockFilter(sf.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        menuStockFilter === sf.id 
                          ? 'bg-secondary text-on-secondary font-bold shadow-xs' 
                          : 'bg-surface text-on-surface-variant hover:bg-surface-container border border-outline-variant/30'
                      }`}
                    >
                      {sf.label}
                    </button>
                  ))}
                  {(menuSearchQuery || menuStockFilter !== 'all' || menuCategoryFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setMenuSearchQuery('');
                        setMenuStockFilter('all');
                        setMenuCategoryFilter('all');
                      }}
                      className="text-[11px] text-primary hover:underline font-bold px-2 py-1 ml-1"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              </div>

              {/* 3. TAMPILAN MENU TERPISAH PER KELOMPOK KATEGORI */}
              {totalFilteredMenusCount === 0 ? (
                <div className="py-12 px-4 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/40 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-outline">
                    <span className="material-symbols-outlined text-[28px]">search_off</span>
                  </div>
                  <h4 className="font-bold text-on-surface text-sm">Tidak ada menu yang sesuai</h4>
                  <p className="text-xs text-on-surface-variant max-w-sm">
                    {menuSearchQuery ? `Tidak ditemukan menu yang cocok dengan kata kunci "${menuSearchQuery}".` : 'Tidak ada menu dengan kriteria filter stok yang dipilih.'}
                  </p>
                  <button 
                    onClick={() => {
                      setMenuSearchQuery('');
                      setMenuStockFilter('all');
                      setMenuCategoryFilter('all');
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary-container transition-all"
                  >
                    Tampilkan Semua Menu
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {(menuCategoryFilter === 'all' 
                    ? MENU_CATEGORIES.filter(c => c.id !== 'all') 
                    : MENU_CATEGORIES.filter(c => c.id === menuCategoryFilter)
                  ).map(cat => {
                    const categoryItems = getCategoryMenus(cat.id);
                    const allCatMenus = menus.filter(m => getCategoryKey(m) === cat.id);
                    const totalCatStock = allCatMenus.reduce((sum, it) => sum + (Number(it.stock) || 0), 0);
                    const catCriticalCount = allCatMenus.filter(it => Number(it.stock) > 0 && Number(it.stock) <= 5).length;
                    const catOutOfStockCount = allCatMenus.filter(it => Number(it.stock) <= 0).length;

                    // Jika tab "Semua Menu" aktif tapi kategori ini tidak punya item yang cocok filter, sembunyikan
                    if (menuCategoryFilter === 'all' && categoryItems.length === 0) {
                      return null;
                    }

                    return (
                      <div 
                        key={cat.id} 
                        className="flex flex-col gap-3 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 p-4 sm:p-5 shadow-xs transition-all hover:border-outline-variant/60"
                      >
                        {/* Header Box Kategori Terpisah */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0 shadow-xs">
                              <span className="material-symbols-outlined text-[22px]">{cat.icon}</span>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-headline-sm text-base font-bold text-on-surface">{cat.label}</h3>
                                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[10px] font-bold">
                                  {allCatMenus.length} Varian Menu
                                </span>
                                {catCriticalCount > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold animate-pulse">
                                    ⚠️ {catCriticalCount} Menipis
                                  </span>
                                )}
                                {catOutOfStockCount > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[10px] font-bold">
                                    ❌ {catOutOfStockCount} Habis
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-on-surface-variant">
                                {cat.desc} • <strong>{totalCatStock} Porsi</strong> Total Siap Jual
                              </p>
                            </div>
                          </div>

                          {/* Tombol Tambah Menu Spesifik Kategori Ini */}
                          <button
                            onClick={() => openMenuModal('add', null, cat.label)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface text-xs font-bold transition-all border border-outline-variant/30 shadow-xs active:scale-95 shrink-0 self-start sm:self-auto"
                            title={`Tambah menu ke kategori ${cat.label}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">add_circle</span>
                            <span>+ Tambah di {cat.label.split(' ')[0]}</span>
                          </button>
                        </div>

                        {/* Tabel Khusus Kategori Ini */}
                        {categoryItems.length === 0 ? (
                          <div className="py-6 text-center text-on-surface-variant text-xs flex flex-col items-center gap-1.5">
                            <span className="material-symbols-outlined text-[26px] text-outline">ramen_dining</span>
                            <p>Tidak ada menu di kategori {cat.label} yang cocok dengan pencarian.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-surface-container-high text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">
                                  <th className="py-2.5 px-3.5 rounded-l-lg">Produk &amp; Gambar</th>
                                  <th className="py-2.5 px-3.5">Kategori</th>
                                  <th className="py-2.5 px-3.5">Harga Jual</th>
                                  <th className="py-2.5 px-3.5">Sisa Porsi</th>
                                  <th className="py-2.5 px-3.5">Status Menu</th>
                                  <th className="py-2.5 px-3.5 rounded-r-lg text-right">Kelola / Tindakan Cepat</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-surface-container">
                                {categoryItems.map((menu) => {
                                  const isOutOfStock = Number(menu.stock) <= 0;
                                  const isCritical = Number(menu.stock) > 0 && Number(menu.stock) <= 5;
                                  return (
                                    <tr key={menu.id} className="hover:bg-surface-container-high/40 transition-colors">
                                      <td className="py-3 px-3.5">
                                        <div className="flex items-center gap-3">
                                          <img 
                                            className="w-12 h-12 rounded-xl object-cover bg-surface-container border border-outline-variant/30 shrink-0 shadow-xs" 
                                            src={menu.image} 
                                            alt={menu.name}
                                            onError={(e) => {
                                              e.currentTarget.src = PRESET_IMAGES[0].url;
                                            }}
                                          />
                                          <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-on-surface text-xs sm:text-sm">{menu.name}</span>
                                            <span className="text-[11px] text-on-surface-variant line-clamp-1">{menu.description}</span>
                                            <span className="text-[10px] text-tertiary flex items-center gap-1 mt-0.5 font-medium">
                                              <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                              <span>{menu.portion_info || '1 Porsi + Kuah Segar'}</span>
                                            </span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3 px-3.5 whitespace-nowrap">
                                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[10px] font-semibold border border-outline-variant/20">
                                          {menu.category_label || menu.category}
                                        </span>
                                      </td>
                                      <td className="py-3 px-3.5 font-bold text-on-surface whitespace-nowrap">
                                        {formatIDR(menu.price)}
                                      </td>
                                      <td className="py-3 px-3.5 whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                          <span className={`text-base font-bold ${isOutOfStock ? 'text-secondary' : 'text-on-surface'}`}>{menu.stock}</span>
                                          <span className="text-outline text-[11px]">porsi</span>
                                        </div>
                                      </td>
                                      <td className="py-3 px-3.5 whitespace-nowrap">
                                        {isOutOfStock ? (
                                          <span className="px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container text-[10px] font-bold">Sold Out</span>
                                        ) : isCritical ? (
                                          <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-[10px] animate-pulse">Menipis ({menu.stock})</span>
                                        ) : (
                                          <span className="px-2.5 py-0.5 rounded-full bg-tertiary/15 text-tertiary text-[10px] font-bold">Tersedia</span>
                                        )}
                                      </td>
                                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <button 
                                            onClick={() => quickStockChange(menu, isOutOfStock ? 10 : 1)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 ${
                                              isOutOfStock ? 'bg-tertiary text-on-tertiary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                                            }`}
                                            title={isOutOfStock ? 'Restock 10 porsi' : 'Tambah 1 porsi'}
                                          >
                                            {isOutOfStock ? 'Restock +10' : '+1 Porsi'}
                                          </button>
                                          <button 
                                            onClick={() => openMenuModal('edit', menu)}
                                            className="p-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors" 
                                            title="Edit Detail Menu"
                                          >
                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                          </button>
                                          <button 
                                            onClick={() => setDeleteModal({ open: true, id: menu.id, name: menu.name })}
                                            className="p-1.5 rounded-lg bg-surface-container text-secondary hover:bg-error-container transition-colors" 
                                            title="Hapus Menu"
                                          >
                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* MODUL 3: REKAP PENDAPATAN & STATISTIK DATA LENGKAP */}
          {adminView === 'reports' && (
            <section className="flex flex-col gap-6" id="reports-section">
              {/* Header Laporan Rekap */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md shrink-0">
                    <span className="material-symbols-outlined text-[26px]">analytics</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-headline-md text-lg font-bold text-on-surface">Rekap Pendapatan &amp; Statistik Penjualan Kasir</h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-bold">
                        Audit Keuangan Resmi
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      Laporan lengkap omset kasir, volume porsi makanan terjual, perbandingan QRIS vs Tunai, dan produk best seller.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all border border-outline-variant/30 shadow-xs"
                    title="Cetak Laporan Keuangan"
                  >
                    <span className="material-symbols-outlined text-[18px]">print</span>
                    <span>Cetak Laporan</span>
                  </button>
                  <button
                    onClick={loadDashboardData}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all shadow-md active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">sync</span>
                    <span>Segarkan Data</span>
                  </button>
                </div>
              </div>

              {/* 4 Kartu KPI Finansial Utama */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* 1. Total Omset Bersih */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Total Omset Penjualan</span>
                      <span className="font-headline-lg text-2xl font-bold text-on-surface mt-1">{formatIDR(reportTotalRevenue)}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]">payments</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-container text-xs">
                    <span className="text-tertiary font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">verified</span> {validReportOrders.length} Transaksi Valid
                    </span>
                    <span className="text-on-surface-variant font-medium">Realisasi Kasir</span>
                  </div>
                </div>

                {/* 2. Average Order Value (AOV) */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Rata-Rata Belanja (AOV)</span>
                      <span className="font-headline-lg text-2xl font-bold text-on-surface mt-1">{formatIDR(reportAov)}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-surface-container text-on-surface flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-container text-xs">
                    <span className="text-on-surface-variant">Rata-rata per tiket transaksi</span>
                    <span className="text-primary font-bold">Optimal</span>
                  </div>
                </div>

                {/* 3. Total Porsi Terjual */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Total Porsi Terjual</span>
                      <span className="font-headline-lg text-2xl font-bold text-on-surface mt-1">{reportTotalPortions} <span className="text-sm font-normal text-on-surface-variant">Porsi</span></span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]">soup_kitchen</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-container text-xs">
                    <span className="text-on-surface-variant">Bakso, Mie, Pelengkap, Minum</span>
                    <span className="text-amber-800 font-bold">Produksi Dapur</span>
                  </div>
                </div>

                {/* 4. Rasio Penyelesaian Tiket */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Rasio Sukses Pesanan</span>
                      <span className="font-headline-lg text-2xl font-bold text-on-surface mt-1">{completionRate}%</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-tertiary/15 text-tertiary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]">check_circle</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-container text-xs">
                    <span className="text-tertiary font-semibold">{completedReportOrders.length} Selesai</span>
                    <span className="text-on-surface-variant">{cancelledReportOrders.length} Batal</span>
                  </div>
                </div>
              </div>

              {/* Analisis Pembayaran & Layanan (2 Kolom) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Box A: Distribusi Metode Pembayaran */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[22px]">account_balance_wallet</span>
                      <h3 className="font-bold text-sm text-on-surface">Breakdown Metode Pembayaran</h3>
                    </div>
                    <span className="text-[11px] text-on-surface-variant font-medium">Cashless vs Tunai</span>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* QRIS */}
                    <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-primary"></span>
                          <span className="text-xs font-bold text-on-surface">QRIS Instan (AJI STORE)</span>
                        </div>
                        <span className="text-xs font-extrabold text-primary">{formatIDR(qrisTotal)} ({qrisPercent}%)</span>
                      </div>
                      {/* Visual Bar */}
                      <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${qrisPercent}%` }}></div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1">
                        <span>{qrisOrders.length} Tiket Pembayaran QRIS</span>
                        <span className="font-mono text-[10px]">NMID: ID1026632017442</span>
                      </div>
                    </div>

                    {/* Kasir / Tunai */}
                    <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-amber-600"></span>
                          <span className="text-xs font-bold text-on-surface">Kasir / Tunai (Bayar di Meja)</span>
                        </div>
                        <span className="text-xs font-extrabold text-amber-800">{formatIDR(cashTotal)} ({cashPercent}%)</span>
                      </div>
                      {/* Visual Bar */}
                      <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                        <div className="bg-amber-600 h-full rounded-full transition-all duration-500" style={{ width: `${cashPercent}%` }}></div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1">
                        <span>{cashOrders.length} Tiket Pembayaran Tunai</span>
                        <span>Uang Fisik Kasir</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Box B: Distribusi Tipe Layanan & Kemasan */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary text-[22px]">delivery_dining</span>
                      <h3 className="font-bold text-sm text-on-surface">Breakdown Tipe Layanan</h3>
                    </div>
                    <span className="text-[11px] text-on-surface-variant font-medium">Dine-In vs Takeaway</span>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Makan di Tempat */}
                    <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-tertiary"></span>
                          <span className="text-xs font-bold text-on-surface">Makan di Tempat (Dine-In)</span>
                        </div>
                        <span className="text-xs font-extrabold text-tertiary">{formatIDR(dineInTotal)} ({dineInPercent}%)</span>
                      </div>
                      {/* Visual Bar */}
                      <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                        <div className="bg-tertiary h-full rounded-full transition-all duration-500" style={{ width: `${dineInPercent}%` }}></div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1">
                        <span>{dineInOrders.length} Pesanan Dine-In</span>
                        <span>Layanan Meja &amp; Mangkok</span>
                      </div>
                    </div>

                    {/* Bungkus / Takeaway */}
                    <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-secondary"></span>
                          <span className="text-xs font-bold text-on-surface">Bungkus Bawa Pulang (Takeaway)</span>
                        </div>
                        <span className="text-xs font-extrabold text-secondary">{formatIDR(takeawayTotal)} ({takeawayPercent}%)</span>
                      </div>
                      {/* Visual Bar */}
                      <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${takeawayPercent}%` }}></div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1">
                        <span>{takeawayOrders.length} Pesanan Takeaway</span>
                        <span>Biaya Kemasan Terkumpul: {formatIDR(takeawayFeeCollected)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leaderboard Menu Terlaris (Best Seller) */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-[22px]">military_tech</span>
                    <h3 className="font-bold text-sm text-on-surface">Leaderboard Menu Terlaris (Best Sellers)</h3>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">Diurutkan berdasarkan porsi terjual</span>
                </div>

                {bestSellers.length === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant text-xs">
                    Belum ada transaksi porsi menu yang tercatat.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-surface-container-high text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3 rounded-l-lg text-center w-12">Rank</th>
                          <th className="py-2.5 px-4">Menu Kuliner</th>
                          <th className="py-2.5 px-4">Kategori</th>
                          <th className="py-2.5 px-4 text-center">Porsi Terjual</th>
                          <th className="py-2.5 px-4">Kontribusi Omset</th>
                          <th className="py-2.5 px-4 rounded-r-lg">Popularitas Porsi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container">
                        {bestSellers.slice(0, 8).map((item, idx) => {
                          const percent = Math.round((item.qty / maxBestSellerQty) * 100);
                          return (
                            <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                              <td className="py-3 px-3 text-center">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${
                                  idx === 0 ? 'bg-amber-400 text-amber-950 shadow-xs' :
                                  idx === 1 ? 'bg-slate-300 text-slate-900 shadow-xs' :
                                  idx === 2 ? 'bg-amber-700/30 text-amber-950 shadow-xs' :
                                  'bg-surface-container text-on-surface-variant'
                                }`}>
                                  #{idx + 1}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={item.image} 
                                    alt={item.name} 
                                    className="w-10 h-10 rounded-lg object-cover bg-surface-container shrink-0 border border-outline-variant/30"
                                    onError={(e) => {
                                      e.currentTarget.src = PRESET_IMAGES[0].url;
                                    }}
                                  />
                                  <span className="font-bold text-on-surface">{item.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[10px] font-semibold">
                                  {item.category}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-on-surface text-sm">
                                {item.qty} <span className="text-xs font-normal text-outline">porsi</span>
                              </td>
                              <td className="py-3 px-4 font-bold text-primary">
                                {formatIDR(item.revenue)}
                              </td>
                              <td className="py-3 px-4 w-44">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-surface-container h-2 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }}></div>
                                  </div>
                                  <span className="text-[10px] text-outline font-mono w-8 text-right">{percent}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Distribusi Jam Sibuk Dapur */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[22px]">schedule</span>
                    <h3 className="font-bold text-sm text-on-surface">Distribusi Waktu Jam Sibuk Dapur (Peak Hours)</h3>
                  </div>
                  <span className="text-[11px] text-on-surface-variant font-medium">Berdasarkan data tiket pesanan</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.values(timeSlotStats).map((slot, sIdx) => (
                    <div key={sIdx} className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-on-surface">{slot.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-outline text-[10px] font-semibold">
                          {slot.count} Tiket
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-primary">{formatIDR(slot.total)}</span>
                        <span className="text-[10px] text-on-surface-variant">{slot.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabel Audit Riwayat Pesanan Lengkap */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">receipt_long</span>
                    <h3 className="font-bold text-sm text-on-surface">Audit Transaksi Finansial Kasir</h3>
                  </div>
                  <span className="text-xs text-on-surface-variant">Menampilkan {orders.length} transaksi</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-container-high text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-4 rounded-l-lg">ID &amp; Waktu</th>
                        <th className="py-2.5 px-4">Pemesan &amp; Meja</th>
                        <th className="py-2.5 px-4">Item Menu Dipesan</th>
                        <th className="py-2.5 px-4">Metode Bayar</th>
                        <th className="py-2.5 px-4">Total Bayar</th>
                        <th className="py-2.5 px-4 rounded-r-lg text-right">Status Transaksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-primary">{o.id}</span>
                              <span className="text-[10px] text-on-surface-variant">{o.timestamp || 'Hari ini'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-on-surface">{o.customer_name}</span>
                              <span className="text-[10px] text-on-surface-variant">{o.order_type_label} • {o.order_detail_meta}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <ul className="list-disc pl-3 text-[11px] text-on-surface space-y-0.5">
                              {(o.items || []).map((it, iIdx) => (
                                <li key={iIdx}><strong>{it.qty}x</strong> {it.name}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface text-[10px] font-semibold">
                              {o.payment_method}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-on-surface">
                            {formatIDR(o.total)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              o.status === 'selesai' ? 'bg-tertiary-container text-on-tertiary' :
                              o.status === 'baru' ? 'bg-primary-fixed text-on-primary-fixed' :
                              o.status === 'batal' ? 'bg-error-container text-on-error-container' :
                              'bg-amber-100 text-amber-900'
                            }`}>
                              {o.status === 'selesai' ? '✅ Selesai' :
                               o.status === 'baru' ? '⚡ Baru Masuk' :
                               o.status === 'masak' ? '🍳 Dimasak' :
                               o.status === 'siap' ? '📦 Siap Saji' : '❌ Dibatalkan'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          </div>
        </main>
      </div>

      {/* MODAL ADD / EDIT MENU */}
      {menuModal.open && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-outline-variant/30">
            <div className="p-4 bg-surface-container-high flex items-center justify-between border-b border-surface-container">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
                </div>
                <span className="font-headline-sm text-sm font-bold text-on-surface">
                  {menuModal.mode === 'add' ? 'Tambah Menu Kuliner Baru' : `Ubah Menu #${menuModal.data?.id}`}
                </span>
              </div>
              <button 
                onClick={() => setMenuModal({ open: false, mode: 'add', data: null })}
                className="w-8 h-8 rounded-full bg-surface-container text-on-surface hover:bg-surface-dim flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleMenuSubmit} className="p-5 flex flex-col gap-3 overflow-y-auto">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Nama Menu</label>
                <input 
                  type="text" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/40 text-xs focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Contoh: Bakso Mercon Lava Telur Asin"
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Kategori</label>
                  <select 
                    value={formCat}
                    onChange={(e) => setFormCat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/40 text-xs focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="Bakso Spesial Kuah">Bakso Spesial Kuah</option>
                    <option value="Mie & Bihun Bakso">Mie &amp; Bihun Bakso</option>
                    <option value="Pelengkap & Gorengan">Pelengkap &amp; Gorengan</option>
                    <option value="Minuman Segar Dingin">Minuman Segar Dingin</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Harga Jual (Rp)</label>
                  <input 
                    type="number" 
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/40 text-xs focus:ring-1 focus:ring-primary outline-none"
                    required 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Stok Porsi</label>
                <input 
                  type="number" 
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/40 text-xs focus:ring-1 focus:ring-primary outline-none"
                  required 
                />
              </div>

              {/* INPUT GAMBAR / FOTO MENU (FITUR ADMIN) */}
              <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">add_photo_alternate</span>
                    <span>Foto / Gambar Menu</span>
                  </label>
                  {formImage && (
                    <button
                      type="button"
                      onClick={() => setFormImage('')}
                      className="text-[11px] text-error font-semibold hover:underline flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[13px]">delete</span>
                      <span>Hapus Gambar</span>
                    </button>
                  )}
                </div>

                {/* Preview Gambar & Upload Control */}
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-xl bg-surface-container-high border border-outline-variant/40 overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                    {formImage ? (
                      <img 
                        src={formImage} 
                        alt="Preview Foto Menu" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = PRESET_IMAGES[0].url;
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center text-on-surface-variant/40">
                        <span className="material-symbols-outlined text-[28px]">broken_image</span>
                        <span className="text-[9px]">Belum ada</span>
                      </div>
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {/* Tombol Unggah File Langsung dari Device (HP/Laptop) */}
                    <label className={`cursor-pointer px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all shadow-sm ${
                      uploadingImage 
                        ? 'bg-surface-container-high text-on-surface-variant/50 border-outline-variant/30 cursor-not-allowed'
                        : 'bg-primary text-on-primary border-primary hover:bg-primary-container shadow-xs active:scale-95'
                    }`}>
                      <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                      <span>{uploadingImage ? 'Sedang Memproses Foto...' : 'Pilih Foto dari HP / Laptop'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        disabled={uploadingImage} 
                      />
                    </label>

                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
                      <span>✓ Langsung dari galeri/kamera HP &amp; laptop</span>
                      {formImage && formImage.startsWith('data:image') && (
                        <span className="text-tertiary font-bold">Tersimpan dari Device</span>
                      )}
                    </div>

                    {/* Input URL Gambar Manual (Opsional, Tersembunyi Rapi) */}
                    <details className="group text-[10px] text-on-surface-variant/80">
                      <summary className="cursor-pointer hover:text-primary transition-colors select-none font-medium">
                        Atau tempel link URL foto luar (opsional)
                      </summary>
                      <div className="mt-1.5">
                        <input 
                          type="url" 
                          value={formImage}
                          onChange={(e) => setFormImage(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface text-on-surface border border-outline-variant/40 text-[11px] focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                    </details>
                  </div>
                </div>

                {/* Preset Galeri Makanan Populer (1-Klik) */}
                <div className="flex flex-col gap-1 pt-1.5 border-t border-surface-container">
                  <span className="text-[10px] text-on-surface-variant font-semibold">
                    Atau gunakan foto rekomendasi cepat:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESET_IMAGES.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setFormImage(preset.url)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          formImage === preset.url
                            ? 'bg-primary-container text-on-primary-container font-bold border-primary'
                            : 'bg-surface-container text-on-surface hover:bg-surface-container-high border-outline-variant/30'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* KETERANGAN YANG DIDAPAT DARI MENU (PORTION INFO) */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-tertiary">check_circle</span>
                    <span>Keterangan Paket / Yang Didapat dari Menu</span>
                  </label>
                  <span className="text-[10px] text-on-surface-variant font-medium">Tampil di kartu menu</span>
                </div>
                <input 
                  type="text" 
                  value={formPortion}
                  onChange={(e) => setFormPortion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface text-on-surface border border-outline-variant/40 text-xs focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Contoh: 1 Porsi + Kuah Segar / 1 Gelas Jumbo 500ml"
                  required 
                />
                {/* Pilihan Cepat Keterangan Paket */}
                <div className="flex flex-col gap-1 pt-1 border-t border-surface-container">
                  <span className="text-[10px] text-on-surface-variant font-semibold">Pilihan cepat rekomendasi:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      '1 Porsi + Kuah Segar',
                      '1 Porsi Komplit + Kuah',
                      '1 Porsi Mie + Kuah Pisah',
                      '1 Porsi (Isi 3 Pcs)',
                      '1 Porsi (Isi 5 Pcs)',
                      '1 Mangkok Porsi Ekstra',
                      '1 Gelas Jumbo 500ml',
                      '1 Gelas Dingin Segar'
                    ].map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => setFormPortion(chip)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          formPortion === chip
                            ? 'bg-tertiary-container text-on-tertiary-container font-bold border-tertiary'
                            : 'bg-surface text-on-surface-variant hover:bg-surface-container-high border-outline-variant/30'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Deskripsi Singkat</label>
                <textarea 
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/40 text-xs focus:ring-1 focus:ring-primary outline-none"
                  rows={2}
                />
              </div>

              <div className="pt-3 border-t border-surface-container flex items-center justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setMenuModal({ open: false, mode: 'add', data: null })}
                  className="px-4 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-semibold"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-md"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRM DELETE */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl shadow-xl overflow-hidden p-6 flex flex-col gap-4 border border-outline-variant/30">
            <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-headline-sm text-base font-bold text-on-surface">Konfirmasi Hapus Menu?</span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong className="text-on-surface">{deleteModal.name}</strong> dari daftar menu? Pelanggan tidak akan dapat memesan menu ini lagi.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button 
                onClick={() => setDeleteModal({ open: false, id: null, name: '' })}
                className="px-4 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-semibold"
              >
                Batalkan
              </button>
              <button 
                onClick={executeDelete}
                className="px-4 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:opacity-90 shadow-sm"
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CETAK STRUK THERMAL */}
      {slipModal.open && slipModal.order && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-sm w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-surface-container-high flex items-center justify-between border-b border-surface-container">
              <span className="font-headline-sm text-sm font-bold text-on-surface">Simulasi Cetak Struk Dapur POS</span>
              <button onClick={() => setSlipModal({ open: false, order: null })} className="w-7 h-7 rounded-full bg-surface-container hover:bg-surface-dim flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div id="thermal-receipt-print-area" className="p-5 font-mono text-xs bg-white text-black border-dashed border-y border-outline-variant/30 leading-relaxed select-all">
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>JURAGAN BAKSO NUSANTARA</div>
              <div style={{ textAlign: 'center', fontSize: '10px' }}>Jl. Malaka Baru 1, BKT Pd. Kopi • WA: 0822-9954-8784</div>
              <div style={{ textAlign: 'center', margin: '8px 0' }}>================================</div>
              <div>No Tiket: <strong>{slipModal.order.id}</strong></div>
              <div>Waktu   : {slipModal.order.timestamp}</div>
              <div>Pemesan : {slipModal.order.customer_name}</div>
              <div>Layanan : {slipModal.order.order_type_label}</div>
              <div>Detail  : {slipModal.order.order_detail_meta}</div>
              <div style={{ margin: '6px 0' }}>--------------------------------</div>
              {(slipModal.order.items || []).map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>{it.name} x{it.qty}</span>
                  <span>{formatIDR(it.price * it.qty)}</span>
                </div>
              ))}
              <div style={{ margin: '6px 0' }}>--------------------------------</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Biaya Layanan/Bungkus:</span>
                <span>{formatIDR(slipModal.order.packaging_fee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '4px' }}>
                <span>TOTAL:</span>
                <span>{formatIDR(slipModal.order.total)}</span>
              </div>
              <div style={{ margin: '6px 0' }}>--------------------------------</div>
              <div>Metode Bayar: <strong>{slipModal.order.payment_method || 'QRIS Instan'}</strong></div>
              {slipModal.order.payment_method?.includes('QRIS') && (
                <div style={{ textAlign: 'center', margin: '8px 0', padding: '6px', border: '1px dashed #aaa', borderRadius: '4px', background: '#fafafa' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold' }}>SCAN QRIS: AJI STORE</div>
                  <img 
                    src="/qris-pembayaran.jpeg" 
                    alt="QRIS AJI STORE" 
                    style={{ width: '90px', height: '115px', objectFit: 'contain', margin: '4px auto', display: 'block' }} 
                  />
                  <div style={{ fontSize: '9px', fontWeight: 'bold' }}>NMID: ID1026632017442</div>
                  <div style={{ fontSize: '8px', color: '#666' }}>BCA / Mandiri / BRI / Dana / GoPay / OVO</div>
                </div>
              )}
              {slipModal.order.payment_method?.includes('Tunai') && (
                <div style={{ textAlign: 'center', margin: '8px 0', padding: '6px', border: '1px solid #aaa', borderRadius: '4px', background: '#fafafa' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold' }}>BARCODE TIKET KASIR (BAYAR TUNAI)</div>
                  <Barcode1D 
                    value={slipModal.order.id} 
                    height={38} 
                    subtitle="SCAN VALIDASI KASIR"
                  />
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#b45309', marginTop: '4px' }}>
                    Status: {slipModal.order.payment_method}
                  </div>
                </div>
              )}
              <div style={{ margin: '6px 0' }}>--------------------------------</div>
              <div>Catatan Dapur:</div>
              <div style={{ fontStyle: 'italic' }}>"{slipModal.order.notes}"</div>
              <div style={{ textAlign: 'center', marginTop: '10px' }}>================================</div>
              <div style={{ textAlign: 'center', fontSize: '10px' }}>Terima Kasih Atas Kunjungan Anda!</div>
            </div>
            <div className="p-4 bg-surface-container flex items-center justify-between gap-2">
              <button 
                type="button" 
                onClick={() => openWaModal(slipModal.order)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-label-md text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                title="Kirim Struk &amp; Notifikasi ke WhatsApp Pemesan"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>Kirim ke WA</span>
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => setSlipModal({ open: false, order: null })} className="px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface font-label-md text-xs">Batal</button>
                <button onClick={() => window.print()} className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-xs font-bold flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">print</span> Cetak Struk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal QRIS Admin Verifikasi */}
      {qrisModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white text-black max-w-sm w-full rounded-2xl shadow-2xl p-5 flex flex-col items-center gap-3 relative border border-outline-variant/30">
            <button 
              onClick={() => setQrisModalOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-dim transition-colors"
              title="Tutup Modal"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Barcode QRIS Kasir</span>
              <h4 className="text-base font-bold text-black mt-0.5">AJI STORE - HOME SERVICE</h4>
              <span className="text-xs text-on-surface-variant font-mono font-semibold">NMID: ID1026632017442</span>
            </div>
            <div className="w-64 h-80 overflow-hidden rounded-xl border border-outline-variant/30 bg-white p-2 flex items-center justify-center shadow-inner">
              <img 
                src="/qris-pembayaran.jpeg" 
                alt="QRIS AJI STORE"
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="w-full p-2.5 rounded-xl bg-surface-container-low text-center flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-on-surface">Validasi Pembayaran Pelanggan</span>
              <span className="text-[10px] text-on-surface-variant">Pastikan nama merchant penerima dana adalah AJI STORE</span>
            </div>
            <div className="flex items-center gap-2 w-full">
              <a 
                href="/qris-pembayaran.jpeg" 
                download="QRIS-Aji-Store-Juragan-Bakso.jpeg"
                className="flex-1 py-2.5 bg-surface-container hover:bg-surface-dim text-on-surface text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Unduh QRIS</span>
              </a>
              <button 
                type="button" 
                onClick={() => setQrisModalOpen(false)}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold rounded-xl shadow-xs transition-colors text-center"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOTIFIKASI WHATSAPP KE PEMESAN */}
      {waModal.open && waModal.order && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-outline-variant/30">
            
            {/* Header Modal */}
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm">Kirim Notifikasi WhatsApp ke Pemesan</h4>
                  <p className="text-[11px] text-emerald-100">
                    No. Tiket: <strong>{waModal.order.id}</strong> • Pemesan: <strong>{waModal.order.customer_name}</strong>
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setWaModal({ open: false, order: null, template: 'default', message: '', targetPhone: '', copied: false })}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {/* Isi Modal */}
            <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
              
              {/* Kontak Pemesan & Verifikasi API WA */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface">Nomor WhatsApp Tujuan:</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                    API Format: +{formatWaPhone(waModal.targetPhone)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">phone_iphone</span>
                  <input 
                    type="text" 
                    value={waModal.targetPhone}
                    onChange={(e) => setWaModal(prev => ({ ...prev, targetPhone: e.target.value }))}
                    placeholder="Contoh: 081234567890 atau 6281234567890"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-surface border border-outline-variant/40 text-xs font-mono font-bold text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant">
                  Format otomatis diselaraskan ke standar internasional (awalan <code>62</code>) agar WhatsApp langsung membuka ruang obrolan dengan nomor pemesan tanpa pesan error link tidak valid.
                </p>
              </div>

              {/* Template Cepat */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-on-surface">Pilih Template Status Pesanan:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyWaTemplate('baru')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      waModal.template === 'baru' ? 'bg-primary text-on-primary border-primary font-bold' : 'bg-surface border-outline-variant/40 text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span>⚡</span> <span>Baru Masuk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyWaTemplate('masak')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      waModal.template === 'masak' ? 'bg-amber-600 text-white border-amber-600 font-bold' : 'bg-surface border-outline-variant/40 text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span>🍳</span> <span>Sedang Masak</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyWaTemplate('siap')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      waModal.template === 'siap' ? 'bg-emerald-600 text-white border-emerald-600 font-bold' : 'bg-surface border-outline-variant/40 text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span>📦</span> <span>Siap Saji</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyWaTemplate('selesai')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      waModal.template === 'selesai' ? 'bg-tertiary text-on-tertiary border-tertiary font-bold' : 'bg-surface border-outline-variant/40 text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span>✅</span> <span>Selesai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyWaTemplate('batal')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      waModal.template === 'batal' ? 'bg-error text-on-error border-error font-bold' : 'bg-surface border-outline-variant/40 text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span>❌</span> <span>Dibatalkan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyWaTemplate(waModal.order?.status || 'baru')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border bg-surface-container border-outline-variant/40 text-on-surface hover:bg-surface-container-high"
                  >
                    <span>🔄</span> <span>Reset Default</span>
                  </button>
                </div>
              </div>

              {/* Draf Pesan */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-on-surface">Draf Teks Pesan WhatsApp (Dapat Diedit Bebas):</label>
                  <button
                    type="button"
                    onClick={handleCopyWaMessage}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    <span>{waModal.copied ? 'Tersalin ke Clipboard!' : 'Salin Teks'}</span>
                  </button>
                </div>
                <textarea 
                  rows={8}
                  value={waModal.message}
                  onChange={(e) => setWaModal(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-xs font-mono leading-relaxed text-on-surface outline-none focus:border-primary resize-y"
                />
              </div>

            </div>

            {/* Tombol Aksi Bawah */}
            <div className="p-4 bg-surface-container flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/30">
              <button 
                type="button"
                onClick={() => setWaModal({ open: false, order: null, template: 'default', message: '', targetPhone: '', copied: false })}
                className="px-4 py-2 rounded-xl bg-surface-container-highest text-on-surface text-xs font-semibold hover:bg-surface-dim transition-colors"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLaunchWhatsApp('web')}
                  className="px-3.5 py-2 rounded-xl bg-surface border border-outline-variant/40 text-on-surface text-xs font-bold hover:bg-surface-container transition-all flex items-center gap-1.5 shadow-xs"
                  title="Buka langsung via WhatsApp Web (Desktop)"
                >
                  <span className="material-symbols-outlined text-[16px]">laptop</span>
                  <span>WhatsApp Web</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLaunchWhatsApp('universal')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>Buka Chat WhatsApp Sekarang →</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Toast Notifikasi Status WhatsApp */}
      {waToast.show && waToast.order && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300 border border-neutral-700 max-w-md">
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">mark_chat_unread</span>
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-sm">Status {waToast.order.id} Diperbarui!</div>
            <div className="text-white/80">Kirim update WhatsApp ke {waToast.order.customer_name}?</div>
          </div>
          <button
            onClick={() => {
              openWaModal(waToast.order, waToast.status);
              setWaToast(prev => ({ ...prev, show: false }));
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shrink-0 shadow-sm"
          >
            Kirim WA →
          </button>
          <button
            onClick={() => setWaToast(prev => ({ ...prev, show: false }))}
            className="text-white/60 hover:text-white text-[16px] px-1"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
