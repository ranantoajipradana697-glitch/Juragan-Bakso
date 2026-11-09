import { NextResponse } from 'next/server';
import { query, dbFallback } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
  try {
    const rawId = decodeURIComponent(params.id || '');
    const cleanId = rawId.trim();

    let order = null;
    const dbRes = await query('SELECT * FROM orders WHERE id = ?', [cleanId]);
    if (dbRes.isMysql && dbRes.rows && dbRes.rows.length > 0) {
      order = dbRes.rows[0];
      const itemRes = await query('SELECT menu_name as name, price, qty, subtotal FROM order_items WHERE order_id = ?', [cleanId]);
      order.items = itemRes.rows || [];
    } else {
      const orders = dbFallback.getOrders();
      order = orders.find(o => 
        o.id.toLowerCase() === cleanId.toLowerCase() || 
        o.id.replace('#', '').toLowerCase() === cleanId.replace('#', '').toLowerCase()
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

    const orderId = decodeURIComponent(id);

    if (payment_method && status) {
      await query(
        'UPDATE orders SET status = ?, payment_method = ? WHERE id = ?',
        [status, payment_method, orderId]
      );
    } else if (status) {
      await query(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, orderId]
      );
    } else if (payment_method) {
      await query(
        'UPDATE orders SET payment_method = ? WHERE id = ?',
        [payment_method, orderId]
      );
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
