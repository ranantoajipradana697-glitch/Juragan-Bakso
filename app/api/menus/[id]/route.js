import { NextResponse } from 'next/server';
import { query, dbFallback } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const menuId = Number(id);
    if (!menuId) {
      return NextResponse.json({ success: false, message: 'ID menu tidak valid' }, { status: 400 });
    }

    const priceNum = body.price !== undefined ? Number(body.price) : undefined;
    const stockNum = body.stock !== undefined ? Number(body.stock) : undefined;
    const isAvailable = stockNum !== undefined ? stockNum > 0 : undefined;
    const badge = isAvailable !== undefined 
      ? (isAvailable ? (stockNum <= 5 ? `Menipis (${stockNum})` : 'Tersedia') : 'Habis / Sold Out')
      : undefined;
    const badgeType = isAvailable !== undefined 
      ? (isAvailable ? (stockNum <= 5 ? 'primary' : 'tertiary') : 'error')
      : undefined;

    // Coba update MySQL
    let dbRes = null;
    try {
      dbRes = await query(
        `UPDATE menus 
         SET name = COALESCE(?, name),
             category = COALESCE(?, category),
             category_label = COALESCE(?, category_label),
             price = COALESCE(?, price),
             stock = COALESCE(?, stock),
             description = COALESCE(?, description),
             portion_info = COALESCE(?, portion_info),
             image = COALESCE(?, image),
             badge = COALESCE(?, badge),
             badge_type = COALESCE(?, badge_type),
             is_available = COALESCE(?, is_available)
         WHERE id = ?`,
        [
          body.name || null,
          body.category || null,
          body.category_label || null,
          priceNum !== undefined ? priceNum : null,
          stockNum !== undefined ? stockNum : null,
          body.description || null,
          body.portion_info || null,
          body.image || null,
          badge || null,
          badgeType || null,
          isAvailable !== undefined ? isAvailable : null,
          menuId
        ]
      );
    } catch (e) {
      // Fallback jika MySQL belum memiliki kolom portion_info
      dbRes = await query(
        `UPDATE menus 
         SET name = COALESCE(?, name),
             category = COALESCE(?, category),
             category_label = COALESCE(?, category_label),
             price = COALESCE(?, price),
             stock = COALESCE(?, stock),
             description = COALESCE(?, description),
             image = COALESCE(?, image),
             badge = COALESCE(?, badge),
             badge_type = COALESCE(?, badge_type),
             is_available = COALESCE(?, is_available)
         WHERE id = ?`,
        [
          body.name || null,
          body.category || null,
          body.category_label || null,
          priceNum !== undefined ? priceNum : null,
          stockNum !== undefined ? stockNum : null,
          body.description || null,
          body.image || null,
          badge || null,
          badgeType || null,
          isAvailable !== undefined ? isAvailable : null,
          menuId
        ]
      );
    }

    let updated = null;
    if (dbRes.isMysql) {
      const getRes = await query('SELECT * FROM menus WHERE id = ?', [menuId]);
      if (getRes.rows && getRes.rows.length > 0) {
        updated = getRes.rows[0];
      }
      dbFallback.updateMenu(menuId, body);
    } else {
      updated = dbFallback.updateMenu(menuId, body);
    }

    return NextResponse.json({
      success: true,
      message: `Menu #${menuId} berhasil diperbarui`,
      data: updated
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const menuId = Number(id);

    if (!menuId) {
      return NextResponse.json({ success: false, message: 'ID menu tidak valid' }, { status: 400 });
    }

    await query('DELETE FROM menus WHERE id = ?', [menuId]);
    dbFallback.deleteMenu(menuId);

    return NextResponse.json({
      success: true,
      message: `Menu #${menuId} berhasil dihapus dari sistem`
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
