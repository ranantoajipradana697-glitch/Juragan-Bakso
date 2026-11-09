import { NextResponse } from 'next/server';
import { query, dbFallback } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const phone = searchParams.get('phone');
    const q = searchParams.get('q');

    let orders = [];

    let sql = 'SELECT * FROM orders';
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (phone) {
      conditions.push('customer_phone LIKE ?');
      params.push(`%${phone}%`);
    }

    if (q) {
      conditions.push('(id LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY created_at DESC';

    const dbRes = await query(sql, params);
    if (dbRes.isMysql && dbRes.rows) {
      // Ambil items untuk setiap order
      const ordersWithItems = await Promise.all(
        dbRes.rows.map(async (ord) => {
          const itemRes = await query(
            'SELECT menu_name as name, price, qty, subtotal FROM order_items WHERE order_id = ?',
            [ord.id]
          );
          return {
            ...ord,
            price: Number(ord.total),
            total: Number(ord.total),
            packaging_fee: Number(ord.packaging_fee),
            items: itemRes.rows || [],
            timestamp: new Date(ord.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
            time_ago: 'Tersimpan di DB'
          };
        })
      );
      orders = ordersWithItems;
    } else {
      orders = dbFallback.getOrders(status);

      // Filter fallback jika ada phone atau query q
      if (phone) {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        orders = orders.filter(o => {
          const oPhone = String(o.customer_phone || '').replace(/[^0-9]/g, '');
          return oPhone.includes(cleanPhone);
        });
      }

      if (q) {
        const cleanQ = q.toLowerCase().trim();
        orders = orders.filter(o => {
          const idMatch = o.id.toLowerCase().includes(cleanQ);
          const nameMatch = (o.customer_name || '').toLowerCase().includes(cleanQ);
          const phoneMatch = (o.customer_phone || '').includes(cleanQ);
          return idMatch || nameMatch || phoneMatch;
        });
      }
    }

    return NextResponse.json({
      success: true,
      source: dbRes.isMysql ? 'mysql' : 'fallback-memory',
      data: orders
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
    const customer_name = body.customer_name || 'Pelanggan Tamu';
    const customer_phone = body.customer_phone || '-';
    const order_type = body.order_type || 'dine-in';
    const order_type_label = body.order_type_label || (order_type === 'takeaway' ? 'Bungkus' : order_type === 'delivery' ? 'Pesan Antar' : 'Makan di Tempat');
    const order_detail_meta = body.order_detail_meta || body.table_or_address || '-';
    const notes = body.notes || '-';
    const packaging_fee = Number(body.packaging_fee ?? body.tax_or_fee ?? 0);
    const total = Number(body.total || 0);
    const payment_method = body.payment_method || 'Kasir / QRIS';
    const items = body.items || [];

    if (!customer_name || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Nama pemesan dan minimal 1 item pesanan wajib diisi' },
        { status: 400 }
      );
    }

    let createdOrder = null;

    // Coba simpan ke MySQL jika online
    const countRes = await query('SELECT COUNT(*) as cnt FROM orders');
    const orderCount = (countRes.rows && countRes.rows[0]?.cnt ? Number(countRes.rows[0].cnt) : 0) + 91;
    const orderId = `#BKS-${String(orderCount).padStart(3, '0')}`;

    const insertOrderRes = await query(
      `INSERT INTO orders (id, customer_name, customer_phone, order_type, order_type_label, order_detail_meta, notes, packaging_fee, total, payment_method, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'baru')`,
      [
        orderId,
        customer_name,
        customer_phone,
        order_type,
        order_type_label,
        order_detail_meta,
        notes,
        packaging_fee,
        total,
        payment_method
      ]
    );

    if (insertOrderRes.isMysql) {
      // Simpan order items & update stok di MySQL
      for (const it of items) {
        const itemPrice = Number(it.price) || 0;
        const itemQty = Number(it.qty) || 1;
        await query(
          `INSERT INTO order_items (order_id, menu_name, price, qty, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, it.name, itemPrice, itemQty, itemPrice * itemQty]
        );
        // Kurangi stok
        await query(
          `UPDATE menus SET stock = GREATEST(0, stock - ?) WHERE name = ?`,
          [itemQty, it.name]
        );
      }

      createdOrder = {
        id: orderId,
        customer_name,
        customer_phone,
        order_type,
        order_type_label,
        order_detail_meta,
        notes,
        packaging_fee: Number(packaging_fee) || 0,
        total: Number(total) || 0,
        items,
        status: 'baru',
        timestamp: 'Baru saja'
      };
    } else {
      createdOrder = dbFallback.addOrder({
        customer_name,
        customer_phone,
        order_type,
        order_type_label,
        order_detail_meta,
        notes,
        packaging_fee,
        total,
        payment_method,
        items
      });
    }

    return NextResponse.json({
      success: true,
      message: `Pesanan ${createdOrder.id} berhasil dicatat`,
      data: createdOrder
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
