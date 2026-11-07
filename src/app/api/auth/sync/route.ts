import { NextRequest, NextResponse } from 'next/server';
import {
  createAuthToken,
  hashPassword,
  resolveAppOrigin,
  sendPasswordResetEmail,
  sendVerificationEmail,
  verifyAuthToken,
  verifyPassword,
} from '@/lib/resend';
import {
  deleteLocalServerUserById,
  getLocalServerUserByEmail,
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

async function findSupabaseUserByEmail(email: string) {
  const sb = getSupabaseAdminClient();
  if (!isSupabaseConfigured || !sb) return null;
  try {
    const { data, error } = await sb.auth.admin.listUsers({ perPage: 1000 });
    if (error || !data?.users) return null;
    return (
      data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ||
      null
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

    if (action === 'sync' && body.user) {
      await upsertUserProfile(body.user as UserProfile);
      return NextResponse.json({ ok: true });
    }

    if (action === 'google-fallback') {
      const customName = String(body.name || 'Nadia Putri').trim();
      const email = String(
        body.email ||
          `${customName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'pengguna'}@gmail.com`
      )
        .trim()
        .toLowerCase();

      const sb = getSupabaseAdminClient();
      if (!isSupabaseConfigured || !sb) {
        return NextResponse.json(
          { ok: false, error: 'Supabase belum dikonfigurasi.' },
          { status: 400 }
        );
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
      return NextResponse.json({ ok: true, user: profile });
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
      const redirectPath =
        typeof body.redirect === 'string' && body.redirect.startsWith('/')
          ? body.redirect
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
      const redirectPath =
        typeof body.redirect === 'string' && body.redirect.startsWith('/')
          ? body.redirect
          : undefined;

      if (!cleanEmail || !cleanEmail.includes('@')) {
        return NextResponse.json(
          { ok: false, error: 'Masukkan alamat email yang benar.' },
          { status: 400 }
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
    // 3. Verifikasi Email (via Token Link Resend atau Cek Status Verifikasi)
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

      const alreadyVerified = Boolean(
        sbUser?.email_confirmed_at ||
          sbUser?.app_metadata?.provider === 'google' ||
          localUser?.verified
      );

      if (!tokenVerified && !alreadyVerified) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Email kamu belum diverifikasi. Silakan buka kotak masuk emailmu dan klik tautan verifikasi yang kami kirim terlebih dahulu.',
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
      return NextResponse.json({ ok: true, user: profile });
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
            return NextResponse.json({ ok: true, user: profile });
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
        return NextResponse.json({ ok: true, user: profile });
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

      return NextResponse.json({ ok: true, user: profile });
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
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    deleteLocalServerUserById(String(userId));

    const sb = getSupabaseAdminClient();
    if (isSupabaseConfigured && sb) {
      await sb
        .from('users')
        .delete()
        .eq('id', String(userId))
        .then(
          () => {},
          () => {}
        );
      await sb.auth.admin
        .deleteUser(String(userId))
        .then(
          () => {},
          () => {}
        );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
