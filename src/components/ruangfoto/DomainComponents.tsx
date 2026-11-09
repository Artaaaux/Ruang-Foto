'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  CameraOff,
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Heart,
  Lock,
  LogOut,
  Mic,
  MicOff,
  RefreshCw,
  Sparkles,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  PhotoboothResult,
  PhotoboothTemplate,
  PosePhotoPair,
} from '@/lib/types';
import { getTemplateById } from '@/lib/templates';
import { composePhotostripHD } from '@/lib/canvas-composer';
import {
  RfAvatar,
  RfBadge,
  RfButton,
  RfCard,
  RfProgressBar,
} from '@/components/ui/NeoPrimitives';
import { RetroStar } from '@/components/ui/RetroDecorations';
import { useToast } from '@/context/ToastContext';

/* ==========================================================================
   5.1 Tile Video (VideoTile)
   - Rasio 4:3 (desktop) dan 3:4 (mobile). Border 4px, radius 20, bayangan besar.
   - Label nama di kiri-bawah: chip white, border 2px.
   - Status koneksi di kanan-atas: Terhubung (teal), Menyambung… (yellow), Terputus (coral).
   - Kamera mati: avatar besar di atas blok warna palet dengan teks "Kamera dimatikan".
   - Suara mati: ikon mikrofon dicoret berlatar coral di kiri-atas.
   - Tile pasangan menunggu: latar pink dengan pola halftone dan teks "Menunggu pasanganmu masuk…".
   - Tile video tidak pernah berputar atau diberi efek.
   ========================================================================== */
export type ConnectionState = 'terhubung' | 'menyambung' | 'terputus';

export interface VideoTileProps {
  name: string;
  avatarColor?: string;
  isWaitingPartner?: boolean;
  connectionState: ConnectionState;
  micOn: boolean;
  camOn: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  isLocal?: boolean;
  isSimulatedPartner?: boolean;
  countdownOverlay?: React.ReactNode;
  onEnableSimulatedPartner?: () => void;
}

export function VideoTile({
  name,
  avatarColor = '#FFE066',
  isWaitingPartner = false,
  connectionState,
  micOn,
  camOn,
  videoRef,
  isLocal = false,
  isSimulatedPartner = false,
  countdownOverlay,
  onEnableSimulatedPartner,
}: VideoTileProps) {
  const statusConfig =
    connectionState === 'terhubung'
      ? {
          label: 'Terhubung',
          bg: 'bg-rf-teal',
          icon: <Wifi size={16} strokeWidth={2.5} aria-hidden="true" />,
        }
      : connectionState === 'menyambung'
        ? {
            label: 'Menyambung…',
            bg: 'bg-rf-yellow',
            icon: <Clock size={16} strokeWidth={2.5} aria-hidden="true" />,
          }
        : {
            label: 'Terputus',
            bg: 'bg-rf-coral',
            icon: <WifiOff size={16} strokeWidth={2.5} aria-hidden="true" />,
          };

  return (
    <div className="relative w-full aspect-[3/4] lg:aspect-[4/3] border-4 border-rf-ink rounded-[20px] shadow-hard-lg overflow-hidden bg-rf-white">
      {isWaitingPartner ? (
        <div className="w-full h-full bg-rf-pink rf-halftone flex flex-col items-center justify-center p-6 text-center gap-4">
          <div className="w-16 h-16 rounded-full border-3 border-rf-ink bg-rf-white shadow-hard-sm flex items-center justify-center">
            <Sparkles
              size={28}
              strokeWidth={2.5}
              aria-hidden="true"
              className="text-rf-ink"
            />
          </div>
          <p className="text-[18px] leading-[24px] font-bold text-rf-ink max-w-[26ch]">
            Menunggu pasanganmu masuk…
          </p>
          {onEnableSimulatedPartner && (
            <button
              type="button"
              onClick={onEnableSimulatedPartner}
              className="rf-btn rf-btn--secondary text-[14px] min-h-[44px] px-4"
            >
              Simulasikan pasangan masuk
            </button>
          )}
        </div>
      ) : !camOn ? (
        <div
          style={{ backgroundColor: avatarColor }}
          className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-3"
        >
          <RfAvatar name={name} color="#FFFFFF" size="lg" />
          <p className="text-[16px] leading-[24px] font-bold text-rf-ink bg-rf-white border-2 border-rf-ink rounded-full px-4 py-1">
            Kamera dimatikan
          </p>
        </div>
      ) : isSimulatedPartner ? (
        <div className="w-full h-full bg-rf-purple rf-halftone flex flex-col items-center justify-center p-6 text-center gap-3">
          <div className="w-28 h-28 rounded-full border-4 border-rf-ink bg-rf-yellow shadow-hard flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-4">
              <span className="w-3 h-3 rounded-full bg-rf-ink block" />
              <span className="w-3 h-3 rounded-full bg-rf-ink block" />
            </div>
            <span className="w-8 h-1.5 bg-rf-ink rounded-full block mt-1" />
          </div>
          <span className="bg-rf-white border-2 border-rf-ink rounded-full px-3 py-1 text-[14px] font-bold text-rf-ink">
            Kamera Simulasi Aktif
          </span>
        </div>
      ) : (
        <div
          style={{ backgroundColor: avatarColor }}
          className="relative w-full h-full flex flex-col items-center justify-center"
        >
          <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
            <RfAvatar name={name} color="#FFFFFF" size="lg" />
          </div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            onLoadedMetadata={(e) => {
              const el = e.currentTarget;
              el.play().catch(() => {
                if (!isLocal) {
                  // Jika kebijakan autoplay browser menolak audio tanpa interaksi, mute sementara agar video tetap tampil
                  el.muted = true;
                  el.play().catch(() => {});
                }
              });
            }}
            onCanPlay={(e) => {
              e.currentTarget.play().catch(() => {});
            }}
            className={`absolute inset-0 z-[1] w-full h-full object-cover bg-transparent ${
              isLocal ? '-scale-x-100' : ''
            }`}
          />
        </div>
      )}

      {/* Suara mati: ikon mikrofon dicoret berlatar coral di kiri-atas (5.1) */}
      {!isWaitingPartner && !micOn && (
        <div
          aria-label={`Suara ${name} mati`}
          className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 bg-rf-coral border-2 border-rf-ink rounded-full px-3 py-1 text-[14px] leading-[20px] font-bold text-rf-ink shadow-hard-sm"
        >
          <MicOff size={16} strokeWidth={2.5} aria-hidden="true" />
          <span>Suara mati</span>
        </div>
      )}

      {/* Status koneksi di kanan-atas: chip dengan ikon dan teks (5.1) */}
      <div
        aria-live="polite"
        className={`absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 ${statusConfig.bg} border-2 border-rf-ink rounded-full px-3 py-1 text-[14px] leading-[20px] font-bold text-rf-ink shadow-hard-sm`}
      >
        {statusConfig.icon}
        <span>{statusConfig.label}</span>
      </div>

      {/* Label nama di kiri-bawah: chip white, border 2px (5.1) */}
      <div className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-2 bg-rf-white border-2 border-rf-ink rounded-full px-3.5 py-1 text-[14px] leading-[20px] font-bold text-rf-ink shadow-hard-sm">
        <span>{name}</span>
      </div>

      {/* Countdown overlay (5.3) */}
      {countdownOverlay}
    </div>
  );
}

