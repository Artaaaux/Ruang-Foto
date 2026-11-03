import { NextRequest, NextResponse } from 'next/server';
import { createSessionRecord } from '@/lib/server-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateId, hostId, hostName, hostAvatarColor } = body;

    if (!hostId || !hostName) {
      return NextResponse.json(
        { error: 'Kamu harus masuk terlebih dahulu untuk membuat sesi.' },
        { status: 400 }
      );
    }

    const session = await createSessionRecord({
      templateId: templateId || 'retro-klasik',
      hostId,
      hostName,
      hostAvatarColor: hostAvatarColor || '#FFE066',
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Gagal membuat sesi. Silakan muat ulang halaman dan coba lagi.' },
      { status: 500 }
    );
  }
}
