import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

let pool = null;

const ORDERS_STORE_FILE = path.join(process.cwd(), '.orders_fallback.json');
const MENUS_STORE_FILE = path.join(process.cwd(), '.menus_fallback.json');
const USERS_STORE_FILE = path.join(process.cwd(), '.users_fallback.json');

export function normalizePhone(p) {
  if (!p || typeof p !== 'string') return '';
  let digits = p.replace(/\D/g, '');
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2);
  }
  return digits;
}

function saveUsersToDisk(users) {
  try {
    fs.writeFileSync(USERS_STORE_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {}
}

function loadUsersFromDisk() {
  try {
    if (fs.existsSync(USERS_STORE_FILE)) {
      const data = fs.readFileSync(USERS_STORE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return null;
}

function saveOrdersToDisk(orders) {
  try {
    fs.writeFileSync(ORDERS_STORE_FILE, JSON.stringify(orders, null, 2), 'utf8');
  } catch (e) {}
}

function loadOrdersFromDisk() {
  try {
    if (fs.existsSync(ORDERS_STORE_FILE)) {
      const data = fs.readFileSync(ORDERS_STORE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return null;
}

function saveMenusToDisk(menus) {
  try {
    fs.writeFileSync(MENUS_STORE_FILE, JSON.stringify(menus, null, 2), 'utf8');
  } catch (e) {}
}

function loadMenusFromDisk() {
  try {
    if (fs.existsSync(MENUS_STORE_FILE)) {
      const data = fs.readFileSync(MENUS_STORE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return null;
}

// Initial Seed Data untuk Fallback (jika MySQL lokal belum dinyalakan atau saat deploy di Vercel tanpa DB remote)
let memoryStore = {
  users: [
    { id: 1, identifier: 'admin@baksojuara.com', password: 'DapurJuara#Benhil24', role: 'admin', name: 'Admin Kasir Shift Pagi', phone: '082299548784', pin: '882109' },
    { id: 2, identifier: '081289004411', password: 'MakanBakso2025!', role: 'customer', name: 'Budi Santoso', phone: '081289004411', pin: null }
  ],
  settings: {
    id: 1,
    is_open: true,
    open_hours: '10:00 - 21:30 WIB',
    wa_number: '6282299548784',
    packaging_fee: 2000,
    store_address: 'Jl. Malaka Baru 1, Jl. Raya BKT Bojong Rangkong No. 039, RT.5/RW.11, Pondok Kopi, Duren Sawit, Jakarta Timur 13460',
    google_maps_url: 'https://maps.app.goo.gl/VfA2fCtDV8ZXa67d8?g_st=ac'
  },
  menus: [
    {
      id: 1,
      name: 'Bakso Urat Granat Jumbo',
      category: 'bakso-kuah',
      category_label: 'Bakso Spesial Kuah',
      price: 32000,
      stock: 24,
      description: 'Bakso urat sapi kasar super renyah dengan isian cabai rawit pedas dan kuah kaldu gurih rempah kental.',
      portion_info: '1 Porsi + Kuah Segar',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlG5IThUnnsSf04s_nGZ3NIaMijcFR5xv7_lkwzZzTHrCj54HFlTkPf00D2t6xMUQwcg2X3cqYqvQCazO6GfNPR9_mGETsb30QtoTNqUbnQxPqv7CAujR58Z5Np9rr4I8KfcacABLR7umeiAAGbgknPFY4jvrzvFOqyPRhEsQvnuX5IP25Gc8xO3bXm4CLJFae9IG1KlP2uBa2xSFqMW0od7EitdfjwY3NDPo5-vI',
      badge: 'Pedas Rawit',
      badge_type: 'secondary',
      is_available: true
    },
    {
      id: 2,
      name: 'Bakso Halus Komplit Tetelan',
      category: 'bakso-kuah',
      category_label: 'Bakso Spesial Kuah',
      price: 35000,
      stock: 18,
      description: '5 butir bakso halus lembut kenyal, 1 tahu bakso lembut, dan limpahan tetelan sapi gurih berkaldu.',
      portion_info: '1 Porsi Komplit + Kuah',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbDeCyDnVOL2BBmoItdgN1cMQBMddSg4m0PtkMZob5JkXQnLM-n_ayf6h57yY09pB3_qiCRAEeft26JGjE0K6zLnWi43vaHx_7kqWx1vnFyflOFb53XEo0H8j5pbSy6GZhlOOcS05UY7SDHze5dsIO4ye8wgvUGPz9LAjGiQw9jbr-cVpQipUAj0s2TZ7BEpkq-r5jT942-1ekc8KSQt4gULNgH9Drjg9qCEVnNh4',
      badge: 'Favorit Keluarga',
      badge_type: 'primary',
      is_available: true
    },
    {
      id: 3,
      name: 'Bakso Telur Puyuh & Jamur',
      category: 'bakso-kuah',
      category_label: 'Bakso Spesial Kuah',
      price: 28000,
      stock: 15,
      description: 'Kombinasi bakso isi 3 butir telur puyuh gurih dan irisan jamur kuping kenyal dengan kuah bening kaldu rempah.',
      portion_info: '1 Porsi + Kuah Kaldu',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2bMAqanLrzT4BAK249I0BpdJJrZYcP4hH9S-qr_17w5aHLPtLHdKzUmsTzzPgahZJNQ-yNJRGlBvJ5hsSE5iVd178hbTdjZAWRBxGyIYgWHGyhM4ehKd3zP5LY4-GVrUcapi63ufDRwT5t8yeDZN_Nq2O3bzFlsZJUoZI2U52Ix0vaePe_b795ygmfpe4D2lfys200R5KU9XEB0agYS5k502pdQTVIlYnrIgkgOU',
      badge: 'Gurih Alami',
      badge_type: 'tertiary',
      is_available: true
    },
    {
      id: 4,
      name: 'Mie Ayam Bakso Pangsit',
      category: 'mie-bihun',
      category_label: 'Mie & Bihun Bakso',
      price: 25000,
      stock: 30,
      description: 'Mie kenyal racikan bumbu khas, cacahan ayam kecap manis gurih, sawi hijau segar, pangsit goreng, dan 2 butir bakso sapi.',
      portion_info: '1 Porsi Mie + Kuah Pisah',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxc7d7tBOtzjnPh99GRQ9a5MN8vGVspP-exgrD4sA9ShaoR6l5AVQzx3U8A1JOa8oxFauHHivzGDoKLvtj5QBneUxog15dUcVXaPhVXvd-2-J84MQUxGoulpNvoiGencOD8yd_OK0KukUqZgn6tHk82aIEcl0eMcD8ySHwg52rIUWDeQuYQhoQwdquc0EKFY1kIhU-CMVqx3MhNmtneMQNBTaKOnmsABhE1ZhJX4M',
      badge: 'Termasuk Kuah',
      badge_type: 'neutral',
      is_available: true
    },
    {
      id: 5,
      name: 'Tetelan Sapi Gurih Tambahan',
      category: 'pelengkap',
      category_label: 'Pelengkap & Gorengan',
      price: 12000,
      stock: 2,
      description: 'Porsi ekstra potongan tetelan daging dan urat lembut yang direbus empuk dalam rempah kuah kaldu.',
      portion_info: '1 Mangkok Porsi Ekstra',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2sXN-1rY3oM0juJ7WC76IYaozqHe71ojK0SpDNSXNaoFUoGaZvLGzvyoCP7QyCdHcpDbcIfu6RFkRYOb2701jGSt7LkMFgYTTnPVlSua9_3aZi-D-TsIy699kxBL8wr4Z80J_OlNz13QIh-sQvT4l06y4Psy9Dg8htnUAN3Mp_GxqydDfJRRqd0ycu8uYyhYqeZHrnpfPe6x65ErmGgvFzVucZeK6x76PktnxDew',
      badge: 'Stok Terbatas: 2',
      badge_type: 'error',
      is_available: true
    },
    {
      id: 6,
      name: 'Pangsit Goreng Renyah (Isi 3)',
      category: 'pelengkap',
      category_label: 'Pelengkap & Gorengan',
      price: 8000,
      stock: 45,
      description: 'Kulit pangsit krispi mekar digoreng dadakan dengan isian adonan ayam-udang gurih di bagian tengah.',
      portion_info: '1 Porsi (Isi 3 Pcs)',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd-6mbhB99waNRTqJYZKIRQ_1MXhZCxhIbmWin5-gnXHbidaMUxV1ceDn0Aj_S9Cz4qiq9QE_VzTj6GSK8cUWvDdzLMF4-PF84RQy_HolUP2iB3AQc_2mWFs7l4eRV-YTv8YuOCmwP2oEgtfLyYqqtB-vRP-uP6y9RIls3J7yCMoPCBBAmQFTfJApb1ATiqbqHHJuaXk6XthHSaFjQMNk2ZObNP_rQxPXXDNKYQvc',
      badge: 'Ekstra Renyah',
      badge_type: 'neutral',
      is_available: true
    },
    {
      id: 7,
      name: 'Es Campur Durian Asli',
      category: 'minuman',
      category_label: 'Minuman Segar Dingin',
      price: 18000,
      stock: 0,
      description: 'Es serut melimpah dengan legitnya daging buah durian asli Medan, kelapa muda, alpukat mentega, dan sirup cocopandan.',
      portion_info: '1 Mangkok Es Serut Durian',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3bauJM3uwpbPN2aw5kL18GaX_4Xif9c4Co1Z5GHu6z_xm6tODvur1mjR8aIxIdAy19sxgaeaBoFYt3FVMXvlXuxYPHKeHl9XJ4LVsIXL-JVoVBOiYWOU3e_xdfZWJAHzvTk5JzTYNWbrpTdFnVkWtkvkEUynHs5Ljo8GBpK-3eTdGOvCryqWjT2NKqyBWBIPoVqEp5PqdJopxwB-kg3PkznMDQJlmtw1u0yc4XC0',
      badge: 'Habis / Sold Out',
      badge_type: 'error',
      is_available: false
    },
    {
      id: 8,
      name: 'Es Teh Manis Jumbo',
      category: 'minuman',
      category_label: 'Minuman Segar Dingin',
      price: 5000,
      stock: 99,
      description: 'Seduhan teh melati wangi khas Jawa disajikan dalam gelas porsi jumbo 500ml dingin penyegar dahaga.',
      portion_info: '1 Gelas Jumbo 500ml',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuq5sYJ1Jl8aL53dNvvDKPGZgdGF6XCbuGgpQqPVFRfLrco6xgZuX6gQX8-ohstFQDhmHpAkC2MrfgH9LlLivU4dfEXk7-jQEOedaRqcKpFW_hFPh7LxVbv8_JI2quq_lmtd8H7TVMKg2krkxH5IcgiQD0zRUAL0miQ8r-Aj0DofmKd5-a8pm8d8G06No4uD2tIciavsAYztNwC1Fqhf1YTBcNNCJKKj6I7Xd7ZJI',
      badge: 'Gelas Besar',
      badge_type: 'neutral',
      is_available: true
    }
  ],
  orders: [
    {
      id: '#BKS-089',
      customer_name: 'Pak Budi Santoso',
      customer_phone: '0812-9988-1029',
      order_type: 'dine-in',
      order_type_label: 'Makan di Tempat - Meja 04',
      order_detail_meta: 'Nomor Meja: Meja 04',
      items: [
        { name: 'Bakso Urat Granat Jumbo', price: 32000, qty: 2 },
        { name: 'Bakso Halus Komplit Tetelan', price: 35000, qty: 1 },
        { name: 'Es Teh Manis Jumbo', price: 5000, qty: 3 }
      ],
      notes: 'Bakso urat kuah pedas level 3, jangan pakai seledri',
      packaging_fee: 0,
      total: 114000,
      payment_method: 'QRIS • Lunas',
      status: 'baru',
      timestamp: '12:41 WIB',
      time_ago: '2m lalu'
    },
    {
      id: '#BKS-090',
      customer_name: 'Ibu Ratna Dewi',
      customer_phone: '0856-7711-2099',
      order_type: 'delivery',
      order_type_label: 'Pesan Antar - Kurir Instan',
      order_detail_meta: 'Jl. Malaka Baru No. 10 (Pagar Putih)',
      items: [
        { name: 'Bakso Urat Granat Jumbo', price: 32000, qty: 1 },
        { name: 'Tetelan Sapi Gurih Tambahan', price: 12000, qty: 1 },
        { name: 'Pangsit Goreng Renyah (Isi 3)', price: 8000, qty: 1 }
      ],
      notes: 'Sambal dipisah 3 bungkus, kuah panas',
      packaging_fee: 2000,
      total: 54000,
      payment_method: 'COD Kurir',
      status: 'baru',
      timestamp: '12:44 WIB',
      time_ago: '1m lalu'
    },
    {
      id: '#BKS-088',
      customer_name: 'Dimas Anggara',
      customer_phone: '0878-1002-4411',
      order_type: 'takeaway',
      order_type_label: 'Bungkus / Takeaway',
      order_detail_meta: 'Estimasi Diambil: 15 Menit',
      items: [
        { name: 'Bakso Halus Komplit Tetelan', price: 35000, qty: 3 },
        { name: 'Es Teh Manis Jumbo', price: 5000, qty: 2 }
      ],
      notes: 'Kecap manis dipisah',
      packaging_fee: 2000,
      total: 117000,
      payment_method: 'Transfer • Lunas',
      status: 'masak',
      timestamp: '12:35 WIB',
      time_ago: '10m lalu'
    },
    {
      id: '#BKS-087',
      customer_name: 'Siti Rahmah',
      customer_phone: '0813-2223-8877',
      order_type: 'dine-in',
      order_type_label: 'Makan di Tempat - Meja 08',
      order_detail_meta: 'Nomor Meja: Meja 08',
      items: [
        { name: 'Bakso Urat Granat Jumbo', price: 32000, qty: 2 }
      ],
      notes: 'Kering tanpa kuah, sambal banyak',
      packaging_fee: 0,
      total: 64000,
      payment_method: 'Kasir Tunai • Lunas',
      status: 'siap',
      timestamp: '12:28 WIB',
      time_ago: '17m lalu'
    },
    {
      id: '#BKS-086',
      customer_name: 'Hendra Kurnia',
      customer_phone: '0811-4567-9900',
      order_type: 'dine-in',
      order_type_label: 'Makan di Tempat - Meja 02',
      order_detail_meta: 'Nomor Meja: Meja 02',
      items: [
        { name: 'Bakso Halus Komplit Tetelan', price: 35000, qty: 1 },
        { name: 'Es Teh Manis Jumbo', price: 5000, qty: 1 }
      ],
      notes: '-',
      packaging_fee: 0,
      total: 40000,
      payment_method: 'QRIS • Selesai',
      status: 'selesai',
      timestamp: '12:15 WIB',
      time_ago: '30m lalu'
    }
  ]
};

// Muat fallback pesanan dari disk jika ada agar data transaksi tidak pernah hilang
const initialDiskOrders = loadOrdersFromDisk();
if (initialDiskOrders && initialDiskOrders.length > 0) {
  memoryStore.orders = initialDiskOrders;
} else {
  saveOrdersToDisk(memoryStore.orders);
}

// Muat fallback menu dari disk jika ada agar menu baru yang ditambahkan tidak pernah hilang
const initialDiskMenus = loadMenusFromDisk();
if (initialDiskMenus && initialDiskMenus.length > 0) {
  memoryStore.menus = initialDiskMenus;
} else {
  saveMenusToDisk(memoryStore.menus);
}

// Muat fallback pengguna dari disk jika ada agar akun pelanggan terdaftar tidak pernah hilang
const initialDiskUsers = loadUsersFromDisk();
if (initialDiskUsers && initialDiskUsers.length > 0) {
  memoryStore.users = initialDiskUsers;
} else {
  saveUsersToDisk(memoryStore.users);
}

export function getDbPool() {
  if (!pool && process.env.MYSQL_HOST) {
    try {
      pool = mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        port: Number(process.env.MYSQL_PORT) || 3306,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'juragan_bakso_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
    } catch (err) {
      console.warn('MySQL pool initialization failed, using fallback store:', err.message);
      pool = null;
    }
  }
  return pool;
}

// Wrapper query dengan safe fallback
export async function query(sql, params = []) {
  const p = getDbPool();
  if (p) {
    try {
      const [rows] = await p.execute(sql, params);
      return { rows, isMysql: true };
    } catch (err) {
      console.warn('MySQL execute failed, falling back to memory store:', err.message);
    }
  }
  return { rows: null, isMysql: false };
}

// Memory Store Accessor (Zero-Crash Guarantee)
export const dbFallback = {
  getMemoryStore() {
    return memoryStore;
  },

  getMenus(category = null) {
    const diskMenus = loadMenusFromDisk();
    if (diskMenus && diskMenus.length > 0) {
      memoryStore.menus = diskMenus;
    }
    if (!category || category === 'semua') return memoryStore.menus;
    return memoryStore.menus.filter(m => m.category === category);
  },

  getMenuById(id) {
    const diskMenus = loadMenusFromDisk();
    if (diskMenus && diskMenus.length > 0) {
      memoryStore.menus = diskMenus;
    }
    return memoryStore.menus.find(m => Number(m.id) === Number(id));
  },

  addMenu(menuData) {
    const diskMenus = loadMenusFromDisk();
    if (diskMenus && diskMenus.length > 0) {
      memoryStore.menus = diskMenus;
    }
    const newId = memoryStore.menus.length > 0 
      ? Math.max(...memoryStore.menus.map(m => Number(m.id) || 0)) + 1 
      : 1;
    const newMenu = {
      id: newId,
      name: menuData.name,
      category: menuData.category || 'bakso-kuah',
      category_label: menuData.category_label || 'Bakso Spesial Kuah',
      price: Number(menuData.price) || 0,
      stock: Number(menuData.stock) || 0,
      description: menuData.description || '',
      portion_info: menuData.portion_info || '1 Porsi + Kuah Segar',
      image: menuData.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlG5IThUnnsSf04s_nGZ3NIaMijcFR5xv7_lkwzZzTHrCj54HFlTkPf00D2t6xMUQwcg2X3cqYqvQCazO6GfNPR9_mGETsb30QtoTNqUbnQxPqv7CAujR58Z5Np9rr4I8KfcacABLR7umeiAAGbgknPFY4jvrzvFOqyPRhEsQvnuX5IP25Gc8xO3bXm4CLJFae9IG1KlP2uBa2xSFqMW0od7EitdfjwY3NDPo5-vI',
      badge: Number(menuData.stock) > 0 ? 'Tersedia' : 'Habis',
      badge_type: Number(menuData.stock) > 0 ? 'tertiary' : 'error',
      is_available: Number(menuData.stock) > 0
    };
    memoryStore.menus.unshift(newMenu);
    saveMenusToDisk(memoryStore.menus);
    return newMenu;
  },

  updateMenu(id, updateData) {
    const diskMenus = loadMenusFromDisk();
    if (diskMenus && diskMenus.length > 0) {
      memoryStore.menus = diskMenus;
    }
    const index = memoryStore.menus.findIndex(m => Number(m.id) === Number(id));
    if (index > -1) {
      const stock = Number(updateData.stock !== undefined ? updateData.stock : memoryStore.menus[index].stock);
      memoryStore.menus[index] = {
        ...memoryStore.menus[index],
        ...updateData,
        portion_info: updateData.portion_info !== undefined ? updateData.portion_info : (memoryStore.menus[index].portion_info || '1 Porsi + Kuah Segar'),
        stock,
        is_available: stock > 0,
        badge: stock > 0 ? (stock <= 5 ? `Menipis (${stock})` : 'Tersedia') : 'Habis / Sold Out',
        badge_type: stock > 0 ? (stock <= 5 ? 'primary' : 'tertiary') : 'error'
      };
      saveMenusToDisk(memoryStore.menus);
      return memoryStore.menus[index];
    }
    return null;
  },

  deleteMenu(id) {
    const diskMenus = loadMenusFromDisk();
    if (diskMenus && diskMenus.length > 0) {
      memoryStore.menus = diskMenus;
    }
    const prevLen = memoryStore.menus.length;
    memoryStore.menus = memoryStore.menus.filter(m => Number(m.id) !== Number(id));
    saveMenusToDisk(memoryStore.menus);
    return memoryStore.menus.length < prevLen;
  },

  getOrders(status = null) {
    const diskOrders = loadOrdersFromDisk();
    if (diskOrders && diskOrders.length > 0) {
      memoryStore.orders = diskOrders;
    }
    if (!status || status === 'all') return memoryStore.orders;
    return memoryStore.orders.filter(o => o.status === status);
  },

  addOrder(orderData) {
    const diskOrders = loadOrdersFromDisk();
    if (diskOrders && diskOrders.length > 0) {
      memoryStore.orders = diskOrders;
    }
    const count = memoryStore.orders.length + 91;
    const orderId = `#BKS-${String(count).padStart(3, '0')}`;
    const now = new Date();
    const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    const newOrder = {
      id: orderId,
      customer_name: orderData.customer_name || 'Pelanggan Tamu',
      customer_phone: orderData.customer_phone || '-',
      order_type: orderData.order_type || 'dine-in',
      order_type_label: orderData.order_type_label || (orderData.order_type === 'takeaway' ? 'Bungkus' : orderData.order_type === 'delivery' ? 'Pesan Antar' : 'Makan di Tempat'),
      order_detail_meta: orderData.order_detail_meta || orderData.table_or_address || '-',
      items: orderData.items || [],
      notes: orderData.notes || '-',
      packaging_fee: Number(orderData.packaging_fee ?? orderData.tax_or_fee ?? 0),
      total: Number(orderData.total) || 0,
      payment_method: orderData.payment_method || 'Kasir / QRIS',
      status: 'baru',
      timestamp: timestamp,
      time_ago: 'Baru saja'
    };

    memoryStore.orders.unshift(newOrder);
    saveOrdersToDisk(memoryStore.orders);

    // Otomatis potong stok menu
    (orderData.items || []).forEach(item => {
      const mIdx = memoryStore.menus.findIndex(m => m.name === item.name);
      if (mIdx > -1) {
        memoryStore.menus[mIdx].stock = Math.max(0, memoryStore.menus[mIdx].stock - (item.qty || 1));
        if (memoryStore.menus[mIdx].stock === 0) {
          memoryStore.menus[mIdx].is_available = false;
          memoryStore.menus[mIdx].badge = 'Habis / Sold Out';
          memoryStore.menus[mIdx].badge_type = 'error';
        }
      }
    });
    saveMenusToDisk(memoryStore.menus);

    return newOrder;
  },

  updateOrderStatus(orderId, newStatus, newPaymentMethod = null) {
    const diskOrders = loadOrdersFromDisk();
    if (diskOrders && diskOrders.length > 0) {
      memoryStore.orders = diskOrders;
    }
    const cleanId = String(orderId || '').toLowerCase();
    const index = memoryStore.orders.findIndex(o => 
      o.id.toLowerCase() === cleanId || 
      o.id.replace('#', '').toLowerCase() === cleanId.replace('#', '')
    );
    if (index > -1) {
      if (newStatus) {
        memoryStore.orders[index].status = newStatus;
      }
      if (newPaymentMethod) {
        memoryStore.orders[index].payment_method = newPaymentMethod;
      }
      saveOrdersToDisk(memoryStore.orders);
      return memoryStore.orders[index];
    }
    return null;
  },

  getSettings() {
    return memoryStore.settings;
  },

  updateSettings(data) {
    memoryStore.settings = { ...memoryStore.settings, ...data };
    return memoryStore.settings;
  },

  getUsers() {
    const diskUsers = loadUsersFromDisk();
    if (diskUsers && diskUsers.length > 0) {
      memoryStore.users = diskUsers;
    }
    return memoryStore.users;
  },

  findUser(identifier) {
    const diskUsers = loadUsersFromDisk();
    if (diskUsers && diskUsers.length > 0) {
      memoryStore.users = diskUsers;
    }
    const cleanId = (identifier || '').trim();
    const cleanIdLower = cleanId.toLowerCase();
    const normCleanId = normalizePhone(cleanId);

    return memoryStore.users.find(u => {
      // 1. Cek kecocokan string langsung
      if (u.identifier && u.identifier.trim().toLowerCase() === cleanIdLower) return true;
      if (u.phone && u.phone.trim() === cleanId) return true;

      // 2. Cek kecocokan nomor telepon ternormalisasi jika input mengandung nomor hp
      if (normCleanId && normCleanId.length >= 7) {
        const uIdNorm = normalizePhone(u.identifier);
        const uPhoneNorm = normalizePhone(u.phone);
        if (uIdNorm && uIdNorm === normCleanId) return true;
        if (uPhoneNorm && uPhoneNorm === normCleanId) return true;
      }
      return false;
    });
  },

  registerCustomer(userData) {
    const diskUsers = loadUsersFromDisk();
    if (diskUsers && diskUsers.length > 0) {
      memoryStore.users = diskUsers;
    }

    const cleanId = (userData.identifier || userData.phone || '').trim();
    const cleanPhone = (userData.phone || userData.identifier || '').trim();
    const cleanName = (userData.name || 'Pelanggan Baru').trim();
    const cleanPass = (userData.password || '').trim();
    const normPhone = normalizePhone(cleanPhone);

    const existing = memoryStore.users.find(u => {
      if (u.identifier && u.identifier.trim().toLowerCase() === cleanId.toLowerCase()) return true;
      if (u.phone && u.phone.trim() === cleanPhone) return true;
      if (normPhone && normPhone.length >= 7) {
        const uIdNorm = normalizePhone(u.identifier);
        const uPhoneNorm = normalizePhone(u.phone);
        if (uIdNorm && uIdNorm === normPhone) return true;
        if (uPhoneNorm && uPhoneNorm === normPhone) return true;
      }
      return false;
    });

    if (existing) {
      return { success: false, message: 'Nomor WhatsApp atau akun tersebut sudah terdaftar! Silakan langsung login.' };
    }

    const nextId = memoryStore.users.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1;
    const newUser = {
      id: nextId,
      identifier: cleanId,
      password: cleanPass,
      role: 'customer',
      name: cleanName,
      phone: cleanPhone,
      pin: null
    };

    memoryStore.users.push(newUser);
    saveUsersToDisk(memoryStore.users);

    return { success: true, user: newUser };
  }
};
