'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Heart,
  LayoutGrid,
  LogOut,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  getTemplateById,
  INITIAL_TEMPLATES,
} from '@/lib/templates';
import { TemplateCategory } from '@/lib/types';
import {
  RfAvatar,
  RfBadge,
  RfButton,
  RfCard,
  RfInput,
  RfProfileDropdown,
  RfTabs,
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
  TemplateCard,
} from '@/components/ruangfoto/DomainComponents';

export default function MainAppPage() {
  const {
    user,
    isLoading,
    selectedTemplateId,
    setSelectedTemplateId,
    logout,
    deleteAccount,
  } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    'photobooth' | 'template' | 'dukungan'
  >('photobooth');
  const [selectedCategory, setSelectedCategory] = useState<
    'Semua' | TemplateCategory
  >('Semua');
  const [creatingSession, setCreatingSession] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showProfilePanel, setShowProfilePanel] = useState(false);

  // Wajib login (FR-03 & DesignRuangFoto.md 6.3)
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-rf-bg flex items-center justify-center font-bold text-rf-ink">
        Memproses…
      </div>
    );
  }

  const currentTemplate = getTemplateById(selectedTemplateId);

  const filteredTemplates =
    selectedCategory === 'Semua'
      ? INITIAL_TEMPLATES
      : INITIAL_TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleCreateSession = async () => {
    setCreatingSession(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: currentTemplate.id,
          hostId: user.id,
          hostName: user.name,
          hostAvatarColor: user.avatarColor,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.session) {
        showToast(
          data.error || 'Gagal membuat sesi. Silakan coba lagi.',
          'error'
        );
        return;
      }
      showToast('Sesi dibuat', 'success');
      router.push(`/app/session/${data.session.code}`);
    } catch {
      showToast(
        'Koneksi terganggu saat membuat sesi. Periksa internetmu lalu coba lagi.',
        'error'
      );
    } finally {
      setCreatingSession(false);
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    const raw = joinCodeInput.trim();
    if (!raw) {
      setJoinError('Masukkan kode sesi atau tempel link undangan dari pasanganmu.');
      return;
    }

    // Ekstrak kode jika pengguna menempelkan URL penuh
    const match = raw.match(/\/app\/session\/([A-Za-z0-9-]+)/i);
    const code = (match ? match[1] : raw).toUpperCase();
    router.push(`/app/session/${code}`);
  };

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tpl = getTemplateById(id);
    showToast(`Template ${tpl.name} dipakai untuk sesi berikutnya`, 'success');
  };

  const handleLogout = async () => {
    await logout();
    showToast('Kamu sudah keluar dari akun', 'info');
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    await deleteAccount();
    showToast('Akun dan data lokalmu telah dihapus', 'info');
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-rf-bg text-rf-ink relative overflow-x-hidden">
      {/* Dekorasi Retro latar (Maksimal 4 <= 8 sesuai Bagian 7) */}
      <RetroStar
        color="#FFE066"
        size={20}
        className="hidden lg:block absolute top-28 left-10"
      />
      <RetroSquare
        color="#F59E5B"
        size={16}
        className="hidden lg:block absolute top-36 right-12"
      />
      <RetroDiamond
        color="#36CFC0"
        size={16}
        className="hidden lg:block absolute bottom-24 left-14"
      />
      <RetroDot
        color="#A78BFA"
        size={14}
        className="hidden lg:block absolute bottom-28 right-16"
      />

      {/* Bilah Atas: Logo, Tab, dan Avatar Dropdown (DesignRuangFoto.md 6.3) */}
      <header className="w-full border-b-3 border-rf-ink bg-rf-bg sticky top-0 z-30">
        <div className="max-w-content mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-rf-ink no-underline"
          >
            <span className="w-10 h-10 rounded-[12px] bg-rf-coral border-3 border-rf-ink shadow-hard-sm flex items-center justify-center">
              <Camera size={20} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="text-[20px] font-bold text-rf-ink">RuangFoto</span>
          </Link>

          <div className="order-3 md:order-2 w-full md:w-auto flex justify-center">
            <RfTabs
              ariaLabel="Menu utama RuangFoto"
              tabs={[
                {
                  id: 'photobooth',
                  label: 'Photobooth',
                  icon: (
                    <Camera size={18} strokeWidth={2.5} aria-hidden="true" />
                  ),
                },
                {
                  id: 'template',
                  label: 'Template',
                  icon: (
                    <LayoutGrid
                      size={18}
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  ),
                },
                {
                  id: 'dukungan',
                  label: 'Dukung RuangFoto',
                  icon: (
                    <Heart size={18} strokeWidth={2.5} aria-hidden="true" />
                  ),
                },
              ]}
              activeTab={activeTab}
              onChange={(id) => {
                setActiveTab(id as 'photobooth' | 'template' | 'dukungan');
                setShowProfilePanel(false);
              }}
            />
          </div>

          <div className="order-2 md:order-3">
            <RfProfileDropdown
              userName={user.name}
              userEmail={user.email}
              avatarColor={user.avatarColor}
              items={[
                {
                  label: 'Profil',
                  icon: <User size={18} strokeWidth={2.5} aria-hidden="true" />,
                  onClick: () => setShowProfilePanel((prev) => !prev),
                },
                {
                  label: 'Keluar',
                  icon: (
                    <LogOut size={18} strokeWidth={2.5} aria-hidden="true" />
                  ),
                  onClick: handleLogout,
                },
              ]}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-content w-full mx-auto px-4 sm:px-6 py-8 lg:py-12">
        {/* Panel Profil (jika diklik dari menu dropdown) */}
        {showProfilePanel && (
          <RfCard color="white" className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <RfAvatar
                  name={user.name}
                  color={user.avatarColor}
                  size="lg"
                />
                <div>
                  <h2 className="rf-h3 text-rf-ink">{user.name}</h2>
                  <p className="text-[14px] text-rf-muted">
                    {user.email} · Masuk dengan{' '}
                    {user.loginMethod === 'google' ? 'Google' : 'Email'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <RfButton
                  type="button"
                  variant="default"
                  onClick={handleDeleteAccount}
                >
                  <Trash2 size={18} strokeWidth={2.5} aria-hidden="true" />
                  <span>Hapus akun saya</span>
                </RfButton>
                <RfButton
                  type="button"
                  variant="highlight"
                  onClick={() => setShowProfilePanel(false)}
                >
                  <span>Tutup profil</span>
                </RfButton>
              </div>
            </div>
          </RfCard>
        )}

        {/* TAB 1: Photobooth (DesignRuangFoto.md 6.3) */}
        {activeTab === 'photobooth' && (
          <div
            role="tabpanel"
            id="tabpanel-photobooth"
            aria-labelledby="tab-photobooth"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Kolom Kiri: Mulai sesi baru + Gabung sesi */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <RfCard
                color="yellow"
                panelCorner="br"
                className="flex flex-col gap-5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <RfBadge color="white">Siap memotret</RfBadge>
                  <RfBadge color="teal">Kualitas HD 1080p</RfBadge>
                </div>

                <div className="flex flex-col gap-2">
                  <h1 className="rf-h1 text-rf-ink">Mulai sesi baru</h1>
                  <p className="rf-body text-rf-ink">
                    Belum ada sesi. Buat sesi lalu kirim linknya ke pasanganmu.
                  </p>
                </div>

                {/* Baris info template yang dipakai */}
                <div className="bg-rf-white border-3 border-rf-ink rounded-[16px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-bold text-rf-muted">
                      Template dipilih
                    </p>
                    <p className="text-[18px] font-bold text-rf-ink">
                      {currentTemplate.name} ({currentTemplate.poseCount} pose)
                    </p>
                  </div>
                  <RfButton
                    type="button"
                    variant="secondary"
                    onClick={() => setActiveTab('template')}
                    className="min-h-[44px] px-4 text-[14px]"
                  >
                    <span>Ganti template</span>
                  </RfButton>
                </div>

                {/* Satu-satunya tombol utama (coral) di tab ini */}
                <RfButton
                  type="button"
                  variant="primary"
                  isLoading={creatingSession}
                  onClick={handleCreateSession}
                  className="w-full min-h-[54px] text-[18px]"
                >
                  <Sparkles size={22} strokeWidth={2.5} aria-hidden="true" />
                  <span>Buat sesi</span>
                </RfButton>

                <p className="text-[14px] leading-[20px] font-medium text-rf-ink">
                  Video tidak direkam. Hanya foto yang disimpan, dan terhapus
                  dalam 1x24 jam.
                </p>
              </RfCard>

              {/* Kartu pendukung: Punya link/kode undangan dari pasangan? */}
              <RfCard color="white" className="flex flex-col gap-4">
                <h2 className="rf-h3 text-rf-ink">
                  Diundang oleh pasanganmu?
                </h2>
                <p className="text-[14px] leading-[20px] text-rf-muted">
                  Tempel link undangan atau masukkan kode sesi (contoh:
                  ABC-123) untuk langsung bergabung sebagai guest.
                </p>
                <form
                  onSubmit={handleJoinByCode}
                  className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
                >
                  <div className="flex-1">
                    <RfInput
                      label="Kode atau link sesi"
                      placeholder="Contoh: KLM-892"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value)}
                      errorText={joinError}
                    />
                  </div>
                  <RfButton
                    type="submit"
                    variant="highlight"
                    className="shrink-0"
                  >
                    <span>Masuk sesi</span>
                  </RfButton>
                </form>
              </RfCard>
            </div>

            {/* Kolom Kanan: Pratinjau Template Dipakai */}
            <div className="lg:col-span-5">
              <RfCard color="white" className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="rf-h3 text-rf-ink">Template dipakai</h2>
                  <RfBadge color="teal">Gratis</RfBadge>
                </div>
                <p className="text-[14px] leading-[20px] text-rf-muted">
                  {currentTemplate.description}
                </p>
                <div className="max-w-[260px] mx-auto w-full py-2">
                  <PhotostripView
                    template={currentTemplate}
                    hostName={user.name.split(' ')[0]}
                    guestName="Pasangan"
                  />
                </div>
              </RfCard>
            </div>
          </div>
        )}

        {/* TAB 2: Template (DesignRuangFoto.md 5.7 & 6.3, PRD 7.3 B) */}
        {activeTab === 'template' && (
          <div
            role="tabpanel"
            id="tabpanel-template"
            aria-labelledby="tab-template"
            className="flex flex-col gap-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h1 className="rf-h1 text-rf-ink">Pilih template photostrip</h1>
                <p className="rf-body text-rf-muted">
                  Tersedia {INITIAL_TEMPLATES.length} template gratis. Template yang kamu
                  pilih otomatis dipakai pada sesi berikutnya.
                </p>
              </div>

              {/* Filter kategori */}
              <div className="flex flex-wrap items-center gap-2">
                {(['Semua', 'Retro', 'Romantis', 'Ceria', 'Minimalis'] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`h-11 px-4 rounded-full border-2 border-rf-ink text-[14px] font-bold transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-rf-yellow text-rf-ink shadow-hard-sm'
                          : 'bg-rf-white text-rf-ink hover:bg-rf-pink'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredTemplates.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  template={tpl}
                  isSelected={tpl.id === currentTemplate.id}
                  onSelect={handleSelectTemplate}
                />
              ))}
            </div>

            <div className="flex justify-end">
              {/* Satu-satunya tombol utama (coral) di tab Template */}
              <RfButton
                type="button"
                variant="primary"
                isLoading={creatingSession}
                onClick={handleCreateSession}
              >
                <Camera size={20} strokeWidth={2.5} aria-hidden="true" />
                <span>Buat sesi dengan {currentTemplate.name}</span>
              </RfButton>
            </div>
          </div>
        )}

        {/* TAB 3: Dukung RuangFoto (DesignRuangFoto.md 5.8 & 6.3, PRD 7.3 C & 8) */}
        {activeTab === 'dukungan' && (
          <div
            role="tabpanel"
            id="tabpanel-dukungan"
            aria-labelledby="tab-dukungan"
            className="flex flex-col gap-8 max-w-3xl mx-auto"
          >
            <SupportCard buttonVariant="primary" />

            <RfCard color="white" className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  size={24}
                  strokeWidth={2.5}
                  aria-hidden="true"
                  className="text-rf-ink"
                />
                <h2 className="rf-h3 text-rf-ink">
                  Komitmen gratis dan transparan
                </h2>
              </div>
              <p className="rf-body text-rf-muted">
                Seluruh fitur RuangFoto—mulai dari video langsung dua arah,
                semua pilihan template photostrip, foto ulang tanpa batas,
                hingga unduhan resolusi penuh HD (1080p)—diberikan secara gratis
                kepada semua pengguna.
              </p>
              <p className="rf-body text-rf-muted">
                Sesuai ketentuan Saweria, dukungan yang kamu berikan bersifat
                sukarela murni seperti kotak apresiasi untuk membantu biaya sewa
                server STUN/TURN dan penyimpanan sementara, serta tidak ditukar
                dengan fitur eksklusif apa pun.
              </p>
            </RfCard>
          </div>
        )}
      </main>
    </div>
  );
}
