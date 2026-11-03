'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Camera,
  ChevronDown,
  Clock,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  Wifi,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { INITIAL_TEMPLATES } from '@/lib/templates';
import {
  RfAvatarStack,
  RfBadge,
  RfButton,
  RfCard,
  RfSticker,
} from '@/components/ui/NeoPrimitives';
import {
  RetroDiamond,
  RetroDot,
  RetroSquare,
  RetroStar,
} from '@/components/ui/RetroDecorations';
import {
  PhotostripView,
  SupportCard,
} from '@/components/ruangfoto/DomainComponents';

const FAQ_ITEMS = [
  {
    q: 'Kenapa RuangFoto sepenuhnya gratis?',
    a: 'RuangFoto dibuat agar pasangan LDR dan sahabat yang terpisah jarak bisa punya kenangan photobooth tanpa terhalang biaya. Panggilan video mengalir langsung secara privat antara perangkatmu dan pasanganmu, sehingga biaya server tetap hemat dan bisa didukung sukarela lewat Saweria.',
  },
  {
    q: 'Kenapa foto dihapus otomatis setelah 1x24 jam?',
    a: 'Dua alasan utama: menjaga privasi foto pribadimu agar tidak tersimpan selamanya di server, serta menghemat ruang penyimpanan agar layanan ini tetap gratis untuk semua pengguna. Pastikan host mengunduh hasil foto sebelum 24 jam berakhir.',
  },
  {
    q: 'Apakah video langsung kami direkam atau disimpan?',
    a: 'Tidak pernah. Aliran video dan suara berlangsung secara langsung dan privat hanya di antara perangkat kamu dan pasanganmu selama sesi. RuangFoto tidak pernah merekam atau menyimpan video. Hanya foto hasil jepretan saat hitungan mundur selesai yang disimpan sementara untuk digabung ke template.',
  },
  {
    q: 'Kenapa hanya host yang bisa mengunduh hasil foto?',
    a: 'Host adalah pembuat ruang sesi yang memilih template dan mengelola jalannya sesi. Guest tetap bisa melihat hasil akhir photostrip secara penuh di layarnya, dan host dapat langsung membagikan file HD (1080p) yang sudah diunduh kepada guest.',
  },
  {
    q: 'Apakah kualitas fotonya buram seperti tangkapan layar video call?',
    a: 'Tidak. Saat hitungan mundur 3-2-1 selesai, RuangFoto memotret langsung dari sensor kamera lokal di perangkat masing-masing pada resolusi penuh, bukan menangkap layar aliran video.',
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleStartNow = () => {
    if (user) {
      router.push('/app');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-rf-bg text-rf-ink relative overflow-x-hidden">
      {/* Dekorasi Retro latar (Maksimal 6 di layar ini, <= 8 sesuai Bagian 7 & 12) */}
      <RetroStar
        color="#FFE066"
        size={22}
        className="hidden lg:block absolute top-28 left-8"
      />
      <RetroSquare
        color="#F59E5B"
        size={16}
        className="hidden lg:block absolute top-44 right-10"
      />
      <RetroDiamond
        color="#36CFC0"
        size={18}
        className="hidden lg:block absolute top-[620px] left-12"
      />
      <RetroDot
        color="#A78BFA"
        size={14}
        className="hidden lg:block absolute top-[980px] right-14"
      />
      <RetroStar
        color="#FF5C5C"
        size={20}
        className="hidden lg:block absolute bottom-80 left-10"
      />

      {/* Bilah Navigasi Atas */}
      <header className="w-full border-b-3 border-rf-ink bg-rf-bg sticky top-0 z-30">
        <div className="max-w-content mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-rf-ink no-underline group"
          >
            <span className="w-11 h-11 rounded-[12px] bg-rf-coral border-3 border-rf-ink shadow-hard-sm flex items-center justify-center group-hover:bg-rf-yellow transition-colors">
              <Camera
                size={22}
                strokeWidth={2.5}
                aria-hidden="true"
                className="text-rf-ink"
              />
            </span>
            <span className="text-[22px] leading-[28px] font-bold tracking-tight text-rf-ink">
              RuangFoto
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <RfButton
              type="button"
              variant="default"
              onClick={() => router.push(user ? '/app' : '/login')}
            >
              <span>{user ? 'Halaman utama' : 'Masuk'}</span>
            </RfButton>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Bagian 1: Hero dengan satu panel yellow besar bersudut 40px (DesignRuangFoto.md 6.1) */}
        <section className="max-w-content mx-auto px-4 sm:px-6 pt-8 pb-16 lg:pt-12 lg:pb-24">
          <div className="bg-rf-yellow border-3 border-rf-ink rounded-[20px] rounded-br-[40px] shadow-hard-lg p-6 sm:p-10 lg:p-12 rf-halftone">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              {/* Kolom Kiri: Teks rata kiri & CTA */}
              <div className="lg:col-span-7 flex flex-col items-start gap-6 text-left">
                <div className="flex flex-wrap items-center gap-2.5">
                  <RfSticker color="teal" rotateDeg={-2}>
                    Gratis selamanya
                  </RfSticker>
                  <RfSticker color="purple" rotateDeg={2}>
                    Kualitas HD 1080p
                  </RfSticker>
                </div>

                <h1 className="rf-display text-rf-ink">
                  Foto bareng, walau beda kota.
                </h1>

                <p className="rf-body text-rf-ink text-[18px] leading-[28px]">
                  Photobooth online gratis untuk kamu dan pasanganmu. Saling
                  lihat lewat video langsung, hitung mundur 3-2-1 serempak, lalu
                  unduh photostrip beresolusi penuh tanpa ribet mengedit.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  {/* Satu-satunya tombol utama (coral) di layar ini sesuai Bagian 4.1 & 11 */}
                  <RfButton
                    type="button"
                    variant="primary"
                    onClick={handleStartNow}
                    className="min-h-[54px] px-7 text-[18px]"
                  >
                    <Camera size={22} strokeWidth={2.5} aria-hidden="true" />
                    <span>Mulai foto</span>
                  </RfButton>

                  <a href="#cara-kerja" className="rf-btn min-h-[54px] px-6">
                    <span>Lihat cara kerja</span>
                  </a>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3 text-[14px] leading-[20px] font-bold text-rf-ink">
                  <RfAvatarStack
                    users={[
                      { name: 'Nadia Putri', color: '#FFC9C4' },
                      { name: 'Raka Pratama', color: '#A78BFA' },
                      { name: 'Sinta Dewi', color: '#36CFC0' },
                    ]}
                  />
                  <span>
                    Tanpa rekam video · Foto otomatis terhapus dalam 1x24 jam
                  </span>
                </div>
              </div>

              {/* Kolom Kanan: Photostrip miring -4° + 2 tile video pasangan (DesignRuangFoto.md 5.6 & 6.1) */}
              <div className="lg:col-span-5 relative flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-4 pt-2 lg:pt-0">
                {/* 2 Tile Video mini di belakang/samping */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-[340px]">
                  <div className="bg-rf-white border-3 border-rf-ink rounded-[16px] shadow-hard p-2.5 flex flex-col justify-between aspect-[4/3] relative overflow-hidden">
                    <div className="flex items-center justify-between gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rf-teal border border-rf-ink" />
                      <span className="bg-rf-teal border-2 border-rf-ink rounded-full px-2 py-0.5 text-[10px] font-bold text-rf-ink inline-flex items-center gap-1">
                        <Wifi size={10} strokeWidth={2.5} aria-hidden="true" />
                        Terhubung
                      </span>
                    </div>
                    <div className="my-auto flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-rf-pink border-2 border-rf-ink flex items-center justify-center font-bold text-[14px]">
                        NP
                      </div>
                    </div>
                    <span className="bg-rf-white border-2 border-rf-ink rounded-full px-2 py-0.5 text-[11px] font-bold text-rf-ink self-start">
                      Nadia · Jakarta
                    </span>
                  </div>

                  <div className="bg-rf-white border-3 border-rf-ink rounded-[16px] shadow-hard p-2.5 flex flex-col justify-between aspect-[4/3] relative overflow-hidden">
                    <div className="flex items-center justify-between gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rf-teal border border-rf-ink" />
                      <span className="bg-rf-yellow border-2 border-rf-ink rounded-full px-2 py-0.5 text-[10px] font-bold text-rf-ink">
                        Siap!
                      </span>
                    </div>
                    <div className="my-auto flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-rf-purple border-2 border-rf-ink flex items-center justify-center font-bold text-[14px]">
                        RP
                      </div>
                    </div>
                    <span className="bg-rf-white border-2 border-rf-ink rounded-full px-2 py-0.5 text-[11px] font-bold text-rf-ink self-start">
                      Raka · Bandung
                    </span>
                  </div>
                </div>

                {/* Photostrip utama miring -4° sedikit menimpa tile video */}
                <div className="w-full max-w-[260px] -mt-3 z-10">
                  <PhotostripView
                    template={INITIAL_TEMPLATES[0]}
                    hostName="Nadia"
                    guestName="Raka"
                    tiltedOnHero
                    compact
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bagian 2: Cara Kerja (3 langkah berurutan) */}
        <section
          id="cara-kerja"
          className="max-w-content mx-auto px-4 sm:px-6 py-16 lg:py-24"
        >
          <div className="flex flex-col gap-3 mb-10">
            <h2 className="rf-h1 text-rf-ink">
              Abadikan moment bersama orang tersayang
            </h2>
            <p className="rf-body text-rf-muted">
              Cukup ikuti 3 langkah mudah ini, selesai kurang dari 5 menit tanpa
              perlu instal aplikasi tambahan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RfCard color="white" className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="w-12 h-12 rounded-[12px] bg-rf-yellow border-3 border-rf-ink shadow-hard-sm inline-flex items-center justify-center text-[22px] font-bold text-rf-ink">
                  1
                </span>
                <RfBadge color="teal">Host</RfBadge>
              </div>
              <h3 className="rf-h3 text-rf-ink">Buat sesi dan pilih template</h3>
              <p className="rf-body text-rf-muted">
                Masuk ke RuangFoto, pilih bingkai photostrip favoritmu, lalu
                tekan tombol Buat sesi untuk mendapatkan link unik.
              </p>
            </RfCard>

            <RfCard color="white" className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="w-12 h-12 rounded-[12px] bg-rf-purple border-3 border-rf-ink shadow-hard-sm inline-flex items-center justify-center text-[22px] font-bold text-rf-ink">
                  2
                </span>
                <RfBadge color="yellow">Host & Guest</RfBadge>
              </div>
              <h3 className="rf-h3 text-rf-ink">
                Undang pasangan lewat link
              </h3>
              <p className="rf-body text-rf-muted">
                Kirim link ke pasanganmu lewat WhatsApp atau Instagram. Saat ia
                membuka link dan mengizinkan kamera, kalian langsung saling
                melihat lewat video.
              </p>
            </RfCard>

            <RfCard color="white" className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="w-12 h-12 rounded-[12px] bg-rf-teal border-3 border-rf-ink shadow-hard-sm inline-flex items-center justify-center text-[22px] font-bold text-rf-ink">
                  3
                </span>
                <RfBadge color="purple">Otomatis HD</RfBadge>
              </div>
              <h3 className="rf-h3 text-rf-ink">
                Pose serempak dan unduh hasil
              </h3>
              <p className="rf-body text-rf-muted">
                Tekan tombol Siap bersama-sama. Hitungan mundur 3-2-1 memotret
                dari kamera masing-masing dan langsung menggabungkannya ke
                photostrip.
              </p>
            </RfCard>
          </div>
        </section>

        {/* Bagian 3: Rincian Jasa / Tiga Pilar Nilai Jual (FR-01 & 6.1) */}
        <section className="max-w-content mx-auto px-4 sm:px-6 py-16 lg:py-24">
          <div className="flex flex-col gap-3 mb-10">
            <h2 className="rf-h1 text-rf-ink">
              Yang kamu dapat di RuangFoto
            </h2>
            <p className="rf-body text-rf-muted">
              Dirancang khusus supaya momen foto jarak jauh terasa hangat seperti di
              satu bilik photobooth sungguhan.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pilar 1 (Utama): Foto jarak jauh dengan video langsung */}
            <RfCard
              color="teal"
              className="lg:col-span-7 flex flex-col justify-between gap-6"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <RfBadge color="white">Paling favorit</RfBadge>
                  <RfBadge color="yellow">Tatap muka langsung</RfBadge>
                </div>
                <h3 className="rf-h2 text-rf-ink">
                  Sensasi photobooth asli, walau terpisah jarak
                </h3>
                <p className="rf-body text-rf-ink">
                  Bukan sekadar screenshot video call yang buram dan pecah! Kamu
                  dan pasangan bisa saling mengobrol, tertawa, dan mengatur pose
                  lucu secara langsung. Saat hitungan mundur selesai, kamera akan
                  jepret otomatis dengan kualitas foto jernih dan tajam layaknya
                  photobooth sungguhan.
                </p>
              </div>

              <div className="bg-rf-white border-3 border-rf-ink rounded-[16px] p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2.5">
                  <Video
                    size={20}
                    strokeWidth={2.5}
                    aria-hidden="true"
                    className="text-rf-ink shrink-0"
                  />
                  <span className="text-[14px] font-bold text-rf-ink">
                    Ngobrol bebas tanpa rekaman
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock
                    size={20}
                    strokeWidth={2.5}
                    aria-hidden="true"
                    className="text-rf-ink shrink-0"
                  />
                  <span className="text-[14px] font-bold text-rf-ink">
                    Hitungan 3-2-1 serempak
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Sparkles
                    size={20}
                    strokeWidth={2.5}
                    aria-hidden="true"
                    className="text-rf-ink shrink-0"
                  />
                  <span className="text-[14px] font-bold text-rf-ink">
                    Foto ulang sampai puas
                  </span>
                </div>
              </div>
            </RfCard>

            {/* Pilar 2 & 3 */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <RfCard color="yellow" className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <RfBadge color="white">
                    {INITIAL_TEMPLATES.length} template gratis
                  </RfBadge>
                  <Users size={22} strokeWidth={2.5} aria-hidden="true" />
                </div>
                <h3 className="rf-h3 text-rf-ink">
                  Template photostrip yang menarik
                </h3>
                <p className="rf-body text-rf-ink">
                  Pilih suasana Ceria Super Cute, Minimalis Momen Jauh, Retro
                  Klasik, atau Romantis Beda Kota. Semua foto digabung otomatis
                  di browser menjadi strip siap pamer.
                </p>
              </RfCard>

              <RfCard color="white" className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <RfBadge color="teal">Tanpa biaya</RfBadge>
                  <ShieldCheck size={22} strokeWidth={2.5} aria-hidden="true" />
                </div>
                <h3 className="rf-h3 text-rf-ink">
                  Gratis penuh & privasi terjaga 1x24 jam
                </h3>
                <p className="rf-body text-rf-muted">
                  Tidak ada langganan atau fitur yang dikunci. Seluruh foto
                  disimpan privat dan terhapus otomatis 24 jam setelah sesi
                  selesai.
                </p>
              </RfCard>
            </div>
          </div>
        </section>

        {/* Bagian 4: Contoh Hasil Foto (3 photostrip sesuai DesignRuangFoto.md 6.1) */}
        <section className="max-w-content mx-auto px-4 sm:px-6 py-16 lg:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="flex flex-col gap-3">
              <h2 className="rf-h1 text-rf-ink">Contoh hasil photostrip</h2>
              <p className="rf-body text-rf-muted">
                Seluruh {INITIAL_TEMPLATES.length} template ini langsung
                tersedia gratis begitu kamu masuk.
              </p>
            </div>
            <RfButton
              type="button"
              variant="highlight"
              onClick={handleStartNow}
            >
              <span>Coba semua template</span>
            </RfButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {[
              INITIAL_TEMPLATES.find((t) => t.id === 'frame-ceria-kawaii') ||
                INITIAL_TEMPLATES[0],
              INITIAL_TEMPLATES.find((t) => t.id === 'frame-minimalis-momen') ||
                INITIAL_TEMPLATES[1],
              INITIAL_TEMPLATES.find((t) => t.id === 'romantis-senja') ||
                INITIAL_TEMPLATES[2],
            ].map((tpl, index) => {
              const samplePairs = [
                { host: 'Nadia', guest: 'Raka' },
                { host: 'Alya', guest: 'Dimas' },
                { host: 'Tania', guest: 'Bima' },
              ][index % 3];

              return (
                <div key={tpl.id} className="flex flex-col gap-4">
                  <PhotostripView
                    template={tpl}
                    hostName={samplePairs.host}
                    guestName={samplePairs.guest}
                  />
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h3 className="rf-h3 text-rf-ink">{tpl.name}</h3>
                      <p className="text-[14px] text-rf-muted">
                        Kategori {tpl.category} · {tpl.poseCount} pose
                      </p>
                    </div>
                    <RfBadge color="teal">Gratis</RfBadge>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bagian 5: Panel Pink "Gratis, dukung seikhlasnya" (DesignRuangFoto.md 5.8 & 6.1) */}
        <section className="max-w-content mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <SupportCard buttonVariant="highlight" />
        </section>

        {/* Bagian 6: FAQ Akordeon (DesignRuangFoto.md 6.1 & PRD 7.1) */}
        <section className="max-w-content mx-auto px-4 sm:px-6 py-16 lg:py-24">
          <div className="flex flex-col gap-3 mb-10">
            <h2 className="rf-h1 text-rf-ink">Pertanyaan yang sering diajukan</h2>
            <p className="rf-body text-rf-muted">
              Jawaban singkat seputar privasi foto, cara pakai, dan dukungan
              komunitas.
            </p>
          </div>

          <div className="flex flex-col gap-4 max-w-3xl">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-rf-white border-3 border-rf-ink rounded-[20px] shadow-hard overflow-hidden"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className={`w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-[18px] leading-[24px] text-rf-ink transition-colors cursor-pointer ${
                      isOpen ? 'bg-rf-yellow' : 'bg-rf-white hover:bg-rf-bg'
                    }`}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={22}
                      strokeWidth={2.5}
                      aria-hidden="true"
                      className={`shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 py-4 border-t-3 border-rf-ink bg-rf-white">
                      <p className="rf-body text-rf-ink">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer: Kontak · Kebijakan Privasi · Syarat dan Ketentuan (PRD 7.1 & Design 6.1) */}
      <footer className="w-full border-t-3 border-rf-ink bg-rf-white mt-12">
        <div className="max-w-content mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-[8px] bg-rf-coral border-2 border-rf-ink flex items-center justify-center">
                <Camera size={16} strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span className="text-[18px] font-bold text-rf-ink">
                RuangFoto
              </span>
            </div>
            <p className="text-[14px] leading-[20px] text-rf-muted">
              Photobooth jarak jauh gratis. Video tidak direkam, foto terhapus
              otomatis dalam 1x24 jam.
            </p>
          </div>

          <nav
            aria-label="Tautan bawah halaman"
            className="flex flex-wrap items-center gap-6 text-[14px] leading-[20px] font-bold text-rf-ink"
          >
            <a
              href="mailto:halo@ruangfoto.id"
              className="hover:underline"
            >
              Kontak: halo@ruangfoto.id
            </a>
            <Link href="/privacy" className="hover:underline">
              Kebijakan privasi
            </Link>
            <Link href="/terms" className="hover:underline">
              Syarat dan ketentuan
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
