import { NextResponse } from 'next/server';
import { query, dbFallback } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let menus = [];

    // Query MySQL jika aktif
    let sql = 'SELECT * FROM menus';
    const params = [];
    if (category && category !== 'semua') {
      sql += ' WHERE category = ?';
      params.push(category);
    }
    sql += ' ORDER BY id DESC';

    const dbRes = await query(sql, params);
    if (dbRes.isMysql && dbRes.rows) {
      menus = dbRes.rows.map(m => {
        const stk = Number(m.stock || 0);
        const isAvail = stk > 0 && Boolean(m.is_available);
        return {
          ...m,
          price: Number(m.price),
          stock: stk,
          portion_info: m.portion_info || '1 Porsi + Kuah Segar',
          is_available: isAvail,
          badge: !isAvail ? 'Habis / Sold Out' : (stk <= 5 ? `Menipis (${stk})` : m.badge || 'Tersedia'),
          badge_type: !isAvail ? 'error' : (stk <= 5 ? 'primary' : m.badge_type || 'tertiary')
        };
      });
    } else {
      menus = dbFallback.getMenus(category).map(m => {
        const stk = Number(m.stock || 0);
        const isAvail = stk > 0 && Boolean(m.is_available);
        return {
          ...m,
          stock: stk,
          is_available: isAvail,
          badge: !isAvail ? 'Habis / Sold Out' : (stk <= 5 ? `Menipis (${stk})` : m.badge || 'Tersedia'),
          badge_type: !isAvail ? 'error' : (stk <= 5 ? 'primary' : m.badge_type || 'tertiary')
        };
      });
    }

    return NextResponse.json({
      success: true,
      source: dbRes.isMysql ? 'mysql' : 'fallback-memory',
      data: menus
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
    const { name, category, category_label, price, stock, description, portion_info, image } = body;

    if (!name || price === undefined || stock === undefined) {
      return NextResponse.json(
        { success: false, message: 'Nama, harga, dan stok wajib diisi' },
        { status: 400 }
      );
    }

    const priceNum = Number(price);
    const stockNum = Number(stock);
    const isAvailable = stockNum > 0;
    const badge = isAvailable ? 'Tersedia' : 'Habis';
    const badgeType = isAvailable ? 'tertiary' : 'error';
    const cat = category || 'bakso-kuah';
    const catLabel = category_label || 'Bakso Spesial Kuah';
    const desc = description || '';
    const portionInfo = portion_info || '1 Porsi + Kuah Segar';
    const img = image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlG5IThUnnsSf04s_nGZ3NIaMijcFR5xv7_lkwzZzTHrCj54HFlTkPf00D2t6xMUQwcg2X3cqYqvQCazO6GfNPR9_mGETsb30QtoTNqUbnQxPqv7CAujR58Z5Np9rr4I8KfcacABLR7umeiAAGbgknPFY4jvrzvFOqyPRhEsQvnuX5IP25Gc8xO3bXm4CLJFae9IG1KlP2uBa2xSFqMW0od7EitdfjwY3NDPo5-vI';

    let dbRes = null;
    try {
      dbRes = await query(
        `INSERT INTO menus (name, category, category_label, price, stock, description, portion_info, image, badge, badge_type, is_available)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, cat, catLabel, priceNum, stockNum, desc, portionInfo, img, badge, badgeType, isAvailable]
      );
    } catch (err) {
      // Fallback jika database MySQL fisik belum memiliki kolom portion_info
      dbRes = await query(
        `INSERT INTO menus (name, category, category_label, price, stock, description, image, badge, badge_type, is_available)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, cat, catLabel, priceNum, stockNum, desc, img, badge, badgeType, isAvailable]
      );
    }

    let createdMenu = null;
    if (dbRes.isMysql && dbRes.rows) {
      createdMenu = {
        id: dbRes.rows.insertId,
        name,
        category: cat,
        category_label: catLabel,
        price: priceNum,
        stock: stockNum,
        description: desc,
        portion_info: portionInfo,
        image: img,
        badge,
        badge_type: badgeType,
        is_available: isAvailable
      };
    } else {
      createdMenu = dbFallback.addMenu({
        name,
        category: cat,
        category_label: catLabel,
        price: priceNum,
        stock: stockNum,
        description: desc,
        portion_info: portionInfo,
        image: img
      });
    }

    return NextResponse.json({
      success: true,
      message: `Menu "${name}" berhasil ditambahkan`,
      data: createdMenu
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
