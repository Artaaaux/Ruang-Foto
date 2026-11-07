import { NextRequest, NextResponse } from 'next/server';
import { getResultsByUserId, isSafeIdentifier } from '@/lib/server-store';
import {
  checkRateLimit,
  SESSION_COOKIE_NAME,
  verifyAuthToken,
} from '@/lib/resend';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')?.trim() || '';
  if (!userId || !isSafeIdentifier(userId)) {
    return NextResponse.json(
      { error: 'ID pengguna diperlukan untuk memuat daftar hasil foto.' },
      { status: 400 }
    );
  }

  const rl = checkRateLimit(`results_list:${userId}`, 30, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Terlalu banyak permintaan. Coba lagi dalam ${rl.retryAfterSec} detik.` },
      { status: 429 }
    );
  }

  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value || '';
  const sessionPayload = sessionCookie
    ? verifyAuthToken(sessionCookie, 'session')
    : null;
  if (sessionPayload && sessionPayload.sub !== userId) {
    return NextResponse.json(
      { error: 'Tidak memiliki akses ke daftar hasil pengguna lain.' },
      { status: 403 }
    );
  }

  const results = await getResultsByUserId(userId);
  return NextResponse.json({
    results,
    serverTime: Date.now(),
  });
}
