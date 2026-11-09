import { NextRequest, NextResponse } from 'next/server';
import {
  createAuthToken,
  resolveAppOrigin,
  sanitizeRedirectPath,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  verifyAuthToken,
} from '@/lib/resend';
import {
  getLocalServerUserByEmail,
  upsertUserProfile,
} from '@/lib/server-store';
import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile } from '@/lib/types';

async function markEmailVerified(
  email: string,
  userIdHint?: string
): Promise<UserProfile | null> {
  const cleanEmail = email.trim().toLowerCase();
  const localUser = getLocalServerUserByEmail(cleanEmail);
  let resolvedProfile: UserProfile | null = null;

  const sb = getSupabaseAdminClient();
  if (isSupabaseConfigured && sb) {
    try {
      let targetId = userIdHint || localUser?.id || null;
      if (!targetId) {
        const { data: userRow } = await sb
          .from('users')
          .select('id')
          .eq('email', cleanEmail)
          .maybeSingle();
        if (userRow?.id) {
          targetId = String(userRow.id);
        }
      }

      let targetUser = null;
      if (targetId) {
        const { data: byId } = await sb.auth.admin.getUserById(targetId);
        if (byId?.user) {
          targetUser = byId.user;
        }
      }

      if (!targetUser) {
        const { data: listData } = await sb.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        targetUser =
          listData?.users?.find(
            (u) =>
              u.email?.toLowerCase() === cleanEmail ||
              (userIdHint && u.id === userIdHint)
          ) || null;
      }

      if (targetUser) {
        const { data: updated } = await sb.auth.admin.updateUserById(
          targetUser.id,
          { email_confirm: true }
        );
        const u = updated?.user || targetUser;
        resolvedProfile = {
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
      }
    } catch {
      // Fallback ke penyimpanan server lokal jika Supabase tidak terjangkau
    }
  }

  if (!resolvedProfile && localUser) {
    resolvedProfile = {
      id: localUser.id,
      name: localUser.name,
      email: cleanEmail,
      loginMethod: localUser.loginMethod,
      verified: true,
      avatarColor: localUser.avatarColor || '#FFE066',
      createdAt: localUser.createdAt,
    };
  }

  if (!resolvedProfile && userIdHint) {
    resolvedProfile = {
      id: userIdHint,
      name: cleanEmail.split('@')[0] || 'Pengguna',
      email: cleanEmail,
      loginMethod: 'email',
      verified: true,
      avatarColor: '#FFE066',
      createdAt: new Date().toISOString(),
    };
  }

  if (resolvedProfile) {
    await upsertUserProfile(resolvedProfile, localUser?.passwordHash);
  }

  return resolvedProfile;
}

/**
 * Endpoint GET yang dibuka saat pengguna mengklik tautan verifikasi di email Resend.
 */
export async function GET(req: NextRequest) {
  const origin = resolveAppOrigin(req.nextUrl.origin);
  const token = req.nextUrl.searchParams.get('token') || '';
  const redirectParam = req.nextUrl.searchParams.get('redirect') || '';

  const payload = verifyAuthToken(token, 'verify-email');
  if (!payload) {
    const loginErrUrl = new URL('/login', origin);
    loginErrUrl.searchParams.set(
      'verify_error',
      'Tautan verifikasi tidak valid atau sudah kedaluwarsa. Silakan kirim ulang email verifikasi.'
    );
    return NextResponse.redirect(loginErrUrl);
  }

  const profile = await markEmailVerified(payload.email, payload.sub);
  if (!profile) {
    const loginErrUrl = new URL('/login', origin);
    loginErrUrl.searchParams.set(
      'verify_error',
      'Akun tidak ditemukan. Silakan daftar ulang.'
    );
    return NextResponse.redirect(loginErrUrl);
  }

  const loginSuccessUrl = new URL('/login', origin);
  loginSuccessUrl.searchParams.set('verified', '1');
  loginSuccessUrl.searchParams.set('email', profile.email);
  loginSuccessUrl.searchParams.set('verify_token', token);
  const targetRedirect = sanitizeRedirectPath(redirectParam || payload.redirect);
  if (targetRedirect) {
    loginSuccessUrl.searchParams.set('redirect', targetRedirect);
  }

  const res = NextResponse.redirect(loginSuccessUrl);
  const sessionToken = createAuthToken(
    { sub: profile.id, email: profile.email, purpose: 'session' },
    SESSION_TTL_MS
  );
  res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return res;
}
