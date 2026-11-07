import { NextRequest, NextResponse } from 'next/server';
import {
  deleteResultEarly,
  getResultById,
  isSafeIdentifier,
  isValidImageDataUrl,
  MAX_COMPOSITE_IMAGE_BYTES,
  saveResultComposite,
} from '@/lib/server-store';
import {
  checkRateLimit,
  SESSION_COOKIE_NAME,
  verifyAuthToken,
} from '@/lib/resend';
import { PhotoboothResult } from '@/lib/types';

function getClientRateKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionCookie) return sessionCookie.slice(-16);
  return 'local-client';
}

function isResultParticipant(
  req: NextRequest,
  result: PhotoboothResult
): boolean {
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value || '';
  if (!sessionCookie) return true;
  const payload = verifyAuthToken(sessionCookie, 'session');
  if (!payload) return true;
  return payload.sub === result.hostId || payload.sub === result.guestId;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id || !isSafeIdentifier(id)) {
    return NextResponse.json(
      { error: 'ID hasil foto tidak valid.' },
      { status: 400 }
    );
  }

  const rl = checkRateLimit(
    `result_get:${getClientRateKey(req)}`,
    30,
    60 * 1000
  );
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `Terlalu banyak permintaan. Coba lagi dalam ${rl.retryAfterSec} detik.`,
      },
      { status: 429 }
    );
  }

  const result = await getResultById(id);
  if (!result) {
    return NextResponse.json(
      {
        error:
          'Hasil foto tidak ditemukan atau sudah terhapus otomatis (1x24 jam).',
      },
      { status: 404 }
    );
  }

  if (!isResultParticipant(req, result)) {
    return NextResponse.json(
      { error: 'Kamu tidak memiliki akses ke hasil foto sesi ini.' },
      { status: 403 }
    );
  }

  return NextResponse.json({ result, serverTime: Date.now() });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id || !isSafeIdentifier(id)) {
    return NextResponse.json(
      { error: 'ID hasil foto tidak valid.' },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { compositeDataUrl } = body;

  if (
    !compositeDataUrl ||
    typeof compositeDataUrl !== 'string' ||
    !isValidImageDataUrl(compositeDataUrl, MAX_COMPOSITE_IMAGE_BYTES)
  ) {
    return NextResponse.json(
      {
        error:
          'Data gambar hasil gabungan tidak valid (maksimal 10 MB, format PNG/JPG/WebP).',
      },
      { status: 400 }
    );
  }

  const existing = await getResultById(id);
  if (!existing) {
    return NextResponse.json(
      { error: 'Hasil tidak ditemukan.' },
      { status: 404 }
    );
  }

  if (!isResultParticipant(req, existing)) {
    return NextResponse.json(
      { error: 'Kamu tidak memiliki akses ke hasil foto sesi ini.' },
      { status: 403 }
    );
  }

  const updated = await saveResultComposite(id, compositeDataUrl);
  if (!updated) {
    return NextResponse.json(
      { error: 'Hasil tidak ditemukan.' },
      { status: 404 }
    );
  }

  return NextResponse.json({ result: updated });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id || !isSafeIdentifier(id)) {
    return NextResponse.json(
      { error: 'ID hasil foto tidak valid.' },
      { status: 400 }
    );
  }

  const existing = await getResultById(id);
  if (existing && !isResultParticipant(req, existing)) {
    return NextResponse.json(
      { error: 'Kamu tidak memiliki izin untuk menghapus hasil foto ini.' },
      { status: 403 }
    );
  }

  const deleted = await deleteResultEarly(id);
  if (!deleted) {
    return NextResponse.json(
      { error: 'Foto sudah terhapus atau tidak ditemukan.' },
      { status: 404 }
    );
  }
  return NextResponse.json({ deleted: true });
}
