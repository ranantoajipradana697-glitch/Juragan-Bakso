# 🛠️ DOKUMENTASI TEKNIS BACKEND & SPESIFIKASI RESTful API
## PLATFORM DIGITAL "JURAGAN BAKSO NUSANTARA"
**Next.js 14 App Router API Handlers + Node.js Runtime + Hybrid MySQL & Persistent Disk Fallback Engine**

---

## 📋 1. Ikhtisar Arsitektur Backend (System Architecture Overview)

Backend platform digital **Juragan Bakso Nusantara** dirancang dengan prinsip **High Availability (HA)**, **Zero-Crash Resilience**, dan arsitektur **RESTful API modern**. Sistem ini memproses seluruh transaksi pemesanan menu kuliner, autentikasi pengguna (*dual-role*), manajemen katalog produk (*CRUD*), serta sinkronisasi antrean dapur (*Kitchen Display System - KDS*) secara terstruktur.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        KLIEN / CONSUMER                                │
│   [Etalase Pelanggan (Web/Mobile)]      [Terminal POS & KDS Admin]     │
└──────────────────┬──────────────────────────────────┬──────────────────┘
                   │                                  │
                   │ HTTP / HTTPS (JSON)              │ RESTful Endpoints
                   ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│             NEXT.JS 14 APP ROUTER API BACKEND RUNTIME                  │
│  • Edge/Node.js Serverless Route Handlers (/app/api/**/route.js)       │
│  • Sanitasi & Validasi Payload (Strict Trim, Phone Normalizer)        │
│  • Autentikasi Dual-Role & PIN Security Engine                         │
│  • Image Processing & Upload Manager (/public/uploads)                 │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
  ┌─────────────────────────┐             ┌─────────────────────────┐
  │   JALUR 1: MYSQL FISIK  │             │ JALUR 2: ZERO-CRASH     │
  │ • mysql2/promise Pool   │ ◄-Fallback-►│ PERSISTENT LOCAL STORE  │
  │ • Parameterized Queries │  Otomatis   │ • .users_fallback.json  │
  │ • ACID Transactions     │             │ • .menus_fallback.json  │
  │ • Relational DB 8.x     │             │ • .orders_fallback.json │
  └─────────────────────────┘             └─────────────────────────┘
