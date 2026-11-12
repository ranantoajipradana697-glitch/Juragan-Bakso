import { NextResponse } from 'next/server';
import { query, dbFallback } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
  try {
    const rawId = decodeURIComponent(params.id || '');
    const cleanId = rawId.trim();
    const withHash = cleanId.startsWith('#') ? cleanId : `#${cleanId}`;
    const withoutHash = cleanId.replace(/^#/, '');

    let order = null;
    const dbRes = await query('SELECT * FROM orders WHERE id = ? OR id = ? LIMIT 1', [withHash, withoutHash]);
    if (dbRes.isMysql && dbRes.rows && dbRes.rows.length > 0) {
      order = dbRes.rows[0];
      const itemRes = await query('SELECT menu_name as name, price, qty, subtotal FROM order_items WHERE order_id = ? OR order_id = ?', [withHash, withoutHash]);
      order.items = itemRes.rows || [];
    } else {
      const orders = dbFallback.getOrders();
      order = orders.find(o => 
        o.id.toLowerCase() === cleanId.toLowerCase() || 
        o.id.replace('#', '').toLowerCase() === withoutHash.toLowerCase()
      );
    }

    if (!order) {
      return NextResponse.json({ success: false, message: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, payment_method } = body;

    const validStatuses = ['baru', 'masak', 'siap', 'selesai', 'batal'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Status tidak valid' },
        { status: 400 }
      );
    }

    const orderId = decodeURIComponent(id || '');
    const withHash = orderId.startsWith('#') ? orderId : `#${orderId}`;
    const withoutHash = orderId.replace(/^#/, '');

    if (payment_method && status) {
      await query(
        'UPDATE orders SET status = ?, payment_method = ? WHERE id = ? OR id = ?',
        [status, payment_method, withHash, withoutHash]
      );
    } else if (status) {
      await query(
        'UPDATE orders SET status = ? WHERE id = ? OR id = ?',
        [status, withHash, withoutHash]
      );
    } else if (payment_method) {
      await query(
        'UPDATE orders SET payment_method = ? WHERE id = ? OR id = ?',
        [payment_method, withHash, withoutHash]
      );
    }

    // Jika status pesanan diubah ke 'selesai', pastikan semua menu dengan stok 0 terupdate jadi Sold Out di MySQL
    if (status === 'selesai') {
      try {
        await query(
          `UPDATE menus 
           SET is_available = FALSE, 
               badge = 'Habis / Sold Out', 
               badge_type = 'error' 
           WHERE stock <= 0`
        );
      } catch (e) {}
    }

    // Jika status pesanan dibatalkan (batal), kembalikan kuantitas stok menu di MySQL
    if (status === 'batal') {
      try {
        const itemRows = await query(
          'SELECT menu_name, qty FROM order_items WHERE order_id = ? OR order_id = ?',
          [withHash, withoutHash]
        );
        if (itemRows.isMysql && itemRows.rows) {
          for (const it of itemRows.rows) {
            const qty = Number(it.qty || 1);
            await query(
              `UPDATE menus 
               SET stock = stock + ?,
                   is_available = TRUE,
                   badge = IF(stock + ? <= 5, CONCAT('Menipis (', stock + ?, ')'), 'Tersedia'),
                   badge_type = IF(stock + ? <= 5, 'primary', 'tertiary')
               WHERE TRIM(LOWER(name)) = TRIM(LOWER(?))`,
              [qty, qty, qty, qty, it.menu_name]
            );
          }
        }
      } catch (e) {}
    }

    const updated = dbFallback.updateOrderStatus(orderId, status, payment_method);

    return NextResponse.json({
      success: true,
      message: `Pesanan ${orderId} berhasil diperbarui`,
      data: updated
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
