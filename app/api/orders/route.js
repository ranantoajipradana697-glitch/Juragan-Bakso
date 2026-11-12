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
          let formattedTime = 'Baru saja';
          try {
            if (ord.created_at) {
              const d = new Date(ord.created_at);
              if (!isNaN(d.getTime())) {
                formattedTime = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
              }
            }
          } catch (e) {}

          return {
            ...ord,
            price: Number(ord.total),
            total: Number(ord.total),
            packaging_fee: Number(ord.packaging_fee),
            items: itemRes.rows || [],
            timestamp: formattedTime,
            time_ago: 'Tersimpan di DB'
          };
        })
      );
      orders = ordersWithItems;

      // Gabungkan pesanan dari fallback store yang belum ada di MySQL agar data selalu sinkron
      const fallbackOrders = dbFallback.getOrders(status);
      const existingIds = new Set(orders.map(o => String(o.id).toLowerCase()));
      for (const fo of fallbackOrders) {
        if (!existingIds.has(String(fo.id).toLowerCase())) {
          let match = true;
          if (phone) {
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            const oPhone = String(fo.customer_phone || '').replace(/[^0-9]/g, '');
            if (!oPhone.includes(cleanPhone)) match = false;
          }
          if (q) {
            const cleanQ = q.toLowerCase().trim();
            const idMatch = fo.id.toLowerCase().includes(cleanQ);
            const nameMatch = (fo.customer_name || '').toLowerCase().includes(cleanQ);
            const phoneMatch = (fo.customer_phone || '').includes(cleanQ);
            if (!idMatch && !nameMatch && !phoneMatch) match = false;
          }
          if (match) {
            orders.push(fo);
          }
        }
      }

      // Urutkan pesanan terbaru di paling atas berdasarkan nomor ID
      orders.sort((a, b) => {
        const numA = parseInt(String(a.id || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.id || '').replace(/\D/g, ''), 10) || 0;
        return numB - numA;
      });
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

    // Generate order ID unik
    const countRes = await query('SELECT id FROM orders ORDER BY created_at DESC LIMIT 1');
    let orderNum = 91;
    if (countRes.isMysql && countRes.rows && countRes.rows.length > 0) {
      const match = String(countRes.rows[0].id || '').match(/\d+/);
      if (match) {
        orderNum = Math.max(91, parseInt(match[0], 10) + 1);
      }
    }
    const orderId = body.id || `#BKS-${String(orderNum).padStart(3, '0')}`;

    // 1. Selalu simpan ke dbFallback agar instan tersedia di memori kontainer
    const fallbackOrder = dbFallback.addOrder({
      id: orderId,
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

    createdOrder = fallbackOrder;

    // 2. Jika database MySQL aktif, simpan juga secara persisten
    try {
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
          // Kurangi stok & perbarui ketersediaan jika habis
          await query(
            `UPDATE menus 
             SET stock = GREATEST(0, stock - ?),
                 is_available = (GREATEST(0, stock - ?) > 0),
                 badge = IF(GREATEST(0, stock - ?) <= 0, 'Habis / Sold Out', 'Tersedia'),
                 badge_type = IF(GREATEST(0, stock - ?) <= 0, 'error', 'tertiary')
             WHERE TRIM(LOWER(name)) = TRIM(LOWER(?)) OR id = ?`,
            [itemQty, itemQty, itemQty, itemQty, it.name, it.id || 0]
          );
        }
      }
    } catch (dbErr) {
      console.warn('MySQL order insert warning:', dbErr.message);
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