```

### Karakteristik Kunci Backend:
1. **Pola Desain RESTful API**: Menggunakan metode HTTP standar (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) dengan kode status HTTP semantik (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `500 Internal Error`).
2. **Hybrid Dual-Engine Database (Zero-Crash Guarantee)**:
   - **Mode MySQL Aktif**: Terhubung ke database relasional lokal atau cloud via `mysql2/promise` dengan pooling koneksi otomatis.
   - **Mode Fallback Lokal (Tanpa Database)**: Jika MySQL mati/belum dipasang, sistem otomatis beralih membaca dan menulis ke berkas `.json` persisten di disk secara atomik (`fs.writeFileSync`). Data pesanan, menu baru, dan akun terdaftar **tidak akan pernah hilang**.
3. **Engine Normalisasi Nomor WhatsApp (`normalizePhone` & `formatWaPhone`)**: Menstandarkan nomor telepon lokal (`08xxx`) ke format internasional (`628xxx`) untuk kompatibilitas penuh dengan protokol WhatsApp Click-to-Chat.
4. **Pencegahan SQL Injection**: Seluruh query basis data dieksekusi menggunakan *Parameterized Prepared Statements* (`execute(sql, [params])`).

---

## 🗄️ 2. Skema & Entitas Basis Data (Database Schema & ERD)

### A. Tabel `users` (Manajemen Akun Pengguna)
Menyimpan kredensial staf admin toko dan akun pelanggan.
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | INT AUTO_INCREMENT (PK) | Identifikasi unik pengguna |
| `identifier` | VARCHAR(100) UNIQUE | Email staf atau nomor WhatsApp pelanggan |
| `password` | VARCHAR(255) | Kata sandi akun |
| `role` | ENUM('admin', 'customer') | Peran hak akses (*Role-Based Access*) |
| `name` | VARCHAR(100) | Nama lengkap pengguna |
| `phone` | VARCHAR(25) | Nomor WhatsApp aktif |
| `pin` | VARCHAR(6) NULLABLE | PIN Kasir 6-digit khusus peran admin |
| `created_at` | TIMESTAMP DEFAULT NOW() | Waktu pendaftaran akun |

### B. Tabel `menus` (Katalog Produk Kuliner)
Menyimpan hidangan kuliner, porsi, harga, dan ketersediaan stok.
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | INT AUTO_INCREMENT (PK) | ID unik menu |
| `name` | VARCHAR(150) | Nama hidangan kuliner |
| `category` | VARCHAR(50) | Kategori slug (`bakso-kuah`, `mie-bihun`, `pelengkap`, `minuman`) |
| `category_label` | VARCHAR(100) | Label kategori ramah pengguna |
| `price` | DECIMAL(10,2) | Harga jual porsi dalam Rupiah |
| `stock` | INT DEFAULT 0 | Sisa porsi tersedia |
| `description` | TEXT | Keterangan racikan dan bahan |
| `portion_info` | VARCHAR(100) | Keterangan paket/yang didapat (centang hijau) |
| `image` | TEXT | URL gambar menu atau path unggahan lokal |
| `badge` | VARCHAR(50) | Label promosi (*Favorit*, *Pedas Rawit*, dll.) |
| `badge_type` | VARCHAR(20) | Tipe styling badge (*primary*, *secondary*, dll.) |
| `is_available` | BOOLEAN DEFAULT TRUE | Status ketersediaan menu |

### C. Tabel `orders` (Tiket Transaksi Pemesanan)
Menyimpan antrean transaksi masuk dapur POS.
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) (PK) | Nomor tiket transaksi resmi (`#BKS-xxx`) |
| `customer_name` | VARCHAR(100) | Nama pelanggan pemesan |
| `customer_phone` | VARCHAR(25) | Nomor WhatsApp pemesan |
| `order_type` | VARCHAR(20) | Tipe layanan (`dine-in`, `takeaway`, `delivery`) |
| `order_type_label` | VARCHAR(50) | Label layanan |
| `order_detail_meta`| VARCHAR(255) | Rincian meja, estimasi ambil, atau alamat antar |
| `notes` | TEXT | Catatan racikan dapur |
| `packaging_fee` | DECIMAL(10,2) | Biaya kemasan/antar |
| `total` | DECIMAL(10,2) | Total tagihan akhir |
| `payment_method` | VARCHAR(100) | Metode bayar (*QRIS*, *Tunai Kasir*, *COD*) |
| `status` | ENUM | Tahapan KDS (`baru`, `masak`, `siap`, `selesai`, `batal`) |
| `created_at` | TIMESTAMP DEFAULT NOW() | Waktu pemesanan dibuat |

### D. Tabel `order_items` (Rincian Item Menu per Tiket)
Menghubungkan tiket pesanan dengan hidangan menu yang dipesan.
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | INT AUTO_INCREMENT (PK) | ID unik item |
| `order_id` | VARCHAR(50) (FK) | Berelasi ke `orders.id` |
| `menu_name` | VARCHAR(150) | Nama menu saat transaksi dibuat |
| `price` | DECIMAL(10,2) | Harga satuan menu saat transaksi |
| `qty` | INT | Jumlah porsi dipesan |
| `subtotal` | DECIMAL(10,2) | Subtotal porsi x kuantitas |

### E. Tabel `settings` (Konfigurasi Warung)
Menyimpan parameter operasional toko kuliner.
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | INT PRIMARY KEY | Identifikasi pengaturan tunggal |
| `is_open` | BOOLEAN | Status buka/tutup warung realtime |
| `open_hours` | VARCHAR(100) | Teks jam buka gerai |
| `wa_number` | VARCHAR(25) | Nomor WhatsApp kasir penerima pesanan |
| `packaging_fee` | DECIMAL(10,2) | Tarif standar biaya bungkus/antar |
| `store_address` | TEXT | Alamat fisik gerai resmi |
| `google_maps_url` | TEXT | Tautan navigasi Google Maps |

