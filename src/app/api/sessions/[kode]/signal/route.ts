import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionByCode,
  getSignalsSince,
  pushSignalMessage,
} from '@/lib/server-store';
import { SESSION_COOKIE_NAME, verifyAuthToken } from '@/lib/resend';

function getAuthenticatedUserId(req: NextRequest): string | null {
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value || '';
  if (!sessionCookie) return null;
  const payload = verifyAuthToken(sessionCookie, 'session');
  return payload?.sub || null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ kode: string }> }
) {
  const callerId = getAuthenticatedUserId(req);
  if (!callerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { kode } = await context.params;
  const { searchParams } = new URL(req.url);
  const since = Number(searchParams.get('since') || '0');
  const excludeSenderId = searchParams.get('exclude') || undefined;

  const signals = await getSignalsSince(kode, since, excludeSenderId);
  return NextResponse.json({ signals, serverTime: Date.now() });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ kode: string }> }
) {
  const callerId = getAuthenticatedUserId(req);
  if (!callerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { kode } = await context.params;
  const session = await getSessionByCode(kode);
  if (
    session &&
    callerId !== session.hostId &&
    callerId !== session.guestId
  ) {
    return NextResponse.json(
      { error: 'Kamu bukan peserta sesi ini.' },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { id, senderId, senderRole, type, payload } = body;

  if (!senderId || !type) {
    return NextResponse.json(
      { error: 'Parameter sinyal tidak lengkap.' },
      { status: 400 }
    );
  }

  const msg = await pushSignalMessage({
    id: typeof id === 'string' ? id : undefined,
    sessionCode: kode,
    senderId,
    senderRole: senderRole || 'host',
    type,
    payload: payload || {},
  });

  return NextResponse.json({ signal: msg, serverTime: Date.now() });
}