/* ==========================================================================
   5.2 Bilah Kontrol Sesi (SessionControlBar)
   - Dari kiri ke kanan: tombol mikrofon, tombol kamera, tombol Siap (lebar, utama), tombol Keluar.
   - Tombol mikrofon dan kamera 56x56, berbentuk bulat, border 3px, bayangan normal.
     Aktif: latar white, ikon mikrofon/kamera.
     Mati: latar coral, ikon dicoret, dan label kecil di bawah ("Suara mati", "Kamera mati").
   - Di mobile, bilah ditempel di bawah layar dengan padding env(safe-area-inset-bottom).
   ========================================================================== */
export interface SessionControlBarProps {
  micOn: boolean;
  camOn: boolean;
  isReady: boolean;
  partnerPresent: boolean;
  isCountingDown: boolean;
  currentPose: number;
  /** Jika diisi, tombol Siap nonaktif dan menampilkan label ini (mis. saat menyimpan foto). */
  busyLabel?: string | null;
  /** Panduan langkah berikutnya, tampil tepat di atas tombol. */
  hint: string;
  /** Sorot panduan saat giliran pengguna menekan Siap. */
  hintNeedsAction?: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleReady: () => void;
  onLeave: () => void;
}

export function SessionControlBar({
  micOn,
  camOn,
  isReady,
  partnerPresent,
  isCountingDown,
  currentPose,
  busyLabel = null,
  hint,
  hintNeedsAction = false,
  onToggleMic,
  onToggleCam,
  onToggleReady,
  onLeave,
}: SessionControlBarProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-rf-white border-3 border-rf-ink px-4 pt-3 rf-safe-bottom lg:static lg:rounded-[20px] lg:shadow-hard-lg lg:p-4">
      {/* Panduan langkah berikutnya, selalu terlihat di dekat tombol Siap */}
      <p
        aria-live="polite"
        className={`max-w-content mx-auto mb-3 border-2 border-rf-ink rounded-[12px] px-3 py-2 text-[14px] leading-[20px] font-bold text-rf-ink ${
          hintNeedsAction ? 'bg-rf-yellow' : 'bg-rf-bg'
        }`}
      >
        {hint}
      </p>
      <div className="max-w-content mx-auto flex items-start sm:items-center justify-between gap-3 sm:gap-4">
        {/* Kiri: Tombol Mikrofon & Kamera 56x56 */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={onToggleMic}
              aria-label={micOn ? 'Matikan mikrofon' : 'Nyalakan mikrofon'}
              aria-pressed={!micOn}
              className={`w-[56px] h-[56px] rounded-full border-3 border-rf-ink shadow-hard inline-flex items-center justify-center text-rf-ink transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer ${
                micOn ? 'bg-rf-white hover:bg-rf-yellow' : 'bg-rf-coral'
              }`}
            >
              {micOn ? (
                <Mic size={24} strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <MicOff size={24} strokeWidth={2.5} aria-hidden="true" />
              )}
            </button>
            <span className="text-[12px] leading-[16px] font-bold text-rf-ink">
              {micOn ? 'Suara aktif' : 'Suara mati'}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={onToggleCam}
              disabled={isCountingDown}
              aria-label={camOn ? 'Matikan kamera' : 'Nyalakan kamera'}
              aria-pressed={!camOn}
              className={`w-[56px] h-[56px] rounded-full border-3 border-rf-ink shadow-hard inline-flex items-center justify-center text-rf-ink transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                camOn ? 'bg-rf-white hover:bg-rf-yellow' : 'bg-rf-coral'
              }`}
            >
              {camOn ? (
                <Camera size={24} strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <CameraOff size={24} strokeWidth={2.5} aria-hidden="true" />
              )}
            </button>
            <span className="text-[12px] leading-[16px] font-bold text-rf-ink">
              {camOn ? 'Kamera aktif' : 'Kamera mati'}
            </span>
          </div>
        </div>

        {/* Tengah: Tombol Siap (lebar, satu-satunya tombol utama coral di layar ini) */}
        <div className="flex-1 max-w-xs">
          {/* Label tombol selalu menyebut aksi yang akan terjadi, bukan status */}
          <RfButton
            type="button"
            variant={isReady ? 'highlight' : 'primary'}
            disabled={!partnerPresent || isCountingDown || Boolean(busyLabel)}
            onClick={onToggleReady}
            className="w-full min-h-[56px] px-3 sm:px-5 text-[16px] sm:text-[18px]"
          >
            {isCountingDown ? (
              <span>Bergaya!</span>
            ) : busyLabel ? (
              <span>{busyLabel}</span>
            ) : isReady ? (
              <span>Batal siap</span>
            ) : (
              <span>
                Siap
                <span className="hidden sm:inline"> untuk pose {currentPose}</span>
              </span>
            )}
          </RfButton>
        </div>

        {/* Kanan: Tombol Keluar (ikon + label) */}
        <RfButton
          type="button"
          variant="default"
          onClick={onLeave}
          disabled={isCountingDown}
          aria-label="Keluar dari sesi"
          className="min-h-[56px] px-3 sm:px-4 hover:bg-rf-pink"
        >
          <LogOut size={20} strokeWidth={2.5} aria-hidden="true" />
          {/* Mobile: ikon saja (DesignRuangFoto.md 6.4) agar label tombol Siap muat */}
          <span className="hidden sm:inline">Keluar</span>
        </RfButton>
      </div>
    </div>
  );
}

