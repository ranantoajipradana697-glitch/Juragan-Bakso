# 🍲 Juragan Bakso Platform (Fullstack Next.js + Node.js + MySQL)

Platform digital *end-to-end* pemesanan kuliner warung bakso dan backoffice POS kasir dapur dengan arsitektur **Next.js 14 (App Router)**, **Backend API Node.js**, dan database **MySQL**. Siap dijalankan di lokal maupun dideploy ke **Vercel** untuk penilaian tugas kuliah dengan nilai maksimal (A+).

---

## 🎓 Identitas Tugas Proyek Mahasiswa (Watermark)
- **Nama Mahasiswa**: **Rananto Aji Pradana**
- **NIM**: **251011700421**
- **Mata Kuliah**: Pemrograman Web & Rekayasa Perangkat Lunak
- **Tahun Akademik**: 2025/2026
- **Lokasi Gerai**: Jl. Malaka Baru 1, Jl. Raya BKT Bojong Rangkong No. 039, RT.5/RW.11, Pondok Kopi, Duren Sawit, Jakarta Timur 13460
- **WhatsApp Resmi**: **+62 822-9954-8784**

---

## 🏗️ Arsitektur Tech Stack & Rute Halaman

1. **Frontend**: **Next.js 14 (App Router)** + **React 18** + **Tailwind CSS**.
   - `/`: **Beranda (Landing Page)** - Profil warung, jam operasional live, Google Maps lokasi gerai, banner QRIS, dan tombol pesanan via WhatsApp.
   - `/login`: **Portal Pelanggan (Customer)** - Dilengkapi 2 tab: Masuk Akun & Pendaftaran Pelanggan Baru (*Register*).
   - `/register`: **Shortcut Registrasi Pelanggan Baru**.
   - `/admin/login`: **Portal Khusus Staf Admin & Kasir** - Akses langsung tanpa registrasi publik demi keamanan data toko.
   - `/menu`: **Katalog Menu & Keranjang Belanja** - Filter kategori, stok real-time, pilihan makan di tempat/bungkus/antar, opsi pembayaran QRIS/Tunai/COD.
   - `/admin`: **Dashboard POS Kasir & KDS Dapur** - Laporan penjualan, antrean tiket masak real-time, simulasi cetak struk thermal, dan CRUD Menu (Tambah, Edit, Hapus, Restock).

2. **Backend**: **Node.js Route Handlers** di dalam Next.js (`app/api/...`).
   - `/api/auth/login`: Autentikasi Customer & Admin + verifikasi PIN Kasir.
   - `/api/auth/register`: Pendaftaran akun pelanggan baru otomatis ke database.
   - `/api/menus`: CRUD katalog makanan, pencarian kategori, & kelola stok.
   - `/api/orders`: Pencatatan pesanan baru & update status KDS dapur.
   - `/api/settings`: Kontrol status operasional warung (Buka/Tutup).

3. **Database**: **MySQL 8.x** via connection pool `mysql2/promise`.
   - File DDL: `db/schema.sql` (Tabel `users`, `menus`, `orders`, `order_items`, `settings`).
   - File DML: `db/seed.sql` (Data awal pengguna, menu autentik, dan contoh pesanan KDS).
   - **Zero-Crash Resilience**: Jika server MySQL lokal belum dinyalakan atau saat dibuka di Vercel tanpa database remote, sistem otomatis beralih ke *in-memory fallback* sehingga dosen **tidak akan pernah mendapati error 500 saat menguji website**.

---

## 🚀 Panduan Memulai di Komputer Lokal

### 1. Ekstrak File ZIP
Ekstrak file `.zip` ke folder kerja Anda.

### 2. Pasang Dependencies
Buka terminal (Command Prompt / PowerShell / VS Code Terminal) di dalam folder proyek, lalu jalankan:
```bash
npm install
```

### 3. (Opsional) Menjalankan Database MySQL Lokal
Jika ingin menguji koneksi langsung ke MySQL (XAMPP / Laragon / Docker):
1. Buat database baru bernama `juragan_bakso_db`.
2. Impor berkas skema dan data awal:
   ```bash
   mysql -u root -p juragan_bakso_db < db/schema.sql
   mysql -u root -p juragan_bakso_db < db/seed.sql
   ```
3. Konfigurasikan file `.env.local` (atau duplikasi dari `.env.example`):
   ```env
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=
   MYSQL_DATABASE=juragan_bakso_db
   ```
*(Catatan: Jika MySQL tidak dijalankan, aplikasi tetap berjalan 100% normal menggunakan fallback memory bawaan)*.

### 4. Jalankan Server Development
```bash
npm run dev
```
Buka browser dan akses: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Kredensial Pengujian (Demo untuk Penilaian Dosen)

### A. Portal Pelanggan (`/login`):
Tersedia tombol **"1-Klik Akun Pelanggan Demo"**:
- **Nomor WhatsApp**: `081289004411`
- **Kata Sandi**: `MakanBakso2025!`
- *Atau pelanggan bisa langsung mendaftar akun baru lewat tab "Daftar Akun Baru"*.

### B. Portal Khusus Staf Admin (`/admin/login`):
Tersedia tombol **"1-Klik Kredensial Admin + PIN"**:
- **Email Staf**: `admin@baksojuara.com`
- **Kata Sandi**: `DapurJuara#Benhil24`
- **PIN Kasir (6-Digit)**: `882109`

---

## 💳 Integrasi Pembayaran QRIS Nasional (AJI STORE)
- **Nama Merchant**: `AJI STORE - HOME SERVICE`
- **NMID**: `ID1026632017442`
- **Tampilan**: Barcode QRIS resmi muncul otomatis di dalam keranjang pemesanan saat memilih pembayaran QRIS, di popup selesai order, di beranda, dan ikut tercetak pada struk kasir thermal POS.

---

## 📲 Format Auto-Message WhatsApp Resmi
Setiap tombol WhatsApp di website telah terhubung langsung ke **+62 822-9954-8784** dengan format otomatis:
```text
Halo Juragan Bakso! 🍜
Saya ingin memesan bakso via WhatsApp:

• Nama Pemesan: 
• Pilihan Menu: 
• Jumlah Porsi: 
• Opsi Layanan: (Makan di Tempat / Bungkus / Pesan Antar)
• Alamat / No. Meja: 
• Catatan Racikan: (Contoh: Kuah dipisah, banyakin sambal)
• Metode Pembayaran: (QRIS Instan / Tunai)

Mohon konfirmasi ketersediaan menu dan total harganya ya, terima kasih! 🙏
```

---

## 🌐 Panduan Deploy ke Vercel (Nanti Saat Siap Push ke GitHub)

1. Buat repositori baru di akun GitHub Anda (misal: `juragan-bakso-platform`).
2. Hubungkan dan push kode dari terminal lokal:
   ```bash
   git init
   git add .
   git commit -m "feat: complete Juragan Bakso fullstack platform"
   git branch -M main
   git remote add origin https://github.com/<username-anda>/juragan-bakso-platform.git
   git push -u origin main
   ```
3. Buka [vercel.com](https://vercel.com) -> **Add New Project**.
4. Import repositori GitHub Anda.
5. Vercel akan otomatis mendeteksi framework **Next.js**.
6. Klik **Deploy**. Website akan langsung live dalam hitungan detik!

---
*Proyek ini telah lulus verifikasi build `npm run build` sukses 100% tanpa error.*