---

## 📡 3. Spesifikasi Lengkap Endpoint RESTful API

Berikut adalah dokumentasi teknis dari seluruh endpoint API yang disediakan backend:

---

### 1. Autentikasi: Pendaftaran Pelanggan Baru
- **Endpoint**: `POST /api/auth/register`
- **Deskripsi**: Mendaftarkan akun pelanggan baru, memvalidasi nomor telepon unik, dan melakukan sinkronisasi ganda ke MySQL dan file JSON disk.
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Siti Aminah",
    "phone": "081234567890",
    "identifier": "081234567890",
    "password": "PasswordAman2025!"
  }
  ```
- **Response Sukses (`200 OK` / `201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Pendaftaran akun pelanggan berhasil! Selamat bergabung di Juragan Bakso.",
    "user": {
      "id": 3,
      "identifier": "081234567890",
      "name": "Siti Aminah",
      "phone": "081234567890",
      "role": "customer"
    }
  }
  ```
- **Response Error (`409 Conflict`)**:
  ```json
  {
    "success": false,
    "message": "Nomor WhatsApp atau akun tersebut sudah terdaftar! Silakan langsung login."
  }
  ```

---

### 2. Autentikasi: Masuk Akun (Dual-Role Authentication)
- **Endpoint**: `POST /api/auth/login`
- **Deskripsi**: Memverifikasi kredensial pengguna berdasarkan peran (*customer* atau *admin*), memvalidasi kata sandi, memeriksa PIN kasir 6-digit untuk staf admin, serta menormalisasi format nomor telepon secara otomatis.
- **Request Body (Pelanggan)**:
  ```json
  {
    "role": "customer",
    "identifier": "081289004411",
    "password": "MakanBakso2025!"
  }
  ```
- **Request Body (Staf Admin + PIN)**:
  ```json
  {
    "role": "admin",
    "identifier": "admin@baksojuara.com",
    "password": "DapurJuara#Benhil24",
    "pin": "882109"
  }
  ```
- **Response Sukses (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login berhasil sebagai ADMIN",
    "user": {
      "id": 1,
      "identifier": "admin@baksojuara.com",
      "role": "admin",
      "name": "Admin Kasir Shift Pagi",
      "phone": "082299548784",
      "token": "demo-jwt-token-admin-1731168000000"
    }
  }
  ```
- **Response Error (`401 Unauthorized` / `404 Not Found`)**:
  ```json
  {
    "success": false,
    "message": "Kata sandi yang Anda masukkan salah. Silakan periksa kembali."
  }
  ```

---

### 3. Katalog Menu: Ambil Seluruh Menu
- **Endpoint**: `GET /api/menus`
- **Query Parameter (Opsional)**:
  - `category`: Filter slug kategori (`bakso-kuah`, `mie-bihun`, `pelengkap`, `minuman`, `semua`).
- **Response Sukses (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 14,
    "data": [
      {
        "id": 1,
        "name": "Bakso Urat Granat Jumbo",
        "category": "bakso-kuah",
        "category_label": "Bakso Spesial Kuah",
        "price": 32000,
        "stock": 24,
        "description": "Bakso urat sapi kasar super renyah dengan isian cabai rawit pedas dan kuah kaldu gurih rempah kental.",
        "portion_info": "1 Porsi + Kuah Segar",
        "image": "https://...",
        "badge": "Pedas Rawit",
        "badge_type": "secondary",
        "is_available": true
      }
    ]
  }
  ```

---

### 4. Katalog Menu: Tambah Menu Baru (Admin)
- **Endpoint**: `POST /api/menus`
- **Request Body**:
  ```json
  {
    "name": "Bakso Iga Sapi Bakar Madu",
    "category": "bakso-kuah",
    "category_label": "Bakso Spesial Kuah",
    "price": 45000,
    "stock": 20,
    "description": "Iga sapi premium dipanggang dengan olesan madu gurih disajikan bersama kuah bakso panas.",
    "portion_info": "1 Porsi Iga + 3 Bakso Halus",
    "image": "/uploads/iga_bakar-1731168123-456.jpg"
  }
  ```
- **Response Sukses (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Menu berhasil ditambahkan",
    "data": { "id": 15, "name": "Bakso Iga Sapi Bakar Madu", "price": 45000 }
  }
  ```

