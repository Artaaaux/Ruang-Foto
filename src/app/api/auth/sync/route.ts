import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  createAuthToken,
  getPasswordFingerprint,
  hashPassword,
  resolveAppOrigin,
  sanitizeRedirectPath,
  sendPasswordResetEmail,
  sendVerificationEmail,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  verifyAuthToken,
  verifyPassword,
} from '@/lib/resend';
import {
  deleteLocalServerUserById,
  getLocalServerUserByEmail,
  isSafeIdentifier,
  upsertUserProfile,
} from '@/lib/server-store';
import {
  createEphemeralSupabaseClient,
  getSupabaseAdminClient,
  isSupabaseConfigured,
} from '@/lib/supabase';
import { UserProfile } from '@/lib/types';

const AVATAR_PALETTE = [
  '#FFE066',
  '#A78BFA',
  '#36CFC0',
  '#F59E5B',
  '#FFC9C4',
  '#3BA7D9',
];

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 jam

function setSessionCookie(res: NextResponse, user: UserProfile) {
  const token = createAuthToken(
    { sub: user.id, email: user.email, purpose: 'session' },
    SESSION_TTL_MS
  );
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

function getClientIp(req: NextRequest): string {
  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'local-ip';
}

async function findSupabaseUserByEmail(email: string) {
  const sb = getSupabaseAdminClient();
  if (!isSupabaseConfigured || !sb) return null;
  const cleanEmail = email.trim().toLowerCase();
  try {
    // Pencarian O(1) melalui indeks email pada tabel public.users terlebih dahulu
    const { data: userRow } = await sb
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    const candidateId =
      (userRow?.id ? String(userRow.id) : null) ||
      getLocalServerUserByEmail(cleanEmail)?.id ||
      null;

    if (candidateId) {
      const { data: byId, error: idErr } =
        await sb.auth.admin.getUserById(candidateId);
      if (
        !idErr &&
        byId?.user &&
        byId.user.email?.toLowerCase() === cleanEmail
      ) {
        return byId.user;
      }
    }

    const { data, error } = await sb.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (error || !data?.users) return null;
    return (
      data.users.find((u) => u.email?.toLowerCase() === cleanEmail) || null
    );
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const origin = resolveAppOrigin(req.nextUrl.origin);
    const clientIp = getClientIp(req);

    if (action === 'logout') {
      const res = NextResponse.json({ ok: true });
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }

    if (action === 'sync' && body.user) {
      const profile = body.user as UserProfile;
      if (!profile.id || !profile.email || !isSafeIdentifier(profile.id)) {
        return NextResponse.json({ ok: false }, { status: 400 });
      }

      const accessToken =
        typeof body.accessToken === 'string' ? body.accessToken.trim() : '';
      const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value || '';
      const existingSession = sessionCookie
        ? verifyAuthToken(sessionCookie, 'session')
        : null;

      let verifiedIdentity = Boolean(
        existingSession &&
          existingSession.sub === profile.id &&
          existingSession.email.toLowerCase() === profile.email.toLowerCase()
      );

      if (!verifiedIdentity && isSupabaseConfigured && accessToken) {
        const ephemeral = createEphemeralSupabaseClient();
        if (ephemeral) {
          const { data, error } = await ephemeral.auth.getUser(accessToken);
          if (
            !error &&
            data?.user &&
            data.user.id === profile.id &&
            data.user.email?.toLowerCase() === profile.email.toLowerCase()
          ) {
            verifiedIdentity = true;
          }
        }
      }

      if (!verifiedIdentity) {
        return NextResponse.json(
          { ok: false, error: 'Sesi autentikasi tidak valid.' },
          { status: 401 }
        );
      }

      await upsertUserProfile(profile);
      const res = NextResponse.json({ ok: true });
      setSessionCookie(res, profile);
      return res;
    }

    if (action === 'google-fallback') {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Mode simulasi Google tidak tersedia di lingkungan produksi.',
          },
          { status: 403 }
        );
      }

      const customName = String(body.name || 'Nadia Putri').trim();
      const email = String(
        body.email ||
          `${customName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'pengguna'}@gmail.com`
      )
        .trim()
        .toLowerCase();

      const sb = getSupabaseAdminClient();
      if (!isSupabaseConfigured || !sb) {
        const localExisting = getLocalServerUserByEmail(email);
        const localProfile: UserProfile = localExisting
          ? {
              id: localExisting.id,
              name: localExisting.name,
              email: localExisting.email,
              loginMethod: 'google',
              verified: true,
              avatarColor: localExisting.avatarColor,
              createdAt: localExisting.createdAt,
            }
          : {
              id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              name: customName,
              email,
              loginMethod: 'google',
              verified: true,
              avatarColor:
                AVATAR_PALETTE[
                  Math.floor(Math.random() * AVATAR_PALETTE.length)
                ],
              createdAt: new Date().toISOString(),
            };
        await upsertUserProfile(localProfile);
        const res = NextResponse.json({ ok: true, user: localProfile });
        setSessionCookie(res, localProfile);
        return res;
      }

      let authUser = await findSupabaseUserByEmail(email);

      if (!authUser) {
        const avatarColor =
          AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)];
        const { data: created, error: createErr } =
          await sb.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
              name: customName,
              avatar_color: avatarColor,
            },
            app_metadata: {
              provider: 'google',
            },
          });
        if (createErr || !created.user) {
          return NextResponse.json(
            {
              ok: false,
              error:
                createErr?.message || 'Gagal membuat akun Google di Supabase.',
            },
            { status: 500 }
          );
        }
        authUser = created.user;
      }

      const profile: UserProfile = {
        id: authUser.id,
        name:
          (authUser.user_metadata?.name as string) ||
          customName ||
          email.split('@')[0],
        email,
        loginMethod: 'google',
        verified: true,
        avatarColor:
          (authUser.user_metadata?.avatar_color as string) || '#FFE066',
        createdAt: authUser.created_at,
      };

      await upsertUserProfile(profile);
      const res = NextResponse.json({ ok: true, user: profile });
      setSessionCookie(res, profile);
      return res;
    }

    // ========================================================================
    // 1. Registrasi Akun Email + Pengiriman Email Verifikasi via Resend
    // ========================================================================
    if (action === 'register-email') {
      const cleanName = String(body.name || '').trim();
      const cleanEmail = String(body.email || '')
        .trim()
        .toLowerCase();
      const password = String(body.password || '');
      const redirectPath = body.redirect
        ? sanitizeRedirectPath(body.redirect)
        : undefined;

      if (!cleanName) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Nama belum diisi. Masukkan nama panggilanmu dulu.',
          },
          { status: 400 }
        );
      }
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Format email belum sesuai. Contoh: nama@email.com.',
          },
          { status: 400 }
        );
      }
      if (password.length < 6) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Kata sandi minimal 6 karakter supaya akunmu aman.',
          },
          { status: 400 }
        );
      }

      const rlReg = checkRateLimit(
        `register:${clientIp}:${cleanEmail}`,
        5,
        10 * 60 * 1000
      );
      if (!rlReg.allowed) {
        return NextResponse.json(
          {
            ok: false,
            error: `Terlalu banyak percobaan pendaftaran. Coba lagi dalam ${rlReg.retryAfterSec} detik.`,
          },
          { status: 429 }
        );
      }

      const localUser = getLocalServerUserByEmail(cleanEmail);
      const sbUser = await findSupabaseUserByEmail(cleanEmail);

      const isAlreadyVerified = Boolean(
        sbUser?.email_confirmed_at ||
          sbUser?.app_metadata?.provider === 'google' ||
          localUser?.verified
      );

      if (isAlreadyVerified) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Email ini sudah terdaftar. Pindah ke tab Masuk untuk masuk ke akunmu.',
          },
          { status: 409 }
        );
      }

      const avatarColor =
        localUser?.avatarColor ||
        (sbUser?.user_metadata?.avatar_color as string) ||
        AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)];

      let userId =
        sbUser?.id ||
        localUser?.id ||
        `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      let createdAt =
        sbUser?.created_at || localUser?.createdAt || new Date().toISOString();

      const sb = getSupabaseAdminClient();
      if (isSupabaseConfigured && sb) {
        try {
          if (sbUser) {
            await sb.auth.admin.updateUserById(sbUser.id, {
              password,
              user_metadata: {
                name: cleanName,
                avatar_color: avatarColor,
              },
            });
          } else {
            const { data: created, error: createErr } =
              await sb.auth.admin.createUser({
                email: cleanEmail,
                password,
                email_confirm: false,
                user_metadata: {
                  name: cleanName,
                  avatar_color: avatarColor,
                },
              });
            if (!createErr && created?.user) {
              userId = created.user.id;
              createdAt = created.user.created_at || createdAt;
            }
          }
        } catch {
          // Lanjut dengan penyimpanan server lokal jika Supabase gagal dihubungi
        }
      }

      const profile: UserProfile = {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        loginMethod: 'email',
        verified: false,
        avatarColor,
        createdAt,
      };

      const passwordHash = hashPassword(password);
      await upsertUserProfile(profile, passwordHash);

      const token = createAuthToken(
        {
          sub: profile.id,
          email: cleanEmail,
          purpose: 'verify-email',
          redirect: redirectPath,
        },
        VERIFY_TOKEN_TTL_MS
      );

      const verifyUrlObj = new URL('/api/auth/verify', origin);
      verifyUrlObj.searchParams.set('token', token);
      if (redirectPath) {
        verifyUrlObj.searchParams.set('redirect', redirectPath);
      }

      const emailResult = await sendVerificationEmail({
        to: cleanEmail,
        name: cleanName,
        verifyUrl: verifyUrlObj.toString(),
      });

      if (!emailResult.ok) {
        return NextResponse.json(
          {
            ok: false,
            error:
              emailResult.error ||
              'Gagal mengirim email verifikasi melalui Resend.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        needsVerification: true,
      });
    }

    // ========================================================================
    // 2. Kirim Ulang Email Verifikasi via Resend
    // ========================================================================
    if (action === 'resend-verification') {
      const cleanEmail = String(body.email || '')
        .trim()
        .toLowerCase();
      const redirectPath = body.redirect
        ? sanitizeRedirectPath(body.redirect)
        : undefined;

      if (!cleanEmail || !cleanEmail.includes('@')) {
        return NextResponse.json(
          { ok: false, error: 'Masukkan alamat email yang benar.' },
          { status: 400 }
        );
      }

      const rlResend = checkRateLimit(
        `resend:${clientIp}:${cleanEmail}`,
        3,
        10 * 60 * 1000
      );
      if (!rlResend.allowed) {
        return NextResponse.json(
          {
            ok: false,
            error: `Permintaan kirim ulang terlalu sering. Tunggu ${rlResend.retryAfterSec} detik.`,
          },
          { status: 429 }
        );
      }

      const localUser = getLocalServerUserByEmail(cleanEmail);
      const sbUser = await findSupabaseUserByEmail(cleanEmail);

      if (!sbUser && !localUser) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Akun belum ditemukan. Silakan daftar terlebih dahulu.',
          },
          { status: 404 }
        );
      }

      const userId = sbUser?.id || localUser!.id;
      const userName =
        (sbUser?.user_metadata?.name as string) ||
        localUser?.name ||
        cleanEmail.split('@')[0];

      const token = createAuthToken(
        {
          sub: userId,
          email: cleanEmail,
          purpose: 'verify-email',
          redirect: redirectPath,
        },
        VERIFY_TOKEN_TTL_MS
      );

      const verifyUrlObj = new URL('/api/auth/verify', origin);
      verifyUrlObj.searchParams.set('token', token);
      if (redirectPath) {
        verifyUrlObj.searchParams.set('redirect', redirectPath);
      }

      const emailResult = await sendVerificationEmail({
        to: cleanEmail,
        name: userName,
        verifyUrl: verifyUrlObj.toString(),
      });

      if (!emailResult.ok) {
        return NextResponse.json(
          {
            ok: false,
            error:
              emailResult.error || 'Gagal mengirim ulang email verifikasi.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    // ========================================================================
    // 3. Verifikasi Email (via Token Link Resend atau Konfirmasi Status Aktif)
    // ========================================================================
    if (action === 'verify-email') {
      const rawToken = typeof body.token === 'string' ? body.token.trim() : '';
      let cleanEmail = String(body.email || '')
        .trim()
        .toLowerCase();

      let tokenVerified = false;
      if (rawToken) {
        const payload = verifyAuthToken(rawToken, 'verify-email');
        if (!payload) {
          return NextResponse.json(
            {
              ok: false,
              error:
                'Tautan verifikasi tidak valid atau sudah kedaluwarsa. Silakan kirim ulang email verifikasi.',
            },
            { status: 400 }
          );
        }
        cleanEmail = payload.email;
        tokenVerified = true;
      }

      if (!cleanEmail) {
        return NextResponse.json(
          { ok: false, error: 'Email tidak ditemukan.' },
          { status: 400 }
        );
      }

      const localUser = getLocalServerUserByEmail(cleanEmail);
      const sbUser = await findSupabaseUserByEmail(cleanEmail);

      if (!sbUser && !localUser) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Akun tidak ditemukan. Silakan daftar ulang.',
          },
          { status: 404 }
        );
      }

      const alreadyVerifiedInDb = Boolean(
        sbUser?.email_confirmed_at ||
          sbUser?.app_metadata?.provider === 'google' ||
          localUser?.verified
      );

      if (!tokenVerified && !alreadyVerifiedInDb) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Email kamu belum terverifikasi. Klik tautan aktivasi di kotak masuk emailmu terlebih dahulu, lalu tekan tombol ini lagi.',
          },
          { status: 400 }
        );
      }

      const sb = getSupabaseAdminClient();
      if (tokenVerified && isSupabaseConfigured && sb && sbUser) {
        await sb.auth.admin
          .updateUserById(sbUser.id, { email_confirm: true })
          .catch(() => {});
      }

      const profile: UserProfile = {
        id: sbUser?.id || localUser!.id,
        name:
          (sbUser?.user_metadata?.name as string) ||
          (sbUser?.user_metadata?.full_name as string) ||
          localUser?.name ||
          cleanEmail.split('@')[0],
        email: cleanEmail,
        loginMethod:
          sbUser?.app_metadata?.provider === 'google'
            ? 'google'
            : localUser?.loginMethod || 'email',
        verified: true,
        avatarColor:
          (sbUser?.user_metadata?.avatar_color as string) ||
          localUser?.avatarColor ||
          '#FFE066',
        createdAt:
          sbUser?.created_at ||
          localUser?.createdAt ||
          new Date().toISOString(),
      };

      await upsertUserProfile(profile, localUser?.passwordHash);
      const res = NextResponse.json({ ok: true, user: profile });
      setSessionCookie(res, profile);
      return res;
    }

    // ========================================================================
    // 4. Login dengan Email & Kata Sandi
    // ========================================================================
    if (action === 'login-email') {
      const cleanEmail = String(body.email || '')
        .trim()
        .toLowerCase();
      const password = String(body.password || '');

      if (!cleanEmail || !cleanEmail.includes('@')) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Masukkan alamat email yang benar. Contoh: nama@email.com.',
          },
          { status: 400 }
        );
      }
      if (!password) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Kata sandi belum diisi. Masukkan kata sandimu.',
          },
          { status: 400 }
        );
      }

      const rl = checkRateLimit(
        `login:${clientIp}:${cleanEmail}`,
        10,
        5 * 60 * 1000
      );
      if (!rl.allowed) {
        return NextResponse.json(
          {
            ok: false,
            error: `Terlalu banyak percobaan masuk. Coba lagi dalam ${rl.retryAfterSec} detik.`,
          },
          { status: 429 }
        );
      }

      const localUser = getLocalServerUserByEmail(cleanEmail);
      const ephemeralClient = createEphemeralSupabaseClient();

      if (isSupabaseConfigured && ephemeralClient) {
        try {
          const { data, error } = await ephemeralClient.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (!error && data?.user) {
            const u = data.user;
            const isConfirmed = Boolean(
              u.email_confirmed_at ||
                u.app_metadata?.provider === 'google' ||
                localUser?.verified
            );
            if (!isConfirmed) {
              return NextResponse.json(
                {
                  ok: false,
                  needsVerification: true,
                  error:
                    'Email kamu belum diverifikasi. Cek kotak masuk emailmu untuk mengaktifkan akun.',
                },
                { status: 403 }
              );
            }

            const profile: UserProfile = {
              id: u.id,
              name:
                (u.user_metadata?.name as string) ||
                (u.user_metadata?.full_name as string) ||
                localUser?.name ||
                cleanEmail.split('@')[0],
              email: cleanEmail,
              loginMethod:
                u.app_metadata?.provider === 'google' ? 'google' : 'email',
              verified: true,
              avatarColor:
                (u.user_metadata?.avatar_color as string) ||
                localUser?.avatarColor ||
                '#FFE066',
              createdAt: u.created_at || new Date().toISOString(),
            };

            await upsertUserProfile(profile, localUser?.passwordHash);
            const res = NextResponse.json({ ok: true, user: profile });
            setSessionCookie(res, profile);
            return res;
          }

          if (error) {
            const msg = error.message.toLowerCase();
            if (msg.includes('email not confirmed')) {
              return NextResponse.json(
                {
                  ok: false,
                  needsVerification: true,
                  error:
                    'Email kamu belum diverifikasi. Cek kotak masuk emailmu untuk mengaktifkan akun.',
                },
                { status: 403 }
              );
            }
          }
        } catch {
          // Lanjut ke pengecekan server store lokal jika koneksi ke Supabase gagal
        }
      }

      if (localUser) {
        if (
          !localUser.passwordHash ||
          !verifyPassword(password, localUser.passwordHash)
        ) {
          return NextResponse.json(
            {
              ok: false,
              error:
                'Kata sandi salah. Coba ingat kembali atau klik Lupa kata sandi.',
            },
            { status: 401 }
          );
        }
        if (!localUser.verified) {
          return NextResponse.json(
            {
              ok: false,
              needsVerification: true,
              error:
                'Email kamu belum diverifikasi. Cek kotak masuk emailmu untuk mengaktifkan akun.',
            },
            { status: 403 }
          );
        }

        const { passwordHash: _unused, ...profile } = localUser;
        void _unused;
        const res = NextResponse.json({ ok: true, user: profile });
        setSessionCookie(res, profile);
        return res;
      }

      const sbUser = await findSupabaseUserByEmail(cleanEmail);
      if (sbUser) {
        if (!sbUser.email_confirmed_at) {
          return NextResponse.json(
            {
              ok: false,
              needsVerification: true,
              error:
                'Email kamu belum diverifikasi. Cek kotak masuk emailmu untuk mengaktifkan akun.',
            },
            { status: 403 }
          );
        }
        return NextResponse.json(
          {
            ok: false,
            error:
              'Kata sandi salah. Coba ingat kembali atau klik Lupa kata sandi.',
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error:
            'Akun dengan email ini belum ada. Klik tab Daftar untuk membuat akun baru.',
        },
        { status: 404 }
      );
    }

    // ========================================================================
    // 5. Permintaan Reset Kata Sandi (Lupa Kata Sandi) via Resend
    // ========================================================================
    if (action === 'forgot-password') {
      const cleanEmail = String(body.email || '')
        .trim()
        .toLowerCase();

      if (!cleanEmail || !cleanEmail.includes('@')) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Masukkan email akunmu terlebih dahulu untuk reset kata sandi.',
          },
          { status: 400 }
        );
      }

      const rlReset = checkRateLimit(
        `reset:${clientIp}:${cleanEmail}`,
        3,
        10 * 60 * 1000
      );
      if (!rlReset.allowed) {
        return NextResponse.json(
          {
            ok: false,
            error: `Permintaan reset kata sandi terlalu sering. Tunggu ${rlReset.retryAfterSec} detik.`,
          },
          { status: 429 }
        );
      }

      const localUser = getLocalServerUserByEmail(cleanEmail);
      const sbUser = await findSupabaseUserByEmail(cleanEmail);

      if (!sbUser && !localUser) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Akun dengan email ini tidak ditemukan.',
          },
          { status: 404 }
        );
      }

      const userId = sbUser?.id || localUser!.id;
      const userName =
        (sbUser?.user_metadata?.name as string) ||
        localUser?.name ||
        cleanEmail.split('@')[0];

      const resetToken = createAuthToken(
        {
          sub: userId,
          email: cleanEmail,
          purpose: 'reset-password',
          fp: getPasswordFingerprint(
            localUser?.passwordHash ||
              (sbUser as { updated_at?: string } | null)?.updated_at
          ),
        },
        RESET_TOKEN_TTL_MS
      );

      const resetUrlObj = new URL('/login', origin);
      resetUrlObj.searchParams.set('reset_token', resetToken);
      resetUrlObj.searchParams.set('email', cleanEmail);

      const emailRes = await sendPasswordResetEmail({
        to: cleanEmail,
        name: userName,
        resetUrl: resetUrlObj.toString(),
      });

      if (!emailRes.ok) {
        return NextResponse.json(
          {
            ok: false,
            error:
              emailRes.error ||
              'Gagal mengirim tautan reset kata sandi via Resend.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    // ========================================================================
    // 6. Konfirmasi Kata Sandi Baru dari Tautan Reset Resend
    // ========================================================================
    if (action === 'reset-password') {
      const token = String(body.token || '').trim();
      const newPassword = String(body.newPassword || '');

      if (newPassword.length < 6) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Kata sandi baru minimal 6 karakter supaya akunmu aman.',
          },
          { status: 400 }
        );
      }

      const payload = verifyAuthToken(token, 'reset-password');
      if (!payload) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Tautan reset kata sandi tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru.',
          },
          { status: 400 }
        );
      }

      const cleanEmail = payload.email;
      const localUser = getLocalServerUserByEmail(cleanEmail);
      const sbUser = await findSupabaseUserByEmail(cleanEmail);

      if (!sbUser && !localUser) {
        return NextResponse.json(
          { ok: false, error: 'Akun tidak ditemukan.' },
          { status: 404 }
        );
      }

      const currentFp = getPasswordFingerprint(
        localUser?.passwordHash ||
          (sbUser as { updated_at?: string } | null)?.updated_at
      );
      if (payload.fp && payload.fp !== currentFp) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Tautan reset ini sudah pernah digunakan. Silakan minta tautan baru.',
          },
          { status: 400 }
        );
      }

      const sb = getSupabaseAdminClient();
      if (isSupabaseConfigured && sb && sbUser) {
        const { error: updErr } = await sb.auth.admin.updateUserById(
          sbUser.id,
          {
            password: newPassword,
            email_confirm: true,
          }
        );
        if (updErr) {
          return NextResponse.json(
            {
              ok: false,
              error: updErr.message || 'Gagal memperbarui kata sandi.',
            },
            { status: 500 }
          );
        }
      }

      const profile: UserProfile = {
        id: sbUser?.id || localUser!.id,
        name:
          (sbUser?.user_metadata?.name as string) ||
          localUser?.name ||
          cleanEmail.split('@')[0],
        email: cleanEmail,
        loginMethod:
          sbUser?.app_metadata?.provider === 'google'
            ? 'google'
            : localUser?.loginMethod || 'email',
        verified: true,
        avatarColor:
          (sbUser?.user_metadata?.avatar_color as string) ||
          localUser?.avatarColor ||
          '#FFE066',
        createdAt:
          sbUser?.created_at ||
          localUser?.createdAt ||
          new Date().toISOString(),
      };

      const passwordHash = hashPassword(newPassword);
      await upsertUserProfile(profile, passwordHash);

      const res = NextResponse.json({ ok: true, user: profile });
      setSessionCookie(res, profile);
      return res;
    }

    return NextResponse.json({ ok: false }, { status: 400 });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Kesalahan server saat memproses autentikasi.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const cleanUserId = String(body.userId || '').trim();
    if (!cleanUserId || !isSafeIdentifier(cleanUserId)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value || '';
    const sessionPayload = sessionCookie
      ? verifyAuthToken(sessionCookie, 'session')
      : null;

    if (!sessionPayload || sessionPayload.sub !== cleanUserId) {
      return NextResponse.json(
        { ok: false, error: 'Tidak memiliki izin untuk menghapus akun ini.' },
        { status: 403 }
      );
    }

    deleteLocalServerUserById(cleanUserId);

    const sb = getSupabaseAdminClient();
    if (isSupabaseConfigured && sb) {
      await sb
        .from('users')
        .delete()
        .eq('id', cleanUserId)
        .then(
          () => {},
          () => {}
        );
      await sb.auth.admin
        .deleteUser(cleanUserId)
        .then(
          () => {},
          () => {}
        );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.delete(SESSION_COOKIE_NAME);
    return res;
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
