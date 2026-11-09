import { NextRequest, NextResponse } from 'next/server';
import { createSessionRecord } from '@/lib/server-store';
import {
  checkRateLimit,
  SESSION_COOKIE_NAME,
  verifyAuthToken,
} from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value || '';
    const sessionPayload = sessionCookie
      ? verifyAuthToken(sessionCookie, 'session')
      : null;
    if (!sessionPayload) {
      return NextResponse.json(
        { error: 'Kamu harus masuk terlebih dahulu untuk membuat sesi.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { templateId, hostId, hostName, hostAvatarColor } = body;

    if (!hostId || !hostName) {
      return NextResponse.json(
        { error: 'Kamu harus masuk terlebih dahulu untuk membuat sesi.' },
        { status: 400 }
      );
    }

    if (sessionPayload.sub !== hostId) {
      return NextResponse.json(
        { error: 'Identitas pembuat sesi tidak sesuai dengan akun yang aktif.' },
        { status: 403 }
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