---

### 5. Katalog Menu: Ubah Informasi Menu & Restock (Admin)
- **Endpoint**: `PUT /api/menus/[id]`
- **Request Body (Mendukung Partial atau Full Update)**:
  ```json
  {
    "name": "Bakso Urat Granat Jumbo",
    "price": 34000,
    "stock": 35,
    "portion_info": "1 Porsi Jumbo + Kuah Pedas",
    "description": "Resep racikan baru rempah lebih nendang."
  }
  ```
- **Response Sukses (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Menu berhasil diperbarui",
    "data": { "id": 1, "stock": 35, "price": 34000 }
  }
  ```

---

### 6. Katalog Menu: Hapus Menu (Admin)
- **Endpoint**: `DELETE /api/menus/[id]`
- **Response Sukses (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Menu berhasil dihapus"
  }
  ```

---

### 7. Transaksi: Ambil Antrean Pesanan Dapur & POS
- **Endpoint**: `GET /api/orders`
- **Query Parameter (Opsional)**:
  - `status`: Filter status (`baru`, `masak`, `siap`, `selesai`, `batal`).
- **Response Sukses (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 4,
    "data": [
      {
        "id": "#BKS-098",
        "customer_name": "Dimas Anggara",
        "customer_phone": "0878-1002-4411",
        "order_type": "takeaway",
        "order_type_label": "Bungkus / Takeaway",
        "order_detail_meta": "Estimasi Diambil: 15 Menit",
        "items": [
          { "name": "Bakso Halus Komplit Tetelan", "price": 35000, "qty": 2 }
        ],
        "notes": "Kuah dipisah sambal banyak",
        "packaging_fee": 2000,
        "total": 72000,
        "payment_method": "Kasir Tunai • Menunggu Scan di Kasir",
        "status": "baru",
        "timestamp": "13:20 WIB"
      }
    ]
  }
  ```

---

### 8. Transaksi: Pembuatan Tiket Pesanan Baru & Pemotongan Stok
- **Endpoint**: `POST /api/orders`
- **Deskripsi**: Menyimpan pesanan dari pelanggan, menerbitkan nomor tiket unik `#BKS-xxx`, memotong stok porsi menu yang dipesan secara otomatis, dan menyinkronkan data ke antrean dapur KDS.
- **Request Body**:
  ```json
  {
    "customer_name": "Rian Hidayat",
    "customer_phone": "081399887766",
    "order_type": "dine-in",
    "order_type_label": "Makan di Tempat - Meja No. 04",
    "order_detail_meta": "Nomor Meja: Meja No. 04",
    "items": [
      { "name": "Bakso Urat Granat Jumbo", "price": 32000, "qty": 2 },
      { "name": "Es Teh Manis Jumbo", "price": 5000, "qty": 2 }
    ],
    "notes": "Kuah kaldu jangan terlalu pedas",
    "packaging_fee": 0,
    "total": 74000,
    "payment_method": "Kasir Tunai • Menunggu Scan di Kasir"
  }
  ```
- **Response Sukses (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Pesanan berhasil dibuat",
    "data": {
      "id": "#BKS-099",
      "total": 74000,
      "status": "baru",
      "timestamp": "14:15 WIB"
    }
  }
  ```

---

### 9. Transaksi: Update Status Dapur & Validasi Pembayaran Tunai Kasir
- **Endpoint**: `PATCH /api/orders/[id]`
- **Deskripsi**: Memperbarui tahapan dapur KDS (`baru` -> `masak` -> `siap` -> `selesai` -> `batal`) atau memvalidasi pembayaran tunai lunas saat barcode tiket pelanggan dipindai di kasir.
- **Request Body**:
  ```json
  {
    "status": "masak",
    "payment_method": "Kasir Tunai • Lunas"
  }
  ```
- **Response Sukses (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Pesanan #BKS-099 berhasil diperbarui",
    "data": {
      "id": "#BKS-099",
      "status": "masak",
      "payment_method": "Kasir Tunai • Lunas"
    }
  }
  ```

