-- Database Schema: Juragan Bakso Platform
-- RDBMS: MySQL 8.x / MariaDB
-- Karakteristik: UTF8MB4, InnoDB, Foreign Keys

CREATE DATABASE IF NOT EXISTS `juragan_bakso_db`
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `juragan_bakso_db`;

-- 1. Table Users (Admin & Customer)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `identifier` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Nomor WhatsApp atau Email',
  `password` VARCHAR(255) NOT NULL COMMENT 'Kata Sandi',
  `role` ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(30) NULL,
  `pin` VARCHAR(6) NULL COMMENT 'PIN Kasir (khusus admin)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table Menus (Katalog Makanan & Minuman)
CREATE TABLE IF NOT EXISTS `menus` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `category` VARCHAR(50) NOT NULL COMMENT 'Slug kategori: bakso-kuah, mie-bihun, pelengkap, minuman',
  `category_label` VARCHAR(80) NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `stock` INT NOT NULL DEFAULT 0,
  `description` TEXT NULL,
  `portion_info` VARCHAR(120) NULL DEFAULT '1 Porsi + Kuah Segar' COMMENT 'Keterangan isi porsi / paket yang didapat',
  `image` TEXT NULL,
  `badge` VARCHAR(50) NULL,
  `badge_type` VARCHAR(30) DEFAULT 'neutral',
  `is_available` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table Orders (Antrean Pesanan / KDS Kasir)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(30) PRIMARY KEY COMMENT 'Contoh: #BKS-089',
  `customer_name` VARCHAR(100) NOT NULL,
  `customer_phone` VARCHAR(30) NOT NULL,
  `order_type` ENUM('dine-in', 'takeaway', 'delivery') NOT NULL DEFAULT 'dine-in',
  `order_type_label` VARCHAR(100) NOT NULL,
  `order_detail_meta` TEXT NOT NULL COMMENT 'Nomor meja / estimasi ambil / alamat antar',
  `notes` TEXT NULL COMMENT 'Catatan racikan khusus kuah/pedas',
  `packaging_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(50) DEFAULT 'Kasir / QRIS',
  `status` ENUM('baru', 'masak', 'siap', 'selesai') NOT NULL DEFAULT 'baru',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table Order Items (Rincian Item Pesanan)
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` VARCHAR(30) NOT NULL,
  `menu_id` INT NULL,
  `menu_name` VARCHAR(120) NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `qty` INT NOT NULL DEFAULT 1,
  `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  CONSTRAINT `fk_order_items_orders`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_menus`
    FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table Settings (Pengaturan Warung)
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `is_open` BOOLEAN NOT NULL DEFAULT TRUE,
  `open_hours` VARCHAR(100) DEFAULT '10:00 - 21:30 WIB',
  `wa_number` VARCHAR(30) DEFAULT '6282299548784',
  `packaging_fee` DECIMAL(12, 2) DEFAULT 2000.00,
  `store_address` TEXT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
