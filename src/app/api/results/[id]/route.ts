import { NextRequest, NextResponse } from 'next/server';
import {
  deleteResultEarly,
  getResultById,
  saveResultComposite,
} from '@/lib/server-store';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const result = await getResultById(id);
  if (!result) {
    return NextResponse.json(
      { error: 'Hasil foto tidak ditemukan atau sudah terhapus otomatis (1x24 jam).' },
      { status: 404 }
    );
  }
  return NextResponse.json({ result, serverTime: Date.now() });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();
  const { compositeDataUrl } = body;

  if (!compositeDataUrl) {
    return NextResponse.json(
      { error: 'Data gambar hasil gabungan diperlukan.' },
      { status: 400 }
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
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const deleted = await deleteResultEarly(id);
  if (!deleted) {
    return NextResponse.json(
      { error: 'Foto sudah terhapus atau tidak ditemukan.' },
      { status: 404 }
    );
  }
  return NextResponse.json({ deleted: true });
}