---

### 10. Pengaturan: Ambil & Perbarui Status Warung
- **Endpoint**: `GET /api/settings` dan `POST /api/settings`
- **Request Body (`POST`)**:
  ```json
  {
    "is_open": true,
    "open_hours": "10:00 - 21:30 WIB",
    "packaging_fee": 2000
  }
  ```
- **Response Sukses (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Pengaturan toko berhasil diperbarui",
    "data": { "is_open": true, "open_hours": "10:00 - 21:30 WIB" }
  }
  ```

---

### 11. Media: Unggah Berkas Gambar Menu
- **Endpoint**: `POST /api/upload`
- **Request Format**: `multipart/form-data`
- **Form Data Field**: `file` (berkas gambar JPG/PNG/WEBP)
- **Mekanisme Keamanan**:
  - Validasi MIME type & ekstensi: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.svg`.
  - Sanitasi nama berkas: Menghapus karakter berbahaya (*anti-path traversal*).
  - Penamaan berkas unik berbasis timestamp: `${cleanBaseName}-${Date.now()}-${randomExt}`.
  - Berkas disimpan di direktori publik: `/public/uploads/`.
- **Response Sukses (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Foto menu berhasil diunggah",
    "url": "/uploads/bakso_spesial-1731168900-123.jpg",
    "filename": "bakso_spesial-1731168900-123.jpg"
  }
  ```

---

## 🔒 4. Keamanan & Sanitasi Data Backend (Security Implementation)

1. **Anti SQL Injection**: Seluruh interaksi database dieksekusi dengan *Prepared Statements*:
   ```javascript
   const [rows] = await pool.execute('SELECT * FROM users WHERE identifier = ?', [cleanIdentifier]);
   ```
2. **Sanitasi String & Whitespace Trimming**:
   Seluruh input teks (`identifier`, `password`, `name`, `phone`, `pin`) diproses dengan `.trim()` sebelum divalidasi atau disimpan untuk mencegah inkonsistensi spasi pada keyboard ponsel pelanggan.
3. **Pemisahan Jalur Login Berdasarkan Peran (Role Isolation)**:
   - Akses staf kasir ke halaman `/admin` dilindungi oleh middleware auth guard sisi klien dan filter peran sisi backend.
   - Jika pengguna bertipe `customer` mencoba masuk via `/api/auth/login` dengan `role: admin`, server secara eksplisit mengembalikan kode status `403 Forbidden`.
4. **Proteksi Fallback File I/O**:
   Penulisan berkas JSON cadangan (`.orders_fallback.json`, `.menus_fallback.json`, `.users_fallback.json`) dibungkus dalam blok `try...catch` yang terlindungi dari *crash* sistem operasi.

---

## 📈 5. Alur Pemrosesan Tiket Pemesanan (Sequence Diagram)

```text
Pelanggan               Next.js Route Handler            Database Layer (MySQL / Disk)
   │                             │                                   │
   │─── 1. POST /api/orders ────►│                                   │
   │    (Payload Transaksi)      │─── 2. Query Menu & Cek Stok ─────►│
   │                             │◄── 3. Stok Tersedia ──────────────│
   │                             │                                   │
   │                             │─── 4. Kurangi Stok Porsi ────────►│
   │                             │─── 5. Simpan Tiket Transaksi ────►│
   │                             │◄── 6. Konfirmasi Tersimpan ───────│
   │                             │                                   │
   │◄── 7. HTTP 201 Created ─────│                                   │
   │    (No Tiket: #BKS-xxx)     │                                   │
   │                             │                                   │
   │─── 8. Buka WhatsApp API ───►│                                   │
   │    (Kirim Struk ke Kasir)   │                                   │
```

---
*Dokumen ini disusun sebagai spesifikasi teknis resmi backend untuk pengujian perangkat lunak dan penilaian akademik.*
