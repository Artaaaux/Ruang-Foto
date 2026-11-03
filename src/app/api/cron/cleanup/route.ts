import { NextResponse } from 'next/server';
import { cleanupExpiredData } from '@/lib/server-store';

export async function GET() {
  const summary = await cleanupExpiredData();
  return NextResponse.json({
    ok: true,
    ...summary,
    cleanedAt: new Date().toISOString(),
  });
}

export async function POST() {
  const summary = await cleanupExpiredData();
  return NextResponse.json({
    ok: true,
    ...summary,
    cleanedAt: new Date().toISOString(),
  });
}
