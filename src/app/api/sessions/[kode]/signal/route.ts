import { NextRequest, NextResponse } from 'next/server';
import { getSignalsSince, pushSignalMessage } from '@/lib/server-store';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ kode: string }> }
) {
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
  const { kode } = await context.params;
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
