import { NextResponse } from 'next/server';
import { query, dbFallback, normalizePhone } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const body = await request.json();
    const { role, identifier, password, pin } = body;

    const cleanIdentifier = (identifier || '').trim();
    const cleanPassword = (password || '').trim();
    const cleanPin = (pin || '').trim();

    if (!cleanIdentifier || !cleanPassword) {
      return NextResponse.json(
        { success: false, message: 'Nomor WhatsApp / ID dan kata sandi wajib diisi' },
        { status: 400 }
      );
    }

    let user = null;
    let authError = null;

    // 1. Coba query dari MySQL jika database aktif
    try {
      const normPhone = normalizePhone(cleanIdentifier);
      const dbRes = await query(
        'SELECT id, identifier, password, role, name, phone, pin FROM users WHERE identifier = ? OR phone = ? OR identifier = ? OR phone = ? LIMIT 1',
        [cleanIdentifier, cleanIdentifier, normPhone || cleanIdentifier, normPhone || cleanIdentifier]
      );

      if (dbRes.isMysql && dbRes.rows && dbRes.rows.length > 0) {
        const dbUser = dbRes.rows[0];
        if (dbUser.role !== role) {
          authError = {
            message: `Akun ini terdaftar sebagai ${dbUser.role === 'admin' ? 'Staf Admin' : 'Pelanggan'}, bukan ${role === 'admin' ? 'Admin' : 'Pelanggan'}.`,
            status: 403
          };
        } else if (dbUser.password !== cleanPassword) {
          authError = {
            message: 'Kata sandi yang Anda masukkan salah. Silakan periksa kembali.',
            status: 401
          };
        } else if (role === 'admin' && cleanPin && dbUser.pin && dbUser.pin !== cleanPin) {
          authError = {
            message: 'PIN Kasir tidak sesuai',
            status: 401
          };
        } else {
          user = {
            id: dbUser.id,
            identifier: dbUser.identifier,
            role: dbUser.role,
            name: dbUser.name,
            phone: dbUser.phone
          };
        }
      }
    } catch (dbErr) {
      console.warn('MySQL login query failed, falling back to disk/memory store:', dbErr.message);
    }

    // 2. Fallback disk/memory store jika MySQL offline atau user belum ditemukan di MySQL
    if (!user && !authError) {
      const memUser = dbFallback.findUser(cleanIdentifier);
      if (memUser) {
        if (memUser.role !== role) {
          authError = {
            message: `Akun ini terdaftar sebagai ${memUser.role === 'admin' ? 'Staf Admin' : 'Pelanggan'}, bukan ${role === 'admin' ? 'Admin' : 'Pelanggan'}.`,
            status: 403
          };
        } else if (memUser.password !== cleanPassword) {
          authError = {
            message: 'Kata sandi yang Anda masukkan salah. Silakan periksa kembali.',
            status: 401
          };
        } else if (role === 'admin' && cleanPin && memUser.pin && memUser.pin !== cleanPin) {
          authError = {
            message: 'PIN Kasir tidak sesuai',
            status: 401
          };
        } else {
          user = {
            id: memUser.id,
            identifier: memUser.identifier,
            role: memUser.role,
            name: memUser.name,
            phone: memUser.phone
          };
        }
      } else {
        authError = {
          message: 'Nomor WhatsApp atau akun belum terdaftar. Silakan lakukan pendaftaran akun terlebih dahulu.',
          status: 404
        };
      }
    }

    if (authError && !user) {
      return NextResponse.json(
        { success: false, message: authError.message },
        { status: authError.status || 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Autentikasi gagal. Silakan periksa kembali data Anda.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Login berhasil sebagai ${user.role.toUpperCase()}`,
      user: {
        ...user,
        token: `demo-jwt-token-${user.role}-${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
