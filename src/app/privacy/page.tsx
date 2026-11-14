import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { RfBadge, RfCard, RfLogo } from '@/components/ui/NeoPrimitives';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-rf-bg text-rf-ink">
      <header className="w-full border-b-3 border-rf-ink bg-rf-bg sticky top-0 z-20">
        <div className="max-w-content mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <RfLogo href="/" size="md" />

          <Link href="/" className="rf-btn min-h-[44px] px-4 text-[14px]">
            <ArrowLeft size={18} strokeWidth={2.5} aria-hidden="true" />
            <span>Kembali</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-content w-full mx-auto px-4 sm:px-6 py-10 lg:py-16">
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
          <RfCard
            color="yellow"
            panelCorner="br"
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <RfBadge color="white">UU Pelindungan Data Pribadi</RfBadge>
              <RfBadge color="teal">Privasi 1x24 jam</RfBadge>
            </div>
            <h1 className="rf-h1 text-rf-ink">Kebijakan privasi RuangFoto</h1>
            <p className="rf-body text-rf-ink">
              Terakhir diperbarui: 1 November 2026. Dokumen ini menjelaskan
              bagaimana RuangFoto memproses, melindungi, dan menghapus data
              pribadi kamu sesuai Undang-Undang Nomor 27 Tahun 2022 tentang
              Pelindungan Data Pribadi (UU PDP).
            </p>
          </RfCard>

          <RfCard color="white" className="flex flex-col gap-6">
            <section className="flex flex-col gap-2">
              <h2 className="rf-h3 text-rf-ink">
                1. Video langsung tidak pernah direkam
              </h2>
              <p className="rf-body text-rf-muted">
                Selama sesi photobooth berlangsung, aliran video dan suara
                mengalir secara langsung antar perangkat peserta (WebRTC
                peer-to-peer). RuangFoto tidak pernah merekam, menyadap, atau
                menyimpan aliran video maupun percakapan suara kamu di server.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="rf-h3 text-rf-ink">
                2. Penyimpanan foto sementara dan penghapusan 1x24 jam
              </h2>
              <p className="rf-body text-rf-muted">
                Hanya foto hasil jepretan pada saat hitungan mundur mencapai nol
                yang diunggah secara privat untuk digabungkan ke dalam template
                photostrip. Seluruh foto jepretan dan hasil gabungan dihapus
                secara otomatis dan permanen paling lambat 1x24 jam setelah sesi
                selesai. Kamu juga dapat menghapus foto lebih awal langsung dari
                layar hasil.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="rf-h3 text-rf-ink">
                3. Data akun dan hak pengguna
              </h2>
              <p className="rf-body text-rf-muted">
                Kami hanya menyimpan nama panggilan, alamat email, dan metode
                masuk (Google atau Email) agar kamu dapat membuat atau
                bergabung ke ruang sesi privat. Kata sandi selalu disimpan dalam
                bentuk hash terenkripsi. Kamu berhak menghapus akunmu kapan saja
                melalui menu Profil di halaman utama.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="rf-h3 text-rf-ink">
                4. Izin kamera dan mikrofon
              </h2>
              <p className="rf-body text-rf-muted">
                Akses kamera dan mikrofon hanya diminta saat kamu memasuki ruang
                sesi aktif, dan langsung dihentikan begitu kamu meninggalkan
                ruang sesi.
              </p>
            </section>

            <div className="pt-4 border-t-2 border-rf-ink flex items-center gap-3 text-[14px] font-bold text-rf-ink">
              <ShieldCheck size={20} strokeWidth={2.5} aria-hidden="true" />
              <span>
                Pertanyaan privasi dapat dikirimkan ke halo@ruangfoto.id
              </span>
            </div>
          </RfCard>
        </div>
      </main>
    </div>
  );
}
