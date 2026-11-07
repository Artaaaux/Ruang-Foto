'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Download,
  Image as ImageIcon,
  Lock,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getTemplateById } from '@/lib/templates';
import { composePhotostripHD } from '@/lib/canvas-composer';
import { PhotoboothResult } from '@/lib/types';
import {
  RfBadge,
  RfButton,
  RfCard,
  RfProgressBar,
  RfSticker,
} from '@/components/ui/NeoPrimitives';
import {
  DeletionBanner,
  PhotostripView,
  SupportCard,
} from '@/components/ruangfoto/DomainComponents';

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const resultId = params?.id || '';
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [result, setResult] = useState<PhotoboothResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [composing, setComposing] = useState(false);
  const [composeProgress, setComposeProgress] = useState(25);
  const [hdPngUrl, setHdPngUrl] = useState<string>('');
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpeg'>('png');
  const [retaking, setRetaking] = useState(false);

  // Wajib login (FR-03 & PRD 13)
  useEffect(() => {
    if (!authLoading && !user && resultId) {
      router.replace(`/login?redirect=/app/result/${resultId}`);
    }
  }, [authLoading, user, resultId, router]);

  const fetchResult = useCallback(async () => {
    if (!resultId || !user) return;
    try {
      const res = await fetch(`/api/results/${resultId}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data.result) {
        setErrorMsg(
          data.error ||
            'Hasil foto tidak ditemukan atau sudah terhapus otomatis setelah 1x24 jam.'
        );
        setLoading(false);
        return;
      }

      const loaded: PhotoboothResult = data.result;
      setResult(loaded);
      setLoading(false);

      // Gabungkan foto ke template di browser memakai HTML5 Canvas kualitas HD 1080p (FR-08 & 6.5)
      setComposing(true);
      setComposeProgress(45);
      const tpl = getTemplateById(loaded.templateId);
      const composed = await composePhotostripHD({
        template: tpl,
        poses: loaded.poses,
        hostName: loaded.hostName,
        guestName: loaded.guestName || 'Pasangan',
        format: 'png',
      });
      setComposeProgress(100);
      setHdPngUrl(composed);
      setComposing(false);

      if (composed && !loaded.compositeDataUrl) {
        fetch(`/api/results/${loaded.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ compositeDataUrl: composed }),
        }).catch(() => {});
      }
    } catch {
      setErrorMsg('Gagal memuat hasil foto. Muat ulang halaman ini.');
      setLoading(false);
      setComposing(false);
    }
  }, [resultId, user]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen bg-rf-bg flex items-center justify-center p-4">
        <RfCard color="white" className="max-w-md w-full flex flex-col gap-4">
          <p className="rf-h3 text-rf-ink">Menggabungkan foto…</p>
          <RfProgressBar
            value={composeProgress}
            color="teal"
            label="Progres penggabungan foto"
          />
        </RfCard>
      </div>
    );
  }

  if (errorMsg || !result) {
    return (
      <div className="min-h-screen bg-rf-bg flex items-center justify-center p-4">
        <RfCard color="white" className="max-w-md w-full flex flex-col gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-rf-coral border-3 border-rf-ink flex items-center justify-center">
            <AlertCircle size={24} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <h1 className="rf-h2 text-rf-ink">Hasil foto tidak ditemukan</h1>
          <p className="rf-body text-rf-muted">{errorMsg}</p>
          <RfButton
            type="button"
            variant="primary"
            onClick={() => router.push('/app')}
          >
            <span>Buat sesi baru</span>
          </RfButton>
        </RfCard>
      </div>
    );
  }

  const isHost = user.id === result.hostId;
  const template = getTemplateById(result.templateId);

  const handleDownload = async () => {
    if (!isHost) return;
    try {
      const dataUrl =
        downloadFormat === 'png' && hdPngUrl
          ? hdPngUrl
          : await composePhotostripHD({
              template,
              poses: result.poses,
              hostName: result.hostName,
              guestName: result.guestName || 'Pasangan',
              format: downloadFormat,
            });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `RuangFoto-${result.sessionCode}-HD.${
        downloadFormat === 'jpeg' ? 'jpg' : 'png'
      }`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Photostrip HD berhasil diunduh', 'success');
    } catch {
      showToast('Gagal mengunduh gambar. Coba lagi.', 'error');
    }
  };

  const handleRetake = async () => {
    setRetaking(true);
    try {
      await fetch(`/api/sessions/${result.sessionCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retake-all' }),
      });
      router.push(`/app/session/${result.sessionCode}`);
    } catch {
      router.push('/app');
    } finally {
      setRetaking(false);
    }
  };

  const handleDeleteEarly = async () => {
    try {
      await fetch(`/api/results/${result.id}`, {
        method: 'DELETE',
      });
      showToast('Foto berhasil dihapus dari penyimpanan sementara', 'info');
      router.push('/app?tab=hasil');
    } catch {
      showToast('Gagal menghapus foto lebih awal.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-rf-bg text-rf-ink">
      {/* Navigasi atas */}
      <header className="w-full border-b-3 border-rf-ink bg-rf-bg sticky top-0 z-20">
        <div className="max-w-content mx-auto px-4 sm:px-6 h-18 py-3 flex items-center justify-between gap-4">
          <Link
            href="/app"
            className="inline-flex items-center gap-2.5 text-rf-ink no-underline"
          >
            <span className="w-10 h-10 rounded-[12px] bg-rf-coral border-3 border-rf-ink shadow-hard-sm flex items-center justify-center">
              <Camera size={20} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="text-[20px] font-bold text-rf-ink">RuangFoto</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/app?tab=hasil"
              className="rf-btn rf-btn--highlight min-h-[44px] px-4 text-[14px]"
            >
              <ImageIcon size={18} strokeWidth={2.5} aria-hidden="true" />
              <span>Semua hasil foto</span>
            </Link>
            <Link href="/app" className="rf-btn min-h-[44px] px-4 text-[14px]">
              <ArrowLeft size={18} strokeWidth={2.5} aria-hidden="true" />
              <span>Halaman utama</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-content w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Banner Kuning Peringatan Penghapusan 1x24 Jam (DesignRuangFoto.md 5.9 & 6.5) */}
        <DeletionBanner expiresAt={result.expiresAt} isHost={isHost} />

        {/* Indikator selama foto digabung di browser (DesignRuangFoto.md 6.5) */}
        {composing && (
          <RfCard color="white" className="flex flex-col gap-3">
            <p className="text-[16px] font-bold text-rf-ink">
              Menggabungkan foto…
            </p>
            <RfProgressBar
              value={composeProgress}
              color="teal"
              label="Menggabungkan foto ke template"
            />
          </RfCard>
        )}

        {/* Tata Letak Layar Hasil: Strip lurus di kiri (atas di mobile), Aksi di kanan (bawah di mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Kolom Kiri: Photostrip lurus (DesignRuangFoto.md 5.6 & 6.5) */}
          <div className="lg:col-span-5 flex flex-col items-center gap-4">
            <div className="w-full max-w-[360px]">
              <PhotostripView
                template={template}
                poses={result.poses}
                hostName={result.hostName}
                guestName={result.guestName || 'Pasangan'}
              />
            </div>
          </div>

          {/* Kolom Kanan: Aksi Unduh (khusus Host), Foto Ulang, dan Kartu Dukungan */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <RfCard color="white" className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <RfSticker color="teal" rotateDeg={-2}>
                  Kualitas HD 1080p
                </RfSticker>
                <RfBadge color="yellow">{template.name}</RfBadge>
              </div>

              <div className="flex flex-col gap-2">
                <h1 className="rf-h1 text-rf-ink">Hasilnya sudah jadi!</h1>
                <p className="rf-body text-rf-muted">
                  Sesi foto bersama antara{' '}
                  <strong className="text-rf-ink">{result.hostName}</strong> dan{' '}
                  <strong className="text-rf-ink">
                    {result.guestName || 'Pasangan'}
                  </strong>{' '}
                  berhasil digabungkan.
                </p>
              </div>

              {/* Hanya Host yang melihat dan bisa memakai tombol Unduh (FR-09, 6.5, 12) */}
              {isHost ? (
                <div className="flex flex-col gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-rf-ink">
                      Format file:
                    </span>
                    <button
                      type="button"
                      onClick={() => setDownloadFormat('png')}
                      className={`h-9 px-3 rounded-[8px] border-2 border-rf-ink text-[13px] font-bold cursor-pointer ${
                        downloadFormat === 'png'
                          ? 'bg-rf-yellow text-rf-ink'
                          : 'bg-rf-white text-rf-ink'
                      }`}
                    >
                      PNG (Tajam)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDownloadFormat('jpeg')}
                      className={`h-9 px-3 rounded-[8px] border-2 border-rf-ink text-[13px] font-bold cursor-pointer ${
                        downloadFormat === 'jpeg'
                          ? 'bg-rf-yellow text-rf-ink'
                          : 'bg-rf-white text-rf-ink'
                      }`}
                    >
                      JPG (Ringan)
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {/* Satu-satunya tombol utama (coral) di layar hasil */}
                    <RfButton
                      type="button"
                      variant="primary"
                      onClick={handleDownload}
                      className="min-h-[54px] px-7 text-[18px]"
                    >
                      <Download
                        size={22}
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                      <span>Unduh hasil</span>
                    </RfButton>

                    <RfButton
                      type="button"
                      variant="default"
                      isLoading={retaking}
                      onClick={handleRetake}
                      className="min-h-[54px] px-6"
                    >
                      <RotateCcw
                        size={20}
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                      <span>Foto ulang</span>
                    </RfButton>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 pt-1">
                  <div className="bg-rf-yellow border-3 border-rf-ink rounded-[16px] p-4 flex items-start gap-3">
                    <Lock
                      size={20}
                      strokeWidth={2.5}
                      aria-hidden="true"
                      className="shrink-0 mt-0.5 text-rf-ink"
                    />
                    <p className="text-[14px] leading-[20px] font-bold text-rf-ink">
                      Hanya host ({result.hostName}) yang bisa mengunduh hasil
                      ini. Minta {result.hostName} mengirimkan file HD-nya
                      kepadamu.
                    </p>
                  </div>

                  <div>
                    <RfButton
                      type="button"
                      variant="primary"
                      isLoading={retaking}
                      onClick={handleRetake}
                      className="min-h-[52px] px-6"
                    >
                      <RotateCcw
                        size={20}
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                      <span>Foto ulang</span>
                    </RfButton>
                  </div>
                </div>
              )}

              {/* Opsi hapus foto lebih awal sesuai PRD Bagian 10 */}
              <div className="pt-2 border-t-2 border-rf-ink flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[13px] font-medium text-rf-muted">
                  Sudah selesai mengunduh dan ingin menghapus foto sekarang?
                </span>
                <button
                  type="button"
                  onClick={handleDeleteEarly}
                  className="inline-flex items-center gap-1.5 text-[13px] font-bold text-rf-ink hover:underline cursor-pointer"
                >
                  <Trash2 size={15} strokeWidth={2.5} aria-hidden="true" />
                  <span>Hapus foto lebih awal</span>
                </button>
              </div>
            </RfCard>

            {/* Kartu Dukungan Kecil (DesignRuangFoto.md 6.5) */}
            <SupportCard buttonVariant="highlight" compact />
          </div>
        </div>
      </main>
    </div>
  );
}
