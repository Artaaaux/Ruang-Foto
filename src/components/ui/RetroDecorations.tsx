import React from 'react';

/**
 * Dekorasi Retro sesuai DesignRuangFoto.md Bagian 7:
 * - Bentuk geometris: bintang, kotak, titik, dan belah ketupat kecil (12–24px)
 *   berwarna palet dengan border 2px ink, tersebar di latar landing, login, dan halaman utama.
 * - Maksimal 8 per layar, jangan menutupi teks, wajib aria-hidden="true" dan pointer-events: none.
 */

export function RetroStar({
  color = '#FFE066',
  size = 20,
  className = '',
}: {
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke="#1A1A1A"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`.trim()}
    >
      <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" />
    </svg>
  );
}

export function RetroSquare({
  color = '#F59E5B',
  size = 16,
  className = '',
}: {
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, backgroundColor: color }}
      className={`inline-block border-2 border-rf-ink rounded-[3px] rotate-12 pointer-events-none select-none ${className}`.trim()}
    />
  );
}

export function RetroDiamond({
  color = '#36CFC0',
  size = 16,
  className = '',
}: {
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, backgroundColor: color }}
      className={`inline-block border-2 border-rf-ink rounded-[2px] rotate-45 pointer-events-none select-none ${className}`.trim()}
    />
  );
}

export function RetroDot({
  color = '#A78BFA',
  size = 14,
  className = '',
}: {
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, backgroundColor: color }}
      className={`inline-block border-2 border-rf-ink rounded-full pointer-events-none select-none ${className}`.trim()}
    />
  );
}
