'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Camera, CheckCircle2, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  RfButton,
  RfCard,
  RfCheckbox,
  RfInput,
  RfTabs,
} from '@/components/ui/NeoPrimitives';
import {
  RetroDiamond,
  RetroDot,
  RetroSquare,
  RetroStar,
} from '@/components/ui/RetroDecorations';

function GoogleMarkIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}

function LoginContent() {
  const {
    user,
    isLoading,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    verifyEmailAccount,
    resendVerificationEmail,
    requestPasswordReset,
  } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/app';

  const [activeTab, setActiveTab] = useState<'masuk' | 'daftar'>('masuk');
  const [viewMode, setViewMode] = useState<'form' | 'verify' | 'reset'>('form');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(redirectPath);
    }
  }, [isLoading, user, redirectPath, router]);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await loginWithGoogle(name.trim() || undefined);
      if (!res.ok) {
        setErrorMsg(res.error || 'Gagal masuk dengan Google.');
        return;
      }
      showToast('Berhasil masuk dengan Google', 'success');
      router.push(redirectPath);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (activeTab === 'masuk') {
      setSubmitting(true);
      try {
        const res = await loginWithEmail(email, password);
        if (!res.ok) {
          if (res.needsVerification) {
            setViewMode('verify');
          }
          setErrorMsg(res.error || 'Gagal masuk.');
          return;
        }
        showToast('Selamat datang kembali di RuangFoto', 'success');
        router.push(redirectPath);
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!agreedTerms) {
        setErrorMsg(
          'Centang persetujuan kebijakan privasi dan syarat ketentuan untuk mendaftar.'
        );
        return;
      }
      setSubmitting(true);
      try {
        const res = await registerWithEmail(name, email, password);
        if (!res.ok) {
          setErrorMsg(res.error || 'Gagal mendaftar.');
          return;
        }
        setViewMode('verify');
        showToast('Tautan verifikasi dikirim ke email kamu', 'info');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleResendVerification = async () => {
    setSubmitting(true);
    try {
      await resendVerificationEmail(email);
      showToast('Email verifikasi dikirim ulang. Cek kotak masukmu.', 'info');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteVerification = async () => {
    setSubmitting(true);
    try {
      const res = await verifyEmailAccount(email);
      if (!res.ok) {
        setErrorMsg(res.error || 'Gagal memverifikasi email.');
        return;
      }
      showToast('Email terverifikasi! Akun kamu sudah aktif.', 'success');
      router.push(redirectPath);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await requestPasswordReset(email);
      if (!res.ok) {
        setErrorMsg(res.error || 'Gagal mengirim tautan reset.');
        return;
      }
      showToast(
        'Tautan reset kata sandi telah dikirim ke kotak masuk emailmu.',
        'success'
      );
      setViewMode('form');
      setActiveTab('masuk');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-rf-bg text-rf-ink flex flex-col justify-between relative overflow-hidden px-4 py-6">
      {/* Aksen dekoratif mengelilingi kartu login (Maksimal 6 <= 8 sesuai DesignRuangFoto.md 6.2 & 7) */}
      <RetroDiamond
        color="#36CFC0"
        size={20}
        className="hidden sm:block absolute top-20 left-16"
      />
      <RetroStar
        color="#FFE066"
        size={24}
        className="hidden sm:block absolute top-16 right-24"
      />
      <RetroSquare
        color="#F59E5B"
        size={18}
        className="hidden sm:block absolute top-1/2 left-12"
      />
      <RetroDot
        color="#A78BFA"
        size={16}
        className="hidden sm:block absolute bottom-24 left-24"
      />
      <RetroStar
        color="#FF5C5C"
        size={22}
        className="hidden sm:block absolute bottom-20 right-16"
      />
      <RetroSquare
        color="#FFE066"
        size={16}
        className="hidden sm:block absolute top-1/3 right-12"
      />

      {/* Header ringkas */}
      <header className="max-w-content w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-rf-ink no-underline"
        >
          <span className="w-10 h-10 rounded-[12px] bg-rf-coral border-3 border-rf-ink shadow-hard-sm flex items-center justify-center">
            <Camera size={20} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span className="text-[20px] font-bold text-rf-ink">RuangFoto</span>
        </Link>

        <Link href="/" className="rf-btn min-h-[44px] px-4 text-[14px]">
          <ArrowLeft size={18} strokeWidth={2.5} aria-hidden="true" />
          <span>Beranda</span>
        </Link>
      </header>

      {/* Kartu Tunggal di Tengah, lebar maksimal 440px (DesignRuangFoto.md 6.2) */}
      <main className="my-8 flex items-center justify-center">
        <RfCard color="white" className="w-full max-w-[440px]">
          {viewMode === 'verify' ? (
            <div className="flex flex-col gap-5">
              <div className="w-14 h-14 rounded-[16px] bg-rf-yellow border-3 border-rf-ink shadow-hard-sm flex items-center justify-center">
                <Mail size={28} strokeWidth={2.5} aria-hidden="true" />
              </div>

              <div className="flex flex-col gap-2">
                <h1 className="rf-h2 text-rf-ink">
                  Cek email kamu untuk verifikasi
                </h1>
                <p className="rf-body text-rf-muted">
                  Kami telah mengirimkan tautan aktivasi ke{' '}
                  <strong className="text-rf-ink">
                    {email || 'email kamu'}
                  </strong>
                  . Verifikasi hanya dibutuhkan sekali saat pendaftaran pertama.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-1">
                {/* Satu tombol utama (coral) di layar verifikasi ini */}
                <RfButton
                  type="button"
                  variant="primary"
                  isLoading={submitting}
                  onClick={handleCompleteVerification}
                  className="w-full"
                >
                  <CheckCircle2
                    size={20}
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                  <span>Konfirmasi verifikasi email</span>
                </RfButton>

                <RfButton
                  type="button"
                  variant="highlight"
                  disabled={submitting}
                  onClick={handleResendVerification}
                  className="w-full"
                >
                  <span>Kirim ulang email</span>
                </RfButton>

                <button
                  type="button"
                  onClick={() => {
                    setViewMode('form');
                    setActiveTab('masuk');
                    setErrorMsg('');
                  }}
                  className="mt-1 text-[14px] font-bold text-rf-ink underline cursor-pointer self-center"
                >
                  Kembali ke halaman masuk
                </button>
              </div>
            </div>
          ) : viewMode === 'reset' ? (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <h1 className="rf-h2 text-rf-ink">Atur ulang kata sandi</h1>
                <p className="rf-body text-rf-muted">
                  Masukkan alamat email akunmu. Kami akan mengirimkan tautan
                  untuk membuat kata sandi baru.
                </p>
              </div>

              <RfInput
                label="Email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                errorText={errorMsg}
                required
              />

              <RfButton
                type="submit"
                variant="primary"
                isLoading={submitting}
                className="w-full"
              >
                <span>Kirim tautan reset</span>
              </RfButton>

              <button
                type="button"
                onClick={() => {
                  setViewMode('form');
                  setErrorMsg('');
                }}
                className="text-[14px] font-bold text-rf-ink underline cursor-pointer self-center"
              >
                Kembali ke Masuk
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <h1 className="rf-h2 text-rf-ink">Masuk ke RuangFoto</h1>
                {redirectPath.includes('/app/session/') && (
                  <p className="bg-rf-yellow border-2 border-rf-ink rounded-[12px] px-3 py-2 text-[14px] font-bold text-rf-ink">
                    Masuk dulu supaya kamu bisa langsung bergabung ke sesi
                    pasanganmu.
                  </p>
                )}

                <RfTabs
                  ariaLabel="Pilih masuk atau daftar"
                  tabs={[
                    { id: 'masuk', label: 'Masuk' },
                    { id: 'daftar', label: 'Daftar' },
                  ]}
                  activeTab={activeTab}
                  onChange={(id) => {
                    setActiveTab(id as 'masuk' | 'daftar');
                    setErrorMsg('');
                  }}
                  className="w-full grid grid-cols-2"
                />
              </div>

              {/* Tombol Google berlatar white sesuai DesignRuangFoto.md 6.2 */}
              <RfButton
                type="button"
                variant="default"
                isLoading={submitting}
                onClick={handleGoogleSignIn}
                className="w-full"
              >
                <GoogleMarkIcon />
                <span>Masuk dengan Google</span>
              </RfButton>

              <div className="flex items-center gap-3">
                <span className="h-[2px] flex-1 bg-rf-ink" />
                <span className="text-[14px] font-bold text-rf-muted">
                  atau dengan email
                </span>
                <span className="h-[2px] flex-1 bg-rf-ink" />
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {activeTab === 'daftar' && (
                  <RfInput
                    label="Nama panggilan"
                    type="text"
                    placeholder="Misalnya: Nadia"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                )}

                <RfInput
                  label="Email"
                  type="email"
                  placeholder="nama@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <RfInput
                  label="Kata sandi"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  autoComplete={
                    activeTab === 'masuk' ? 'current-password' : 'new-password'
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  errorText={errorMsg}
                  required
                />

                {activeTab === 'daftar' && (
                  <RfCheckbox
                    checked={agreedTerms}
                    onChange={setAgreedTerms}
                    label="Saya menyetujui kebijakan privasi dan penghapusan foto 1x24 jam"
                  />
                )}

                {/* Satu tombol utama (coral) di layar ini sesuai Bagian 4.1 & 6.2 */}
                <RfButton
                  type="submit"
                  variant="primary"
                  isLoading={submitting}
                  className="w-full mt-1"
                >
                  <span>{activeTab === 'masuk' ? 'Masuk' : 'Daftar'}</span>
                </RfButton>

                {activeTab === 'masuk' && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('reset');
                      setErrorMsg('');
                    }}
                    className="text-[14px] leading-[20px] font-bold text-rf-ink hover:underline cursor-pointer self-center mt-1"
                  >
                    Lupa kata sandi?
                  </button>
                )}
              </form>
            </div>
          )}
        </RfCard>
      </main>

      <footer className="max-w-content w-full mx-auto text-center text-[14px] text-rf-muted">
        <span>
          Dengan memakai RuangFoto, kamu setuju pada{' '}
          <Link href="/privacy" className="font-bold text-rf-ink underline">
            Kebijakan privasi
          </Link>{' '}
          &{' '}
          <Link href="/terms" className="font-bold text-rf-ink underline">
            Syarat ketentuan
          </Link>
          .
        </span>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-rf-bg flex items-center justify-center font-bold text-rf-ink">
          Memproses…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
