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
    q: 'Apakah RuangFoto benar-benar 100% gratis?',
    a: 'Ya, sepenuhnya gratis! Tidak ada biaya pendaftaran, tidak ada paket berlangganan, dan tidak ada template yang dikunci paywall. RuangFoto dibuat agar pasangan LDR dan sahabat jarak jauh bisa punya kenangan photostrip tanpa terhalang biaya, dengan operasional yang didukung murni lewat donasi sukarela di Saweria.',
  },
  {
    q: 'Apakah pasangan saya harus menginstal aplikasi terlebih dahulu?',
    a: 'Tidak perlu instal aplikasi apa pun! RuangFoto berjalan langsung di browser HP (Chrome, Safari) maupun laptop. Pasanganmu cukup mengeklik link undangan yang kamu kirimkan dan masuk dengan akun Google atau email untuk langsung terhubung tatap muka.',
  },
  {
    q: 'Apakah kualitas fotonya lebih jernih dibanding screenshot video call?',
    a: 'Jauh lebih jernih dan tajam! Screenshot video call biasanya buram karena kompresi jaringan internet. Di RuangFoto, saat hitungan mundur 3-2-1 selesai, foto diambil langsung dari sensor kamera lokal di masing-masing perangkat pada resolusi penuh (HD 1080p), bukan dari tangkapan layar aliran video.',
  },
  {
    q: 'Apakah video langsung kami direkam atau disimpan?',
    a: 'Sama sekali tidak pernah. Aliran video dan audio berlangsung secara privat langsung di antara perangkat kamu dan pasanganmu selama sesi. RuangFoto tidak pernah merekam, memantau, atau menyimpan panggilan videomu. Hanya foto hasil jepretan saat hitungan mundur selesai yang disimpan sementara agar bisa digabung ke template.',
  },
  {
    q: 'Kenapa foto otomatis terhapus setelah 1x24 jam?',
    a: 'Dua alasan utama: menjaga privasi foto pribadimu agar tidak mengendap selamanya di server, serta menghemat kapasitas penyimpanan agar layanan ini tetap gratis untuk semua orang. Pastikan host mengunduh hasil photostrip sebelum batas 24 jam selesai.',
  },
  {
    q: 'Bagaimana cara mencetak hasil foto untuk ditempel di casing HP?',
    a: 'Hasil unduhan memiliki resolusi tinggi HD 1080p yang siap cetak. Kamu bisa mencetaknya di kertas foto ukuran 2R atau photostrip di percetakan terdekat, lalu selipkan di balik casing HP transparan kamu sebagai kenangan manis bersama pasangan!',
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
                    Gratis tanpa syarat
                  </RfSticker>
                  <RfSticker color="purple" rotateDeg={2}>
                    Hasil jernih HD 1080p
                  </RfSticker>
                </div>

                <h1 className="rf-display text-rf-ink">
                  Foto bareng, walau beda kota.
                </h1>

                <p className="rf-body text-rf-ink text-[18px] leading-[28px]">
                  Bilik photobox virtual untuk kamu dan doi atau sahabat. Tatap
                  muka lewat video langsung, hitung mundur 3-2-1 serempak, dan
                  unduh photostrip estetik dalam hitungan menit—langsung dari
                  browser HP tanpa instal aplikasi.
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
                    <span>Mulai foto bareng</span>
                  </RfButton>

                  <a href="#cara-kerja" className="rf-btn min-h-[54px] px-6">
                    <span>Lihat cara kerja</span>
                  </a>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3 text-[14px] leading-[20px] font-bold text-rf-ink">
                  <RfAvatarStack
                    users={[
                      {
                        name: 'Nadia Putri',
                        color: '#FFC9C4',
                        avatarUrl: '/avatars/nadia.svg',
                      },
                      {
                        name: 'Raka Pratama',
                        color: '#A78BFA',
                        avatarUrl: '/avatars/raka.svg',
                      },
                      {
                        name: 'Sinta Dewi',
                        color: '#36CFC0',
                        avatarUrl: '/avatars/sinta.svg',
                      },
                    ]}
                  />
                  <span>
                    100% privat · Tanpa rekam video · Foto terhapus otomatis 1x24 jam
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
                      <div className="w-12 h-12 rounded-full bg-rf-pink border-2 border-rf-ink shadow-hard-sm overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/avatars/nadia.svg"
                          alt="Nadia"
                          className="w-full h-full object-cover scale-110 translate-y-1"
                        />
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
                      <div className="w-12 h-12 rounded-full bg-rf-purple border-2 border-rf-ink shadow-hard-sm overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/avatars/raka.svg"
                          alt="Raka"
                          className="w-full h-full object-cover scale-110 translate-y-1"
                        />
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
              Tiga langkah mudah, langsung jadi photostrip
            </h2>
            <p className="rf-body text-rf-muted">
              Nggak pakai ribet instal aplikasi atau ngabisin memori HP. Selesai
              dalam hitungan menit langsung di browser kamu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RfCard color="white" className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="w-12 h-12 rounded-[12px] bg-rf-yellow border-3 border-rf-ink shadow-hard-sm inline-flex items-center justify-center text-[22px] font-bold text-rf-ink">
                  1
                </span>
                <RfBadge color="teal">Langkah 1 · Host</RfBadge>
              </div>
              <h3 className="rf-h3 text-rf-ink">Pilih template & buat link</h3>
              <p className="rf-body text-rf-muted">
                Masuk ke RuangFoto, tentukan bingkai favoritmu yang cocok dengan
                selera kalian, lalu klik Buat sesi untuk mendapatkan link unik
                privat.
              </p>
            </RfCard>

            <RfCard color="white" className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="w-12 h-12 rounded-[12px] bg-rf-purple border-3 border-rf-ink shadow-hard-sm inline-flex items-center justify-center text-[22px] font-bold text-rf-ink">
                  2
                </span>
                <RfBadge color="yellow">Langkah 2 · Host & Guest</RfBadge>
              </div>
              <h3 className="rf-h3 text-rf-ink">
                Kirim link ke pasanganmu
              </h3>
              <p className="rf-body text-rf-muted">
                Bagikan link lewat WhatsApp atau Instagram. Begitu pasanganmu
                membuka link dan mengizinkan kamera, kalian langsung terhubung
                tatap muka lewat video.
              </p>
            </RfCard>

            <RfCard color="white" className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="w-12 h-12 rounded-[12px] bg-rf-teal border-3 border-rf-ink shadow-hard-sm inline-flex items-center justify-center text-[22px] font-bold text-rf-ink">
                  3
                </span>
                <RfBadge color="purple">Langkah 3 · Hasil HD</RfBadge>
              </div>
              <h3 className="rf-h3 text-rf-ink">
                Hitung mundur & pose bareng
              </h3>
              <p className="rf-body text-rf-muted">
                Tekan tombol Siap bersama-sama, pasang pose terbaikmu saat
                countdown 3-2-1! Kamera lokal menjepret serentak dan otomatis
                merangkai photostrip HD.
              </p>
            </RfCard>
          </div>
        </section>

        {/* Bagian 3: Rincian Jasa / Tiga Pilar Nilai Jual (FR-01 & 6.1) */}
        <section className="max-w-content mx-auto px-4 sm:px-6 py-16 lg:py-24">
          <div className="flex flex-col gap-3 mb-10">
            <h2 className="rf-h1 text-rf-ink">
              Kenapa ribuan pejuang LDR memilih RuangFoto?
            </h2>
            <p className="rf-body text-rf-muted">
              Dirancang dari nol agar momen foto jarak jauh terasa hangat,
              seru, dan berkesan layaknya di bilik photobox sungguhan.
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
                  <RfBadge color="white">Favorit pengguna</RfBadge>
                  <RfBadge color="yellow">Video real-time</RfBadge>
                </div>
                <h3 className="rf-h2 text-rf-ink">
                  Bukan screenshot buram. Ini photobox sungguhan.
                </h3>
                <p className="rf-body text-rf-ink">
                  Lupakan tangkapan layar video call yang buram, pecah, dan
                  canggung. Di RuangFoto, kamu dan pasangan bisa saling
                  mengobrol, bercanda, dan mengatur gaya secara langsung. Saat
                  countdown selesai, sensor kamera memotret resolusi penuh
                  sehingga hasilnya tajam dan jernih.
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
                    Tatap muka bebas tanpa rekaman
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
                    Foto ulang sepuasnya sampai puas
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
                  Desain photostrip estetik & siap pamer
                </h3>
                <p className="rf-body text-rf-ink">
                  Pilihan bingkai Ceria Super Cute, Minimalis Momen Jauh, Retro
                  Klasik, hingga Romantis Beda Kota. Pas banget buat dibagikan
                  ke Instagram Story atau dicetak untuk diselipkan di casing HP
                  transparan kamu!
                </p>
              </RfCard>

              <RfCard color="white" className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <RfBadge color="teal">100% aman & gratis</RfBadge>
                  <ShieldCheck size={22} strokeWidth={2.5} aria-hidden="true" />
                </div>
                <h3 className="rf-h3 text-rf-ink">
                  Gratis penuh, privasi terjaga 1x24 jam
                </h3>
                <p className="rf-body text-rf-muted">
                  Tanpa biaya langganan, tanpa iklan, dan tanpa fitur yang
                  terkunci. Aliran video tidak pernah direkam, dan seluruh foto
                  otomatis dihapus permanen dalam 24 jam.
                </p>
              </RfCard>
            </div>
          </div>
        </section>

        {/* Bagian 4: Contoh Hasil Foto (3 photostrip sesuai DesignRuangFoto.md 6.1) */}
        <section className="max-w-content mx-auto px-4 sm:px-6 py-16 lg:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="flex flex-col gap-3">
              <h2 className="rf-h1 text-rf-ink">Koleksi photostrip favorit</h2>
              <p className="rf-body text-rf-muted">
                Dari nuansa pastel super cute hingga vintage retro, seluruh{' '}
                {INITIAL_TEMPLATES.length} template ini bebas kamu coba gratis
                bersama pasangan.
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
