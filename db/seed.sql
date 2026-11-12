-- Seed Data: Juragan Bakso Platform
USE `juragan_bakso_db`;

-- 1. Insert Default Users
INSERT INTO `users` (`identifier`, `password`, `role`, `name`, `phone`, `pin`)
VALUES
  ('admin@baksojuara.com', 'DapurJuara#Benhil24', 'admin', 'Admin Kasir Shift Pagi', '082299548784', '882109'),
  ('081289004411', 'MakanBakso2025!', 'customer', 'Budi Santoso', '081289004411', NULL),
  ('081275516335', '123456', 'customer', 'Fatih', '081275516335', NULL),
  ('0812345678', '123456', 'customer', 'aji', '0812345678', NULL)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 2. Insert Default Settings
INSERT INTO `settings` (`id`, `is_open`, `open_hours`, `wa_number`, `packaging_fee`, `store_address`)
VALUES (
  1,
  TRUE,
  '10:00 - 21:30 WIB',
  '6282299548784',
  2000.00,
  'Jl. Malaka Baru 1, Jl. Raya BKT Bojong Rangkong No. 039, RT.5/RW.11, Pondok Kopi, Duren Sawit, Jakarta Timur 13460'
)
ON DUPLICATE KEY UPDATE `open_hours` = VALUES(`open_hours`);

