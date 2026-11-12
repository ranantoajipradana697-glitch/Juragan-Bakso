import { NextResponse } from 'next/server';
import { query, dbFallback } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const dbRes = await query('SELECT * FROM settings WHERE id = 1 LIMIT 1');
    let settings = null;
    if (dbRes.isMysql && dbRes.rows && dbRes.rows.length > 0) {
      const s = dbRes.rows[0];
      settings = {
        id: s.id,
        is_open: Boolean(s.is_open),
        open_hours: s.open_hours,
        wa_number: s.wa_number,
        packaging_fee: Number(s.packaging_fee),
        store_address: s.store_address
      };
    } else {
      settings = dbFallback.getSettings();
    }

    return NextResponse.json({
      success: true,
      source: dbRes.isMysql ? 'mysql' : 'fallback-memory',
      data: settings
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    let currentIsOpen = Boolean(dbFallback.getSettings().is_open);
    const dbRes = await query('SELECT is_open FROM settings WHERE id = 1 LIMIT 1');
    if (dbRes.isMysql && dbRes.rows && dbRes.rows.length > 0) {
      currentIsOpen = Boolean(dbRes.rows[0].is_open);
    }

    const newStatus = body.is_open !== undefined ? Boolean(body.is_open) : !currentIsOpen;

    await query('UPDATE settings SET is_open = ? WHERE id = 1', [newStatus]);
    const updated = dbFallback.updateSettings({ is_open: newStatus });

    return NextResponse.json({
      success: true,
      message: `Status warung diubah menjadi: ${newStatus ? 'Buka' : 'Tutup'}`,
      data: { ...updated, is_open: newStatus }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