/* ==========================================================================
   5.3 Countdown Overlay (CountdownOverlay)
   - Angka 3, 2, 1 ditampilkan di tengah tile di dalam lingkaran yellow berborder 4px dan bayangan besar.
   - Setiap angka muncul dengan skala 0,8 ke 1 selama 300ms.
   - Setelah nol, tampilkan "Cekrek!" selama 600ms dan kilatan putih 120ms di atas tile.
   - Gunakan aria-live="assertive" untuk angka dan sertakan teks "Foto diambil".
   ========================================================================== */
export interface CountdownOverlayProps {
  step: 3 | 2 | 1 | 'cekrek' | null;
  showFlash: boolean;
}

export function CountdownOverlay({ step, showFlash }: CountdownOverlayProps) {
  if (!step && !showFlash) return null;

  return (
    <div
      aria-live="assertive"
      aria-atomic="true"
      className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
    >
      {showFlash && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-rf-white opacity-95"
        />
      )}

      {step !== null && (
        <div
          key={String(step)}
          className="rf-countdown-pop min-w-[160px] min-h-[160px] lg:min-w-[200px] lg:min-h-[200px] px-6 rounded-full bg-rf-yellow border-4 border-rf-ink shadow-hard-lg flex flex-col items-center justify-center text-rf-ink"
        >
          {step === 'cekrek' ? (
            <>
              <span className="text-[28px] lg:text-[36px] leading-tight font-bold">
                Cekrek!
              </span>
              <span className="text-[14px] leading-[20px] font-bold">
                Foto diambil
              </span>
            </>
          ) : (
            <span className="rf-countdown-num">{step}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   5.4 Status Pose (PoseIndicator)
   - Baris indikator di atas tile: satu lingkaran per pose, isinya kosong (belum),
     yellow (sedang), teal dengan centang (selesai). Teks di sebelahnya: "Pose 2 dari 4".
   ========================================================================== */
export interface PoseIndicatorProps {
  currentPose: number;
  totalPoses: number;
  poses: PosePhotoPair[];
}

export function PoseIndicator({
  currentPose,
  totalPoses,
  poses,
}: PoseIndicatorProps) {
  return (
    <div
      aria-label={`Pose ${currentPose} dari ${totalPoses}`}
      className="inline-flex items-center gap-3 bg-rf-white border-3 border-rf-ink rounded-full px-4 py-2 shadow-hard-sm"
    >
      <div className="flex items-center gap-2">
        {Array.from({ length: totalPoses }, (_, idx) => {
          const poseNum = idx + 1;
          const poseData = poses.find((p) => p.poseNumber === poseNum);
          const isCompleted = Boolean(
            poseData?.hostDataUrl && poseData?.guestDataUrl
          );
          const isCurrent = poseNum === currentPose && !isCompleted;

          return (
            <span
              key={poseNum}
              aria-hidden="true"
              className={`w-6 h-6 rounded-full border-2 border-rf-ink inline-flex items-center justify-center text-[12px] font-bold ${
                isCompleted
                  ? 'bg-rf-teal text-rf-ink'
                  : isCurrent
                    ? 'bg-rf-yellow text-rf-ink'
                    : 'bg-rf-white text-rf-ink'
              }`}
            >
              {isCompleted ? (
                <Check size={14} strokeWidth={3} aria-hidden="true" />
              ) : null}
            </span>
          );
        })}
      </div>
      <span className="text-[16px] leading-[24px] font-bold text-rf-ink">
        Pose {currentPose} dari {totalPoses}
      </span>
    </div>
  );
}

/* ==========================================================================
   5.5 Kotak Link Undangan (InviteLinkBox)
   - Kartu white berisi input baca-saja dan tombol Salin link (highlight).
   - Setelah disalin: toast "Link tersalin" dan teks tombol berubah menjadi "Tersalin" selama 2 detik.
   ========================================================================== */
export interface InviteLinkBoxProps {
  inviteUrl: string;
}

export function InviteLinkBox({ inviteUrl }: InviteLinkBoxProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      showToast('Link tersalin', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Gagal menyalin link secara otomatis. Salin manual dari kotak.', 'info');
    }
  };

  return (
    <RfCard color="white" className="w-full">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="rf-h3 text-rf-ink">Undang pasanganmu</h3>
          <RfBadge color="yellow">Maksimal 2 peserta</RfBadge>
        </div>
        <p className="text-[14px] leading-[20px] text-rf-muted">
          Bagikan link ini lewat WhatsApp atau Instagram. Begitu pasanganmu masuk, kalian langsung terhubung lewat video.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-1">
          <label htmlFor="invite-url-input" className="sr-only">
            Link undangan sesi
          </label>
          <input
            id="invite-url-input"
            type="text"
            readOnly
            value={inviteUrl}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="flex-1 h-12 px-4 bg-rf-bg text-rf-ink border-3 border-rf-ink rounded-[12px] text-[14px] font-bold select-all"
          />
          <RfButton
            type="button"
            variant="highlight"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <>
                <Check size={20} strokeWidth={2.5} aria-hidden="true" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy size={20} strokeWidth={2.5} aria-hidden="true" />
                <span>Salin link</span>
              </>
            )}
          </RfButton>
        </div>
      </div>
    </RfCard>
  );
}

/* ==========================================================================
   5.6 Photostrip (PhotostripView)
   - Strip vertikal berlatar white/template, border 3px, bayangan besar.
   - Setiap bingkai foto berborder 3px dengan radius 8.
   - Hiasan retro pada strip: bintang kecil dan teks "RuangFoto" di bagian bawah.
   - Di hero landing, strip boleh berputar -4° dan sedikit menimpa tile video. Di layar hasil, strip lurus.
   ========================================================================== */
export interface PhotostripViewProps {
  template: PhotoboothTemplate;
  poses?: PosePhotoPair[];
  hostName?: string;
  guestName?: string;
  tiltedOnHero?: boolean;
  compact?: boolean;
  className?: string;
}

export function getPoseAvatar(name: string, poseNumber: number): string {
  const lower = (name || '').toLowerCase();
  const idx = Math.max(1, poseNumber);
  if (lower.includes('nadia')) return `/avatars/nadia-${((idx - 1) % 4) + 1}.svg`;
  if (lower.includes('raka')) return `/avatars/raka-${((idx - 1) % 4) + 1}.svg`;
  if (lower.includes('alya')) return `/avatars/alya-${((idx - 1) % 3) + 1}.svg`;
  if (lower.includes('dimas')) return `/avatars/dimas-${((idx - 1) % 3) + 1}.svg`;
  if (lower.includes('tania')) return `/avatars/tania-${((idx - 1) % 3) + 1}.svg`;
  if (lower.includes('bima')) return `/avatars/bima-${((idx - 1) % 3) + 1}.svg`;
  if (lower.includes('sinta')) return `/avatars/sinta.svg`;

  // Fallback umum (siklus pose aman: 1, 2, 3, 2 - hindari cyclops pose-4)
  const safePose = [1, 2, 3, 2];
  return `/avatars/pose-${safePose[(idx - 1) % 4]}.svg`;
}

export function PhotostripView({
  template,
  poses,
  hostName = 'Kamu',
  guestName = 'Pasangan',
  tiltedOnHero = false,
  compact = false,
  className = '',
}: PhotostripViewProps) {
  const rows = Array.from({ length: template.poseCount }, (_, i) => {
    const found = poses?.find((p) => p.poseNumber === i + 1);
    return found || { poseNumber: i + 1 };
  });

  const sampleColors = [
    ['#FFE066', '#A78BFA'],
    ['#36CFC0', '#FFC9C4'],
    ['#F59E5B', '#3BA7D9'],
    ['#FFC9C4', '#FFE066'],
  ];

  // Template bingkai PNG: foto diposisikan sesuai slot (persen), PNG ditumpuk di atasnya
  if (template.frame) {
    const frame = template.frame;
    const pct = (v: number, total: number) => `${(v / total) * 100}%`;
    const slotStyle = (r: { x: number; y: number; w: number; h: number }) => ({
      left: pct(r.x, frame.width),
      top: pct(r.y, frame.height),
      width: pct(r.w, frame.width),
      height: pct(r.h, frame.height),
    });

    return (
      <div
        style={{
          aspectRatio: `${frame.width} / ${frame.height}`,
          backgroundColor: template.stripBg,
        }}
        className={`relative w-full border-3 border-rf-ink rounded-[16px] shadow-hard-lg overflow-hidden text-rf-ink ${
          tiltedOnHero ? 'rf-hero-strip-enter' : ''
        } ${className}`.trim()}
      >
        {/* Pass 1: Latar slotBg agar tata letak zig-zag/asimetris tidak menutupi foto baris lain */}
        {rows.map((row, idx) => {
          const slot = frame.slots[idx];
          if (!slot) return null;
          const left = Math.min(slot.host.x, slot.guest.x);
          const top = Math.min(slot.host.y, slot.guest.y);
          return (
            <div
              key={`bg-${row.poseNumber}`}
              className="absolute"
              style={{
                ...slotStyle({
                  x: left,
                  y: top,
                  w: Math.max(slot.host.x + slot.host.w, slot.guest.x + slot.guest.w) - left,
                  h: Math.max(slot.host.y + slot.host.h, slot.guest.y + slot.guest.h) - top,
                }),
                backgroundColor: frame.slotBg || template.stripBg,
              }}
            />
          );
        })}
        {/* Pass 2: Sel foto Host & Guest */}
        {rows.map((row, idx) => {
          const slot = frame.slots[idx];
          if (!slot) return null;
          const [leftBg, rightBg] = sampleColors[idx % sampleColors.length];
          const cells = [
            { rect: slot.host, src: row.hostDataUrl, name: hostName, bg: leftBg },
            { rect: slot.guest, src: row.guestDataUrl, name: guestName, bg: rightBg },
          ];
          return (
            <div key={row.poseNumber}>
              {cells.map((cell, cellIdx) => (
                <div
                  key={cellIdx}
                  style={{ ...slotStyle(cell.rect), backgroundColor: cell.bg }}
                  className="absolute overflow-hidden flex items-center justify-center select-none"
                >
                  {cell.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cell.src}
                      alt={`${cell.name} pose ${row.poseNumber}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getPoseAvatar(cell.name, row.poseNumber)}
                      alt={`${cell.name} pose ${row.poseNumber}`}
                      className="w-full h-full object-contain scale-110 translate-y-1 pointer-events-none"
                    />
                  )}
                </div>
              ))}
            </div>
          );
        })}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frame.src}
          alt={`Bingkai ${template.name}`}
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
        />
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: template.stripBg }}
      className={`border-3 border-rf-ink rounded-[20px] shadow-hard-lg ${
        compact ? 'p-3' : 'p-4 sm:p-5'
      } flex flex-col gap-3 text-rf-ink ${
        tiltedOnHero ? 'rf-hero-strip-enter' : ''
      } ${className}`.trim()}
    >
      {/* Header strip */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b-2 border-rf-ink">
        <div>
          <p
            className={`${
              compact ? 'text-[13px]' : 'text-[15px]'
            } font-bold text-rf-ink leading-tight`}
          >
            {template.name}
          </p>
          {!compact && (
            <p className="text-[12px] font-medium text-rf-muted">
              {hostName} & {guestName}
            </p>
          )}
        </div>
        <RetroStar color="#FFE066" size={compact ? 16 : 20} />
      </div>

      {/* Deretan bingkai pose (tiap bingkai berborder 3px dengan radius 8) */}
      <div className="flex flex-col gap-2.5">
        {rows.map((row, idx) => {
          const [leftBg, rightBg] = sampleColors[idx % sampleColors.length];
          return (
            <div key={row.poseNumber} className="grid grid-cols-2 gap-2">
              {/* Bingkai Host */}
              <div
                style={{ backgroundColor: leftBg }}
                className={`relative border-3 border-rf-ink rounded-[8px] overflow-hidden ${
                  compact ? 'aspect-[4/3]' : 'aspect-[4/3]'
                } flex items-center justify-center select-none`}
              >
                {row.hostDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.hostDataUrl}
                    alt={`${hostName} pose ${row.poseNumber}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getPoseAvatar(hostName, row.poseNumber)}
                    alt={`${hostName} pose ${row.poseNumber}`}
                    className="w-full h-full object-contain scale-110 translate-y-1 pointer-events-none"
                  />
                )}
              </div>

              {/* Bingkai Guest */}
              <div
                style={{ backgroundColor: rightBg }}
                className={`relative border-3 border-rf-ink rounded-[8px] overflow-hidden ${
                  compact ? 'aspect-[4/3]' : 'aspect-[4/3]'
                } flex items-center justify-center select-none`}
              >
                {row.guestDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.guestDataUrl}
                    alt={`${guestName} pose ${row.poseNumber}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getPoseAvatar(guestName, row.poseNumber)}
                    alt={`${guestName} pose ${row.poseNumber}`}
                    className="w-full h-full object-contain scale-110 translate-y-1 pointer-events-none"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hiasan retro bagian bawah strip: bintang kecil dan teks "RuangFoto" (5.6) */}
      <div className="pt-1 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5">
          <RetroStar color="#FF5C5C" size={compact ? 14 : 18} />
          <span
            className={`${
              compact ? 'text-[12px]' : 'text-[14px]'
            } font-bold text-rf-ink`}
          >
            RuangFoto
          </span>
        </div>
        <span className="text-[11px] font-bold text-rf-muted">
          {template.poseCount} pose
        </span>
      </div>
    </div>
  );
}

/* ==========================================================================
   5.7 Kartu Template (TemplateCard)
   - Pratinjau strip kecil di atas, nama template, badge "Gratis", dan tombol Pakai template.
   - Terpilih: latar kartu yellow, centang teal di sudut kanan-atas, dan teks tombol menjadi "Dipakai".
   ========================================================================== */
export interface TemplateCardProps {
  template: PhotoboothTemplate;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function TemplateCard({
  template,
  isSelected,
  onSelect,
}: TemplateCardProps) {
  return (
    <RfCard
      color={isSelected ? 'yellow' : 'white'}
      className="relative flex flex-col justify-between gap-4"
    >
      {/* Centang teal di sudut kanan-atas saat terpilih (5.7) */}
      {isSelected && (
        <div
          aria-label="Template sedang dipakai"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-rf-teal border-3 border-rf-ink shadow-hard-sm flex items-center justify-center text-rf-ink"
        >
          <Check size={20} strokeWidth={3} aria-hidden="true" />
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="w-full min-h-[320px] rounded-[14px] border-2 border-rf-ink bg-rf-bg p-4 flex items-center justify-center">
          <div className="w-full max-w-[156px]">
            <PhotostripView template={template} compact />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <RfBadge color="teal">Gratis</RfBadge>
            <RfBadge color="purple">{template.category}</RfBadge>
          </div>
          <h3 className="rf-h3 text-rf-ink">{template.name}</h3>
          <p className="text-[14px] leading-[20px] text-rf-muted">
            {template.description}
          </p>
        </div>
      </div>

      <RfButton
        type="button"
        variant={isSelected ? 'accent' : 'default'}
        onClick={() => onSelect(template.id)}
        className="w-full"
      >
        {isSelected ? (
          <>
            <Check size={20} strokeWidth={2.5} aria-hidden="true" />
            <span>Dipakai</span>
          </>
        ) : (
          <span>Pakai template</span>
        )}
      </RfButton>
    </RfCard>
  );
}

/* ==========================================================================
   5.8 Kartu Dukungan (SupportCard)
   - Panel pink dengan sudut 40px di satu sisi, ikon hati, dan teks:
     "RuangFoto gratis. Kalau suka, dukung seikhlasnya buat biaya pengembangan ruang foto. Dukungan tidak membuka fitur apa pun."
   - Tombol Dukung di Saweria membuka tab baru.
   ========================================================================== */
export interface SupportCardProps {
  buttonVariant?: 'primary' | 'highlight';
  compact?: boolean;
}

export function SupportCard({
  buttonVariant = 'primary',
  compact = false,
}: SupportCardProps) {
  const configuredUrl = process.env.NEXT_PUBLIC_SAWERIA_URL;
  const saweriaUrl =
    configuredUrl && !configuredUrl.includes('ruangfoto')
      ? configuredUrl
      : 'https://saweria.co/SudutKamarStudio';

  return (
    <RfCard
      color="pink"
      panelCorner="tr"
      className={compact ? 'p-5' : 'p-6 lg:p-8'}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-rf-yellow border-3 border-rf-ink shadow-hard-sm flex items-center justify-center shrink-0">
            <Heart
              size={24}
              strokeWidth={2.5}
              aria-hidden="true"
              className="text-rf-ink"
            />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="rf-h3 text-rf-ink">Gratis, dukung seikhlasnya</h3>
            <p className="rf-body text-rf-ink">
              RuangFoto gratis. Kalau suka, dukung seikhlasnya buat biaya
              pengembangan ruang foto. Dukungan tidak membuka fitur apa pun.
            </p>
          </div>
        </div>

        <a
          href={saweriaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`rf-btn ${
            buttonVariant === 'primary'
              ? 'rf-btn--primary'
              : 'rf-btn--highlight'
          } shrink-0`}
        >
          <Heart size={20} strokeWidth={2.5} aria-hidden="true" />
          <span>Dukung di Saweria</span>
        </a>
      </div>
    </RfCard>
  );
}

/* ==========================================================================
   5.9 Peringatan Penghapusan (DeletionBanner)
   - Banner yellow, border 3px, di atas layar hasil:
     "Foto terhapus dalam 23:41:10. Unduh sekarang." dengan indikator progres di bawahnya.
   - Bagi guest, teks diganti: "Hanya host yang bisa mengunduh hasil ini."
   ========================================================================== */
export interface DeletionBannerProps {
  expiresAt: string;
  isHost: boolean;
}

export function DeletionBanner({ expiresAt, isHost }: DeletionBannerProps) {
  const [remainingMs, setRemainingMs] = useState<number>(24 * 60 * 60 * 1000);

  useEffect(() => {
    const updateTimer = () => {
      const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setRemainingMs(diff);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const totalSecs = Math.floor(remainingMs / 1000);
  const hours = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
  const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
  const secs = String(totalSecs % 60).padStart(2, '0');

  const progressPct = Math.min(
    100,
    Math.max(0, (remainingMs / (24 * 60 * 60 * 1000)) * 100)
  );

  return (
    <div
      role="region"
      aria-label="Informasi penyimpanan sementara foto"
      className="w-full bg-rf-yellow border-3 border-rf-ink rounded-[20px] shadow-hard p-4 sm:p-5 flex flex-col gap-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Clock
            size={22}
            strokeWidth={2.5}
            aria-hidden="true"
            className="text-rf-ink shrink-0"
          />
          <p className="text-[16px] leading-[24px] font-bold text-rf-ink tabular-nums">
            {isHost
              ? `Foto terhapus dalam ${hours}:${mins}:${secs}. Unduh sekarang.`
              : `Hanya host yang bisa mengunduh hasil ini. (Terhapus otomatis dalam ${hours}:${mins}:${secs})`}
          </p>
        </div>
        <RfBadge color="white">Privasi 1x24 jam</RfBadge>
      </div>
      <RfProgressBar
        value={progressPct}
        color="coral"
        label="Sisa waktu penyimpanan foto 24 jam"
      />
    </div>
  );
}

/* ==========================================================================
   5.10 Kartu & Galeri Hasil Foto 24 Jam (ResultGalleryCard & ResultsGallerySection)
   - Menampilkan hasil photostrip yang sudah selesai dan masih dalam masa retensi 1x24 jam.
   - Dilengkapi indikator waktu hitung mundur penghapusan otomatis (JJ:MM:DD + bar progres).
   - Tombol Unduh langsung (PNG/JPG HD 1080p) bagi Host, info kunci bagi Guest,
     serta aksi Lihat detail & Hapus lebih awal.
   ========================================================================== */
export interface ResultGalleryCardProps {
  result: PhotoboothResult;
  currentUserId: string;
  isPrimaryCta: boolean;
  onDeleted: (id: string) => void;
}

export function ResultGalleryCard({
  result,
  currentUserId,
  isPrimaryCta,
  onDeleted,
}: ResultGalleryCardProps) {
  const { showToast } = useToast();
  const isHost = currentUserId === result.hostId;
  const template = getTemplateById(result.templateId);

  const [remainingMs, setRemainingMs] = useState<number>(24 * 60 * 60 * 1000);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpeg'>('png');
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const diff = Math.max(0, new Date(result.expiresAt).getTime() - Date.now());
      setRemainingMs(diff);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [result.expiresAt]);

  const totalSecs = Math.floor(remainingMs / 1000);
  const hours = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
  const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
  const secs = String(totalSecs % 60).padStart(2, '0');

  const progressPct = Math.min(
    100,
    Math.max(0, (remainingMs / (24 * 60 * 60 * 1000)) * 100)
  );

  const createdTimeLabel = new Date(result.createdAt).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDownload = async () => {
    if (!isHost) return;
    setDownloading(true);
    try {
      const dataUrl =
        downloadFormat === 'png' &&
        result.compositeDataUrl &&
        result.compositeDataUrl.startsWith('data:image/')
          ? result.compositeDataUrl
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
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteEarly = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/results/${result.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Foto berhasil dihapus dari penyimpanan sementara', 'info');
        onDeleted(result.id);
      } else {
        showToast('Gagal menghapus foto lebih awal.', 'error');
      }
    } catch {
      showToast('Gagal menghapus foto lebih awal.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <RfCard color="white" className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Pratinjau Photostrip */}
        <div className="md:col-span-5 bg-rf-bg border-3 border-rf-ink rounded-[16px] p-4 flex items-center justify-center">
          <div className="w-full max-w-[220px]">
            <PhotostripView
              template={template}
              poses={result.poses}
              hostName={result.hostName}
              guestName={result.guestName || 'Pasangan'}
              compact
            />
          </div>
        </div>

        {/* Informasi Sesi, Indikator Waktu Hapus 24 Jam, dan Aksi Unduh */}
        <div className="md:col-span-7 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <RfBadge color={isHost ? 'teal' : 'purple'}>
              {isHost ? 'Peran: Host' : 'Peran: Guest'}
            </RfBadge>
            <RfBadge color="yellow">{template.name}</RfBadge>
            <RfBadge color="white">Sesi {result.sessionCode}</RfBadge>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="rf-h3 text-rf-ink">
              {result.hostName} & {result.guestName || 'Pasangan'}
            </h3>
            <p className="text-[14px] leading-[20px] text-rf-muted">
              Diambil {createdTimeLabel} · {template.poseCount} pose kualitas HD
              1080p
            </p>
          </div>

          {/* Indikator Waktu Penghapusan 1x24 Jam */}
          <div
            role="region"
            aria-label={`Sisa waktu penyimpanan foto sesi ${result.sessionCode}`}
            className="bg-rf-yellow border-3 border-rf-ink rounded-[16px] p-4 flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Clock
                  size={20}
                  strokeWidth={2.5}
                  aria-hidden="true"
                  className="text-rf-ink shrink-0"
                />
                <span className="text-[16px] leading-[24px] font-bold text-rf-ink tabular-nums">
                  {remainingMs > 0
                    ? `Terhapus otomatis dalam ${hours}:${mins}:${secs}`
                    : 'Waktu simpan 24 jam telah berakhir'}
                </span>
              </div>
              <RfBadge color="white">Privasi 1x24 jam</RfBadge>
            </div>
            <RfProgressBar
              value={progressPct}
              color="coral"
              label="Sisa waktu penyimpanan foto 24 jam"
            />
          </div>

          {/* Kontrol Unduh (Host) atau Informasi Hak Unduh (Guest) */}
          {isHost ? (
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-bold text-rf-ink">
                  Format unduhan:
                </span>
                <button
                  type="button"
                  onClick={() => setDownloadFormat('png')}
                  className={`min-h-[44px] px-3.5 rounded-[10px] border-2 border-rf-ink text-[14px] font-bold cursor-pointer ${
                    downloadFormat === 'png'
                      ? 'bg-rf-yellow text-rf-ink shadow-hard-sm'
                      : 'bg-rf-white text-rf-ink hover:bg-rf-bg'
                  }`}
                >
                  PNG (Tajam)
                </button>
                <button
                  type="button"
                  onClick={() => setDownloadFormat('jpeg')}
                  className={`min-h-[44px] px-3.5 rounded-[10px] border-2 border-rf-ink text-[14px] font-bold cursor-pointer ${
                    downloadFormat === 'jpeg'
                      ? 'bg-rf-yellow text-rf-ink shadow-hard-sm'
                      : 'bg-rf-white text-rf-ink hover:bg-rf-bg'
                  }`}
                >
                  JPG (Ringan)
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <RfButton
                  type="button"
                  variant={isPrimaryCta ? 'primary' : 'highlight'}
                  isLoading={downloading}
                  onClick={handleDownload}
                  className="min-h-[48px] px-5"
                >
                  <Download size={20} strokeWidth={2.5} aria-hidden="true" />
                  <span>Unduh hasil</span>
                </RfButton>

                <Link
                  href={`/app/result/${result.id}`}
                  className="rf-btn min-h-[48px] px-4 text-[14px]"
                >
                  <ExternalLink size={18} strokeWidth={2.5} aria-hidden="true" />
                  <span>Lihat detail</span>
                </Link>

                {confirmDelete ? (
                  <div className="inline-flex flex-wrap items-center gap-2">
                    <RfButton
                      type="button"
                      variant="default"
                      isLoading={deleting}
                      onClick={handleDeleteEarly}
                      className="min-h-[48px] px-4 text-[14px] bg-rf-pink"
                    >
                      <Trash2 size={18} strokeWidth={2.5} aria-hidden="true" />
                      <span>Ya, hapus foto</span>
                    </RfButton>
                    <RfButton
                      type="button"
                      variant="default"
                      disabled={deleting}
                      onClick={() => setConfirmDelete(false)}
                      className="min-h-[48px] px-4 text-[14px]"
                    >
                      <span>Batal</span>
                    </RfButton>
                  </div>
                ) : (
                  <RfButton
                    type="button"
                    variant="default"
                    isLoading={deleting}
                    onClick={() => setConfirmDelete(true)}
                    className="min-h-[48px] px-4 text-[14px]"
                  >
                    <Trash2 size={18} strokeWidth={2.5} aria-hidden="true" />
                    <span>Hapus lebih awal</span>
                  </RfButton>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-1">
              <div className="bg-rf-bg border-2 border-rf-ink rounded-[12px] p-3.5 flex items-start gap-2.5">
                <Lock
                  size={18}
                  strokeWidth={2.5}
                  aria-hidden="true"
                  className="shrink-0 mt-0.5 text-rf-ink"
                />
                <p className="text-[14px] leading-[20px] font-bold text-rf-ink">
                  Hanya host ({result.hostName}) yang bisa mengunduh hasil ini.
                  Minta {result.hostName} mengirimkan file HD-nya kepadamu.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/app/result/${result.id}`}
                  className={`rf-btn ${
                    isPrimaryCta ? 'rf-btn--primary' : 'rf-btn--highlight'
                  } min-h-[48px] px-5 text-[16px]`}
                >
                  <ExternalLink size={18} strokeWidth={2.5} aria-hidden="true" />
                  <span>Lihat detail foto</span>
                </Link>

                {confirmDelete ? (
                  <div className="inline-flex flex-wrap items-center gap-2">
                    <RfButton
                      type="button"
                      variant="default"
                      isLoading={deleting}
                      onClick={handleDeleteEarly}
                      className="min-h-[48px] px-4 text-[14px] bg-rf-pink"
                    >
                      <Trash2 size={18} strokeWidth={2.5} aria-hidden="true" />
                      <span>Ya, hapus foto</span>
                    </RfButton>
                    <RfButton
                      type="button"
                      variant="default"
                      disabled={deleting}
                      onClick={() => setConfirmDelete(false)}
                      className="min-h-[48px] px-4 text-[14px]"
                    >
                      <span>Batal</span>
                    </RfButton>
                  </div>
                ) : (
                  <RfButton
                    type="button"
                    variant="default"
                    isLoading={deleting}
                    onClick={() => setConfirmDelete(true)}
                    className="min-h-[48px] px-4 text-[14px]"
                  >
                    <Trash2 size={18} strokeWidth={2.5} aria-hidden="true" />
                    <span>Hapus lebih awal</span>
                  </RfButton>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </RfCard>
  );
}

export interface ResultsGallerySectionProps {
  results: PhotoboothResult[];
  loading: boolean;
  currentUserId: string;
  onRefresh: () => void;
  onDeleted: (id: string) => void;
  onStartNewSession: () => void;
}

export function ResultsGallerySection({
  results,
  loading,
  currentUserId,
  onRefresh,
  onDeleted,
  onStartNewSession,
}: ResultsGallerySectionProps) {
  return (
    <div className="flex flex-col gap-8">
      {/* Header bagian hasil foto */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="rf-h1 text-rf-ink">Hasil foto kamu</h1>
            <RfBadge color="yellow">Tersimpan 1x24 jam</RfBadge>
          </div>
          <p className="rf-body text-rf-muted">
            Semua foto photostrip yang sudah selesai dapat kamu lihat dan unduh
            di sini sebelum terhapus otomatis dalam 24 jam.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <RfButton
            type="button"
            variant="default"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw size={18} strokeWidth={2.5} aria-hidden="true" />
            <span>Perbarui daftar</span>
          </RfButton>

          {results.length > 0 && (
            <RfButton
              type="button"
              variant="secondary"
              onClick={onStartNewSession}
            >
              <Camera size={18} strokeWidth={2.5} aria-hidden="true" />
              <span>Buat sesi baru</span>
            </RfButton>
          )}
        </div>
      </div>

      {/* State Memuat */}
      {loading ? (
        <RfCard
          color="white"
          aria-busy="true"
          className="flex flex-col gap-4 max-w-xl"
        >
          <p className="rf-h3 text-rf-ink">Memuat hasil foto…</p>
          <RfProgressBar
            value={60}
            color="teal"
            label="Memuat daftar hasil foto"
          />
        </RfCard>
      ) : results.length === 0 ? (
        /* Empty State: Belum ada foto atau sudah lewat 24 jam */
        <RfCard
          color="yellow"
          panelCorner="br"
          className="flex flex-col items-start gap-5 max-w-2xl"
        >
          <div className="w-14 h-14 rounded-[16px] bg-rf-white border-3 border-rf-ink shadow-hard-sm flex items-center justify-center">
            <Camera size={28} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="rf-h2 text-rf-ink">
              Belum ada hasil foto yang tersimpan
            </h2>
            <p className="rf-body text-rf-ink">
              Hasil foto sesi yang sudah selesai akan muncul di halaman ini
              selama 1x24 jam lengkap dengan penghitung waktu mundur dan tombol
              unduh HD. Yuk mulai sesi foto baru bersama pasanganmu!
            </p>
          </div>
          <RfButton
            type="button"
            variant="primary"
            onClick={onStartNewSession}
            className="min-h-[54px] px-6 text-[16px]"
          >
            <Sparkles size={22} strokeWidth={2.5} aria-hidden="true" />
            <span>Mulai sesi photobooth</span>
          </RfButton>
        </RfCard>
      ) : (
        /* Daftar Kartu Hasil Foto */
        <div className="flex flex-col gap-6">
          {results.map((item, idx) => (
            <ResultGalleryCard
              key={item.id}
              result={item}
              currentUserId={currentUserId}
              isPrimaryCta={idx === 0}
              onDeleted={onDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

