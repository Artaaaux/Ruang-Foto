import { NextRequest, NextResponse } from 'next/server';
import { createSessionRecord } from '@/lib/server-store';
import { checkRateLimit } from '@/lib/resend';

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

    const rl = checkRateLimit(`createsession:${hostId}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak membuat sesi. Silakan coba lagi dalam ${rl.retryAfterSec} detik.`,
        },
        { status: 429 }
      );
    }

    const session = await createSessionRecord({
      templateId: templateId || 'retro-klasik',
      hostId,
      hostName,
      hostAvatarColor: hostAvatarColor || '#FFE066',
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.startsWith('QUOTA_EXCEEDED:')) {
      return NextResponse.json(
        { error: msg.replace('QUOTA_EXCEEDED:', '') },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: 'Gagal membuat sesi. Silakan muat ulang halaman dan coba lagi.' },
      { status: 500 }
    );
  }
}
