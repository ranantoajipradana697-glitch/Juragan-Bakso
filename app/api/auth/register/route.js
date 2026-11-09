import { NextResponse } from 'next/server';
import { query, dbFallback } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone, identifier, password } = body;

    const userIdentifier = (identifier || phone || '').trim();
    const userName = (name || '').trim();
    const userPhone = (phone || identifier || '').trim();
    const userPassword = (password || '').trim();

    if (!userIdentifier || !userPassword || !userName) {
      return NextResponse.json(
        { success: false, message: 'Nama lengkap, nomor WhatsApp/ID, dan kata sandi wajib diisi!' },
        { status: 400 }
      );
    }

    if (userPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Kata sandi minimal 6 karakter demi keamanan akun Anda.' },
        { status: 400 }
      );
    }

    // 1. Cek duplikasi di MySQL jika online
    try {
      const checkRes = await query(
        'SELECT id FROM users WHERE identifier = ? OR phone = ? LIMIT 1',
        [userIdentifier, userPhone]
      );
      if (checkRes.isMysql && checkRes.rows && checkRes.rows.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Nomor WhatsApp atau akun tersebut sudah terdaftar! Silakan langsung login.' },
          { status: 409 }
        );
      }

      if (checkRes.isMysql) {
        const insertRes = await query(
          'INSERT INTO users (identifier, password, role, name, phone) VALUES (?, ?, "customer", ?, ?)',
          [userIdentifier, userPassword, userName, userPhone]
        );
        const newId = insertRes.rows?.insertId || Date.now();
        // Sinkronkan ke disk fallback agar tetap sinkron jika sewaktu-waktu MySQL offline
        dbFallback.registerCustomer({
          identifier: userIdentifier,
          password: userPassword,
          name: userName,
          phone: userPhone
        });
        return NextResponse.json({
          success: true,
          message: 'Pendaftaran akun pelanggan berhasil! Selamat bergabung di Juragan Bakso.',
          user: {
            id: newId,
            identifier: userIdentifier,
            name: userName,
            phone: userPhone,
            role: 'customer'
          }
        });
      }
    } catch (dbErr) {
      console.warn('MySQL register fallback to memoryStore:', dbErr.message);
    }

    // 2. Fallback memory store jika MySQL offline
    const regRes = dbFallback.registerCustomer({
      identifier: userIdentifier,
      password: userPassword,
      name: userName,
      phone: userPhone
    });

    if (!regRes.success) {
      return NextResponse.json(
        { success: false, message: regRes.message },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran akun pelanggan berhasil! Selamat bergabung di Juragan Bakso.',
      user: {
        id: regRes.user.id,
        identifier: regRes.user.identifier,
        name: regRes.user.name,
        phone: regRes.user.phone,
        role: 'customer'
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