-- 3. Insert Default Menus
INSERT INTO `menus` (`id`, `name`, `category`, `category_label`, `price`, `stock`, `description`, `portion_info`, `image`, `badge`, `badge_type`, `is_available`)
VALUES
  (1, 'Bakso Urat Granat Jumbo', 'bakso-kuah', 'Bakso Spesial Kuah', 32000.00, 24, 'Bakso urat sapi kasar super renyah dengan isian cabai rawit pedas dan kuah kaldu gurih rempah kental.', '1 Porsi + Kuah Segar', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlG5IThUnnsSf04s_nGZ3NIaMijcFR5xv7_lkwzZzTHrCj54HFlTkPf00D2t6xMUQwcg2X3cqYqvQCazO6GfNPR9_mGETsb30QtoTNqUbnQxPqv7CAujR58Z5Np9rr4I8KfcacABLR7umeiAAGbgknPFY4jvrzvFOqyPRhEsQvnuX5IP25Gc8xO3bXm4CLJFae9IG1KlP2uBa2xSFqMW0od7EitdfjwY3NDPo5-vI', 'Pedas Rawit', 'secondary', TRUE),
  (2, 'Bakso Halus Komplit Tetelan', 'bakso-kuah', 'Bakso Spesial Kuah', 35000.00, 18, '5 butir bakso halus lembut kenyal, 1 tahu bakso lembut, dan limpahan tetelan sapi gurih berkaldu.', '1 Porsi Komplit + Kuah', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbDeCyDnVOL2BBmoItdgN1cMQBMddSg4m0PtkMZob5JkXQnLM-n_ayf6h57yY09pB3_qiCRAEeft26JGjE0K6zLnWi43vaHx_7kqWx1vnFyflOFb53XEo0H8j5pbSy6GZhlOOcS05UY7SDHze5dsIO4ye8wgvUGPz9LAjGiQw9jbr-cVpQipUAj0s2TZ7BEpkq-r5jT942-1ekc8KSQt4gULNgH9Drjg9qCEVnNh4', 'Favorit Keluarga', 'primary', TRUE),
  (3, 'Bakso Telur Puyuh & Jamur', 'bakso-kuah', 'Bakso Spesial Kuah', 28000.00, 15, 'Kombinasi bakso isi 3 butir telur puyuh gurih dan irisan jamur kuping kenyal dengan kuah bening kaldu rempah.', '1 Porsi + Kuah Kaldu', 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2bMAqanLrzT4BAK249I0BpdJJrZYcP4hH9S-qr_17w5aHLPtLHdKzUmsTzzPgahZJNQ-yNJRGlBvJ5hsSE5iVd178hbTdjZAWRBxGyIYgWHGyhM4ehKd3zP5LY4-GVrUcapi63ufDRwT5t8yeDZN_Nq2O3bzFlsZJUoZI2U52Ix0vaePe_b795ygmfpe4D2lfys200R5KU9XEB0agYS5k502pdQTVIlYnrIgkgOU', 'Gurih Alami', 'tertiary', TRUE),
  (4, 'Mie Ayam Bakso Pangsit', 'mie-bihun', 'Mie & Bihun Bakso', 25000.00, 30, 'Mie kenyal racikan bumbu khas, cacahan ayam kecap manis gurih, sawi hijau segar, pangsit goreng, dan 2 butir bakso sapi.', '1 Porsi Mie + Kuah Pisah', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxc7d7tBOtzjnPh99GRQ9a5MN8vGVspP-exgrD4sA9ShaoR6l5AVQzx3U8A1JOa8oxFauHHivzGDoKLvtj5QBneUxog15dUcVXaPhVXvd-2-J84MQUxGoulpNvoiGencOD8yd_OK0KukUqZgn6tHk82aIEcl0eMcD8ySHwg52rIUWDeQuYQhoQwdquc0EKFY1kIhU-CMVqx3MhNmtneMQNBTaKOnmsABhE1ZhJX4M', 'Termasuk Kuah', 'neutral', TRUE),
  (5, 'Tetelan Sapi Gurih Tambahan', 'pelengkap', 'Pelengkap & Gorengan', 12000.00, 2, 'Porsi ekstra potongan tetelan daging dan urat lembut yang direbus empuk dalam rempah kuah kaldu.', '1 Mangkok Porsi Ekstra', 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2sXN-1rY3oM0juJ7WC76IYaozqHe71ojK0SpDNSXNaoFUoGaZvLGzvyoCP7QyCdHcpDbcIfu6RFkRYOb2701jGSt7LkMFgYTTnPVlSua9_3aZi-D-TsIy699kxBL8wr4Z80J_OlNz13QIh-sQvT4l06y4Psy9Dg8htnUAN3Mp_GxqydDfJRRqd0ycu8uYyhYqeZHrnpfPe6x65ErmGgvFzVucZeK6x76PktnxDew', 'Stok Terbatas: 2', 'error', TRUE),
  (6, 'Pangsit Goreng Renyah (Isi 3)', 'pelengkap', 'Pelengkap & Gorengan', 8000.00, 45, 'Kulit pangsit krispi mekar digoreng dadakan dengan isian adonan ayam-udang gurih di bagian tengah.', '1 Porsi (Isi 3 Pcs)', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd-6mbhB99waNRTqJYZKIRQ_1MXhZCxhIbmWin5-gnXHbidaMUxV1ceDn0Aj_S9Cz4qiq9QE_VzTj6GSK8cUWvDdzLMF4-PF84RQy_HolUP2iB3AQc_2mWFs7l4eRV-YTv8YuOCmwP2oEgtfLyYqqtB-vRP-uP6y9RIls3J7yCMoPCBBAmQFTfJApb1ATiqbqHHJuaXk6XthHSaFjQMNk2ZObNP_rQxPXXDNKYQvc', 'Ekstra Renyah', 'neutral', TRUE),
  (7, 'Es Campur Durian Asli', 'minuman', 'Minuman Segar Dingin', 18000.00, 0, 'Es serut melimpah dengan legitnya daging buah durian asli Medan, kelapa muda, alpukat mentega, dan sirup cocopandan.', '1 Mangkok Es Serut Durian', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3bauJM3uwpbPN2aw5kL18GaX_4Xif9c4Co1Z5GHu6z_xm6tODvur1mjR8aIxIdAy19sxgaeaBoFYt3FVMXvlXuxYPHKeHl9XJ4LVsIXL-JVoVBOiYWOU3e_xdfZWJAHzvTk5JzTYNWbrpTdFnVkWtkvkEUynHs5Ljo8GBpK-3eTdGOvCryqWjT2NKqyBWBIPoVqEp5PqdJopxwB-kg3PkznMDQJlmtw1u0yc4XC0', 'Habis / Sold Out', 'error', FALSE),
  (8, 'Es Teh Manis Jumbo', 'minuman', 'Minuman Segar Dingin', 5000.00, 99, 'Seduhan teh melati wangi khas Jawa disajikan dalam gelas porsi jumbo 500ml dingin penyegar dahaga.', '1 Gelas Jumbo 500ml', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuq5sYJ1Jl8aL53dNvvDKPGZgdGF6XCbuGgpQqPVFRfLrco6xgZuX6gQX8-ohstFQDhmHpAkC2MrfgH9LlLivU4dfEXk7-jQEOedaRqcKpFW_hFPh7LxVbv8_JI2quq_lmtd8H7TVMKg2krkxH5IcgiQD0zRUAL0miQ8r-Aj0DofmKd5-a8pm8d8G06No4uD2tIciavsAYztNwC1Fqhf1YTBcNNCJKKj6I7Xd7ZJI', 'Gelas Besar', 'neutral', TRUE)
ON DUPLICATE KEY UPDATE `price` = VALUES(`price`), `stock` = VALUES(`stock`);

-- 4. Insert Default Sample Orders
INSERT INTO `orders` (`id`, `customer_name`, `customer_phone`, `order_type`, `order_type_label`, `order_detail_meta`, `notes`, `packaging_fee`, `total`, `payment_method`, `status`, `created_at`)
VALUES
  ('#BKS-092', 'Fatih', '081275516335', 'dine-in', 'Makan di Tempat - Meja 05', 'Nomor Meja: Meja 05', '-', 0.00, 180000.00, 'QRIS Instan (AJI STORE)', 'baru', NOW() - INTERVAL 1 MINUTE),
  ('#BKS-091', 'aji', '0812345678', 'dine-in', 'Makan di Tempat - Meja 08', 'Nomor Meja: Meja 08', 'Porsi Kuli', 0.00, 73000.00, 'QRIS Instan (AJI STORE)', 'selesai', NOW() - INTERVAL 2 MINUTE),
  ('#BKS-089', 'Pak Budi Santoso', '0812-9988-1029', 'dine-in', 'Makan di Tempat - Meja 04', 'Nomor Meja: Meja 04', 'Bakso urat kuah pedas level 3, jangan pakai seledri', 0.00, 114000.00, 'QRIS • Lunas', 'baru', NOW() - INTERVAL 10 MINUTE),
  ('#BKS-090', 'Ibu Ratna Dewi', '0856-7711-2099', 'delivery', 'Pesan Antar - Kurir Instan', 'Jl. Malaka Baru No. 10 (Pagar Putih)', 'Sambal dipisah 3 bungkus, kuah panas', 2000.00, 54000.00, 'COD Kurir', 'baru', NOW() - INTERVAL 15 MINUTE),
  ('#BKS-088', 'Dimas Anggara', '0878-1002-4411', 'takeaway', 'Bungkus / Takeaway', 'Estimasi Diambil: 15 Menit', 'Kecap manis dipisah', 2000.00, 117000.00, 'Transfer • Lunas', 'masak', NOW() - INTERVAL 20 MINUTE),
  ('#BKS-087', 'Siti Rahmah', '0813-2223-8877', 'dine-in', 'Makan di Tempat - Meja 08', 'Nomor Meja: Meja 08', 'Kering tanpa kuah, sambal banyak', 0.00, 64000.00, 'Kasir Tunai • Lunas', 'siap', NOW() - INTERVAL 25 MINUTE),
  ('#BKS-086', 'Hendra Kurnia', '0811-4567-9900', 'dine-in', 'Makan di Tempat - Meja 02', 'Nomor Meja: Meja 02', '-', 0.00, 40000.00, 'QRIS • Selesai', 'selesai', NOW() - INTERVAL 35 MINUTE)
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- 5. Insert Order Items for Sample Orders
INSERT INTO `order_items` (`order_id`, `menu_id`, `menu_name`, `price`, `qty`, `subtotal`)
VALUES
  ('#BKS-092', 7, 'Es Campur Durian Asli', 18000.00, 10, 180000.00),
  ('#BKS-091', 6, 'Pangsit Goreng Renyah (Isi 3)', 8000.00, 1, 8000.00),
  ('#BKS-091', 4, 'Mie Ayam Bakso Pangsit', 25000.00, 2, 50000.00),
  ('#BKS-091', 8, 'Es Teh Manis Jumbo', 5000.00, 3, 15000.00),
  ('#BKS-089', 1, 'Bakso Urat Granat Jumbo', 32000.00, 2, 64000.00),
  ('#BKS-089', 2, 'Bakso Halus Komplit Tetelan', 35000.00, 1, 35000.00),
  ('#BKS-089', 8, 'Es Teh Manis Jumbo', 5000.00, 3, 15000.00),
  ('#BKS-090', 1, 'Bakso Urat Granat Jumbo', 32000.00, 1, 32000.00),
  ('#BKS-090', 5, 'Tetelan Sapi Gurih Tambahan', 12000.00, 1, 12000.00),
  ('#BKS-090', 6, 'Pangsit Goreng Renyah (Isi 3)', 8000.00, 1, 8000.00),
  ('#BKS-088', 2, 'Bakso Halus Komplit Tetelan', 35000.00, 3, 105000.00),
  ('#BKS-088', 8, 'Es Teh Manis Jumbo', 5000.00, 2, 10000.00),
  ('#BKS-087', 1, 'Bakso Urat Granat Jumbo', 32000.00, 2, 64000.00),
  ('#BKS-086', 2, 'Bakso Halus Komplit Tetelan', 35000.00, 1, 35000.00),
  ('#BKS-086', 8, 'Es Teh Manis Jumbo', 5000.00, 1, 5000.00);
