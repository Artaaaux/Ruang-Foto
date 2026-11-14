'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  Clock,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  Wifi,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { INITIAL_TEMPLATES } from '@/lib/templates';
import {
  RfAvatarStack,
  RfBadge,
  RfButton,
  RfCard,
  RfLogo,
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
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [guestSessionCode, setGuestSessionCode] = useState('');
  const [guestCodeError, setGuestCodeError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || navigator.vendor || '';
      const isSocialWebview =
        /Instagram|FBAN|FBAV|TikTok|Line|Snapchat/i.test(ua);
      if (isSocialWebview) {
        setIsInAppBrowser(true);
      }
    }
  }, []);

  const handleCopyLink = async () => {
    if (typeof window !== 'undefined') {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } catch {
        // Fallback jika permission clipboard dibatasi
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    }
  };

  const handleStartNow = () => {
    setIsNavigating(true);
    if (user) {
      router.push('/app');
    } else {
      router.push('/login');
    }
  };

  const handleTryDemo = () => {
    setIsNavigating(true);
    if (user) {
      router.push('/app');
    } else {
      router.push('/login?demo=1');
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = guestSessionCode.trim().toUpperCase();
    if (!cleanCode) {
      setGuestCodeError('Masukkan kode sesi terlebih dahulu');
      return;
    }
    if (cleanCode.length !== 6) {
      setGuestCodeError('Kode sesi harus terdiri dari 6 karakter');
      return;
    }
    setGuestCodeError('');
    setIsNavigating(true);
    router.push(`/app/session/${cleanCode}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-rf-bg text-rf-ink relative overflow-x-hidden">
      {/* Peringatan In-App Browser (Instagram / TikTok / LINE Webview) */}
      {isInAppBrowser && (
        <aside
          aria-label="Peringatan peramban aplikasi"
          className="w-full bg-rf-yellow border-b-3 border-rf-ink px-4 py-2.5 z-40 sticky top-0"
        >
          <div className="max-w-content mx-auto flex flex-wrap items-center justify-between gap-3 text-rf-ink">
            <div className="flex items-center gap-2.5 text-[14px] font-bold">
              <span className="w-6 h-6 rounded-full bg-rf-coral border-2 border-rf-ink flex items-center justify-center shrink-0 text-rf-ink">
                <AlertTriangle size={14} strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span>
                Kamu membuka dari aplikasi lain. Buka di Chrome atau Safari agar
                kamera & login Google lancar.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-1.5 bg-rf-white border-2 border-rf-ink rounded-[10px] shadow-hard-sm text-[13px] font-bold text-rf-ink hover:bg-rf-bg active:translate-x-0.5 active:translate-y-0.5 transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                    <span>Tautan disalin!</span>
                  </>
                ) : (
                  <span>Salin tautan</span>
                )}
              </button>
              <button
                type="button"
                aria-label="Tutup peringatan peramban"
                onClick={() => setIsInAppBrowser(false)}
                className="w-7 h-7 rounded-full bg-rf-white border-2 border-rf-ink flex items-center justify-center text-rf-ink hover:bg-rf-bg active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                <X size={14} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Dekorasi Retro latar */}
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
          <RfLogo href="/" size="lg" />

          <div className="flex items-center gap-3">
            <RfButton
              type="button"
              variant="default"
              onClick={() => {
                setIsNavigating(true);
                router.push(user ? '/app' : '/login');
              }}
              isLoading={isNavigating}
            >
              <span>{user ? 'Halaman utama' : 'Masuk'}</span>
            </RfButton>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Bagian 1: Hero dengan satu panel yellow besar bersudut 40px (DesignRuangFoto.md 6.1) */}
        <section className="max-w-content mx-auto px-4 sm:px-6 pt-4 pb-12 sm:pt-6 sm:pb-14 lg:pt-12 lg:pb-24">
          <div className="bg-rf-yellow border-3 border-rf-ink rounded-[20px] rounded-br-[40px] shadow-hard-lg p-5 sm:p-8 lg:p-12 rf-halftone">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
              {/* Kolom Kiri: Teks rata kiri & CTA */}
              <div className="lg:col-span-7 flex flex-col items-start gap-5 sm:gap-6 text-left">
                <div className="flex flex-wrap items-center gap-2.5">
                  <RfSticker color="teal" rotateDeg={-2}>
                    100% Gratis, Tanpa Paywall
                  </RfSticker>
                  <RfSticker color="purple" rotateDeg={2}>
                    Hasil Jernih HD 1080p
                  </RfSticker>
                </div>

                <h1 className="rf-display text-rf-ink text-[38px] sm:text-[48px] lg:text-[64px] leading-[1.08] sm:leading-[1.05] tracking-tight">
                  Foto bareng, walau beda kota.
                </h1>

                <p className="rf-body text-rf-ink text-[16px] sm:text-[18px] leading-[24px] sm:leading-[28px] max-w-xl">
                  Bilik photobox virtual untuk kamu dan doi atau sahabat. Tatap
                  muka lewat video langsung, hitung mundur 3-2-1 serempak, dan
                  simpan photostrip estetik dalam hitungan menit—langsung dari
                  browser HP tanpa instal aplikasi.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 w-full sm:w-auto">
                  {/* Satu-satunya tombol utama (coral) di layar ini sesuai Bagian 4.1 & 11 */}
                  <RfButton
                    type="button"
                    variant="primary"
                    onClick={handleStartNow}
                    isLoading={isNavigating}
                    className="min-h-[52px] sm:min-h-[54px] px-8 text-[17px] sm:text-[18px] justify-center"
                  >
                    <Camera size={22} strokeWidth={2.5} aria-hidden="true" />
                    <span>Mulai foto bareng</span>
                  </RfButton>

                  <a
                    href="#cara-kerja"
                    className="rf-btn min-h-[52px] sm:min-h-[54px] px-6 text-[15px] sm:text-[16px] justify-center text-center"
                  >
                    <span>Lihat cara kerja</span>
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-[20px] font-semibold text-rf-ink/80 -mt-1 sm:-mt-2">
                  <span>Masuk 1-klik Google · Pasanganmu masuk via link</span>
                  <span className="hidden sm:inline" aria-hidden="true">
                    ·
                  </span>
                  <button
                    type="button"
                    onClick={handleTryDemo}
                    className="underline hover:text-rf-ink font-bold cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Coba demo sendiri</span>
                  </button>
                </div>

                <div className="pt-1 flex flex-wrap items-center gap-3 text-[14px] leading-[20px] font-bold text-rf-ink">
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
                    Video langsung privat (tanpa rekam) · Foto terhapus otomatis 1x24 jam
                  </span>
                </div>
              </div>

              {/* Kolom Kanan: Photostrip miring -4° + 2 tile video pasangan */}
              <div className="lg:col-span-5 relative flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-4 pt-2 lg:pt-0">
                {/* 2 Tile Video mini di belakang/samping bergaya Retro Booth Viewfinder */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-[340px] relative">
                  {/* Retro Live Countdown Indicator Badge over tiles */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20"
                  >
                    <div className="w-12 h-12 rounded-full bg-rf-yellow border-3 border-rf-ink shadow-hard flex items-center justify-center text-[22px] font-bold text-rf-ink animate-pulse">
                      2
                    </div>
                    <span className="mt-1 bg-rf-white border-2 border-rf-ink rounded-full px-2.5 py-0.5 text-[10px] font-bold text-rf-ink shadow-hard-sm">
                      Siap-siap!
                    </span>
                  </div>

                  {/* Tile 1: Nadia (Host) - Jakarta */}
                  <div className="bg-rf-white border-3 border-rf-ink rounded-[16px] shadow-hard p-2.5 flex flex-col justify-between aspect-[4/3] relative overflow-hidden">
                    {/* Viewfinder corner brackets */}
                    <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t-2 border-l-2 border-rf-ink/25 pointer-events-none" />
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t-2 border-r-2 border-rf-ink/25 pointer-events-none" />
                    <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b-2 border-l-2 border-rf-ink/25 pointer-events-none" />
                    <div className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b-2 border-r-2 border-rf-ink/25 pointer-events-none" />

                    {/* Header: Live indicator, Name, City, & Status */}
                    <div className="flex items-start justify-between gap-1 z-10">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rf-teal opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rf-teal" />
                          </span>
                          <span className="text-[12px] font-bold text-rf-ink leading-none truncate">
                            Nadia
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-rf-muted pl-3.5 pt-1 leading-none tracking-tight">
                          Jakarta
                        </span>
                      </div>
                      <span className="bg-rf-teal border-2 border-rf-ink rounded-full px-2 py-0.5 text-[9px] font-bold text-rf-ink inline-flex items-center gap-1 shrink-0 shadow-hard-sm">
                        <Wifi size={9} strokeWidth={2.5} aria-hidden="true" />
                        Live
                      </span>
                    </div>

                    {/* Avatar with retro circular focus ring */}
                    <div className="my-auto flex flex-col items-center justify-center relative py-0.5">
                      <div className="w-[50px] h-[50px] rounded-full bg-rf-pink border-2 border-rf-ink shadow-hard-sm overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/avatars/nadia.svg"
                          alt="Nadia"
                          className="w-full h-full object-cover scale-110 translate-y-1"
                        />
                      </div>
                    </div>

                    {/* Subtle camera bezel metadata */}
                    <div
                      aria-hidden="true"
                      className="flex items-center justify-between text-[10px] font-bold tracking-wider text-rf-ink/60 px-0.5 select-none"
                    >
                      <span>CAM 01</span>
                      <span>HD 1080P</span>
                    </div>
                  </div>

                  {/* Tile 2: Raka (Guest) - Bandung */}
                  <div className="bg-rf-white border-3 border-rf-ink rounded-[16px] shadow-hard p-2.5 flex flex-col justify-between aspect-[4/3] relative overflow-hidden">
                    {/* Viewfinder corner brackets */}
                    <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t-2 border-l-2 border-rf-ink/25 pointer-events-none" />
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t-2 border-r-2 border-rf-ink/25 pointer-events-none" />
                    <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b-2 border-l-2 border-rf-ink/25 pointer-events-none" />
                    <div className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b-2 border-r-2 border-rf-ink/25 pointer-events-none" />

                    {/* Header: Live indicator, Name, City, & Status */}
                    <div className="flex items-start justify-between gap-1 z-10">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rf-teal opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rf-teal" />
                          </span>
                          <span className="text-[12px] font-bold text-rf-ink leading-none truncate">
                            Raka
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-rf-muted pl-3.5 pt-1 leading-none tracking-tight">
                          Bandung
                        </span>
                      </div>
                      <span className="bg-rf-yellow border-2 border-rf-ink rounded-full px-2 py-0.5 text-[9px] font-bold text-rf-ink shrink-0 shadow-hard-sm">
                        Siap!
                      </span>
                    </div>

                    {/* Avatar with retro circular focus ring */}
                    <div className="my-auto flex flex-col items-center justify-center relative py-0.5">
                      <div className="w-[50px] h-[50px] rounded-full bg-rf-purple border-2 border-rf-ink shadow-hard-sm overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/avatars/raka.svg"
                          alt="Raka"
                          className="w-full h-full object-cover scale-110 translate-y-1"
                        />
                      </div>
                    </div>

                    {/* Subtle camera bezel metadata */}
                    <div
                      aria-hidden="true"
                      className="flex items-center justify-between text-[10px] font-bold tracking-wider text-rf-ink/60 px-0.5 select-none"
                    >
                      <span>CAM 02</span>
                      <span>SYNCED</span>
                    </div>
                  </div>
                </div>

                {/* Photostrip utama miring -4° sedikit menimpa tile video */}
                <div
                  aria-hidden="true"
                  className="w-full max-w-[260px] -mt-2 z-10"
                >
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
          className="max-w-content mx-auto px-4 sm:px-6 py-14 lg:py-20"
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
                <RfBadge color="teal">Langkah 1 · Buat link</RfBadge>
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
                <RfBadge color="yellow">Langkah 2 · Kirim ke doi</RfBadge>
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
                <RfBadge color="purple">Langkah 3 · Pose berdua</RfBadge>
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

          {/* Kotak Edukasi Khusus Guest (Pasangan yang Diundang) */}
          <div className="mt-8 bg-rf-pink border-3 border-rf-ink rounded-[20px] p-6 shadow-hard-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-[14px] bg-rf-white border-3 border-rf-ink shadow-hard-sm flex items-center justify-center shrink-0">
                <HeartHandshake
                  size={24}
                  strokeWidth={2.5}
                  aria-hidden="true"
                  className="text-rf-ink"
                />
              </div>
              <div className="flex flex-col gap-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <h3 className="rf-h3 text-rf-ink">
                    Diundang oleh pasangan atau sahabatmu?
                  </h3>
                  <RfBadge color="white" className="hidden sm:inline-flex">
                    Untuk yang diundang
                  </RfBadge>
                </div>
                <p className="rf-body text-rf-ink text-[15px]">
                  Kamu nggak perlu instal apa pun. Cukup klik tautan undangan yang dikirimkan, atau masukkan kode sesi 6-karakter di samping untuk langsung bergabung tatap muka.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleJoinByCode}
              className="w-full lg:w-auto flex flex-col gap-2 shrink-0"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  type="text"
                  value={guestSessionCode}
                  onChange={(e) => {
                    setGuestSessionCode(e.target.value.toUpperCase());
                    if (guestCodeError) setGuestCodeError('');
                  }}
                  placeholder="KODE (6 HURUF)"
                  maxLength={6}
                  aria-label="Kode sesi photobooth 6 karakter"
                  className="h-[48px] px-4 bg-rf-white border-3 border-rf-ink rounded-[12px] text-rf-ink font-bold tracking-widest text-[16px] text-center uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-rf-muted shadow-hard-sm focus:outline-none focus:ring-2 focus:ring-rf-ink"
                />
                <RfButton
                  type="submit"
                  variant="default"
                  isLoading={isNavigating}
                  className="min-h-[48px] px-5 whitespace-nowrap justify-center"
                >
                  <span>Gabung sesi</span>
                </RfButton>
              </div>
              {guestCodeError && (
                <span className="text-[13px] font-bold text-rf-coral flex items-center gap-1.5 pl-1">
                  <AlertTriangle size={14} strokeWidth={2.5} aria-hidden="true" />
                  {guestCodeError}
                </span>
              )}
            </form>
          </div>
        </section>

        {/* Bagian 3: Rincian Jasa / Tiga Pilar Nilai Jual (FR-01 & 6.1) */}
        <section className="max-w-content mx-auto px-4 sm:px-6 py-14 lg:py-20">
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
        <section className="max-w-content mx-auto px-4 sm:px-6 py-14 lg:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="flex flex-col gap-3">
              <h2 className="rf-h1 text-rf-ink">Koleksi photostrip favorit</h2>
              <p className="rf-body text-rf-muted">
                Dari nuansa pastel super cute hingga vintage retro, seluruh{' '}
                {INITIAL_TEMPLATES.length} template ini bebas kamu coba gratis
                bersama pasangan. Siap cetak ukuran 2R untuk diselipkan di balik
                casing HP transparanmu!
              </p>
            </div>
            <RfButton
              type="button"
              variant="highlight"
              onClick={handleStartNow}
              isLoading={isNavigating}
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
                  <div aria-hidden="true">
                    <PhotostripView
                      template={tpl}
                      hostName={samplePairs.host}
                      guestName={samplePairs.guest}
                    />
                  </div>
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

        {/* Bagian 5: FAQ Akordeon (DesignRuangFoto.md 6.1 & PRD 7.1) */}
        <section className="max-w-content mx-auto px-4 sm:px-6 py-14 lg:py-20">
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
                    id={`faq-btn-${idx}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${idx}`}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className={`w-full px-5 py-4 text-left flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                      isOpen ? 'bg-rf-yellow' : 'bg-rf-white hover:bg-rf-bg'
                    }`}
                  >
                    <span className="font-bold text-[18px] leading-[24px] text-rf-ink">
                      {item.q}
                    </span>
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
                    <div
                      id={`faq-panel-${idx}`}
                      role="region"
                      aria-labelledby={`faq-btn-${idx}`}
                      className="px-5 py-4 border-t-3 border-rf-ink bg-rf-white"
                    >
                      <p className="rf-body text-rf-ink">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bagian 6: Penutup Emosional & Closing CTA (Peak-End Rule) */}
        <section className="max-w-content mx-auto px-4 sm:px-6 py-10 lg:py-16">
          <div className="bg-rf-yellow border-3 border-rf-ink rounded-[20px] rounded-tl-[40px] shadow-hard-lg p-6 sm:p-10 lg:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rf-halftone">
            <div className="flex flex-col gap-2.5 max-w-xl text-left">
              <div className="flex items-center gap-2">
                <RfBadge color="white">Momen Berharga</RfBadge>
                <RfBadge color="teal">100% Gratis</RfBadge>
              </div>
              <h2 className="rf-h2 text-rf-ink">
                Malam minggu ini, jangan cuma video call biasa.
              </h2>
              <p className="rf-body text-rf-ink text-[16px] sm:text-[18px] leading-[24px] sm:leading-[28px]">
                Bikin kenangan photostrip estetik berdua dalam 3 menit. Bebas
                biaya, tanpa instal aplikasi, langsung dari browser HP kamu.
              </p>
            </div>
            <div className="shrink-0 w-full md:w-auto">
              <RfButton
                type="button"
                variant="default"
                onClick={handleStartNow}
                isLoading={isNavigating}
                className="w-full md:w-auto min-h-[54px] px-8 text-[18px]"
              >
                <Camera size={22} strokeWidth={2.5} aria-hidden="true" />
                <span>Mulai foto sekarang</span>
              </RfButton>
            </div>
          </div>
        </section>

        {/* Bagian 7: Panel Dukungan Saweria (DesignRuangFoto.md 5.8 & 6.1) */}
        <section className="max-w-content mx-auto px-4 sm:px-6 pb-12 lg:pb-16">
          <SupportCard buttonVariant="highlight" />
        </section>
      </main>

      {/* Footer: Kontak · Kebijakan Privasi · Syarat dan Ketentuan (PRD 7.1 & Design 6.1) */}
      <footer className="w-full border-t-3 border-rf-ink bg-rf-white mt-8">
        <div className="max-w-content mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <RfLogo href="/" size="sm" />
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
