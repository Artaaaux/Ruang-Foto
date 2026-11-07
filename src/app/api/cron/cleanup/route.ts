import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredData } from '@/lib/server-store';

function isAuthorizedCron(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return true;
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  const summary = await cleanupExpiredData(true);
  return NextResponse.json({
    ok: true,
    ...summary,
    cleanedAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  const summary = await cleanupExpiredData(true);
  return NextResponse.json({
    ok: true,
    ...summary,
    cleanedAt: new Date().toISOString(),
  });
}
