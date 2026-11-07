import { NextRequest, NextResponse } from 'next/server';
import { getResultsByUserId } from '@/lib/server-store';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')?.trim() || '';
  if (!userId) {
    return NextResponse.json(
      { error: 'ID pengguna diperlukan untuk memuat daftar hasil foto.' },
      { status: 400 }
    );
  }

  const results = await getResultsByUserId(userId);
  return NextResponse.json({
    results,
    serverTime: Date.now(),
  });
}
