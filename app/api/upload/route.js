import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, message: 'Tidak ada berkas gambar yang dipilih' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize extension & name
    const originalExt = path.extname(file.name || '').toLowerCase() || '.jpg';
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const safeExt = allowedExts.includes(originalExt) ? originalExt : '.jpg';
    const cleanBaseName = (file.name || 'menu')
      .replace(path.extname(file.name || ''), '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);

    const filename = `${cleanBaseName}-${Date.now()}-${Math.floor(100 + Math.random() * 900)}${safeExt}`;
    
    // Coba simpan ke folder fisik public/uploads jika diizinkan (localhost)
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);

      const publicUrl = `/uploads/${filename}`;
      return NextResponse.json({
        success: true,
        message: 'Foto menu berhasil diunggah',
        url: publicUrl,
        filename: filename
      }, { status: 201 });
    } catch (diskErr) {
      // Fallback untuk Vercel Serverless (Read-only filesystem):
      // Kembalikan gambar sebagai Base64 Data URL teroptimasi langsung
      const mime = safeExt === '.png' ? 'image/png' : safeExt === '.webp' ? 'image/webp' : 'image/jpeg';
      const base64Url = `data:${mime};base64,${buffer.toString('base64')}`;
      return NextResponse.json({
        success: true,
        message: 'Foto menu diproses langsung (Vercel Cloud Mode)',
        url: base64Url,
        filename: filename
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error handling menu image upload:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengunggah foto menu' },
      { status: 500 }
    );
  }
}
