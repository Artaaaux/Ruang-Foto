import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase';
import { upsertUserProfile } from '@/lib/server-store';
import { UserProfile } from '@/lib/types';

const AVATAR_PALETTE = [
  '#FFE066',
  '#A78BFA',
  '#36CFC0',
  '#F59E5B',
  '#FFC9C4',
  '#3BA7D9',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'sync' && body.user) {
      await upsertUserProfile(body.user as UserProfile);
      return NextResponse.json({ ok: true });
    }

    if (action === 'google-fallback') {
      const customName = String(body.name || 'Nadia Putri').trim();
      const email =
        String(
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

      const { data: listData } = await sb.auth.admin.listUsers();
      let authUser = listData?.users?.find(
        (u) => u.email?.toLowerCase() === email
      );

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
              error: createErr?.message || 'Gagal membuat akun Google di Supabase.',
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

    if (action === 'verify-email' && body.email) {
      const cleanEmail = String(body.email).trim().toLowerCase();
      const sb = getSupabaseAdminClient();
      if (!isSupabaseConfigured || !sb) {
        return NextResponse.json(
          { ok: false, error: 'Supabase belum dikonfigurasi.' },
          { status: 400 }
        );
      }

      const { data: listData, error: listErr } =
        await sb.auth.admin.listUsers();
      if (listErr || !listData?.users) {
        return NextResponse.json(
          { ok: false, error: 'Gagal memeriksa status akun.' },
          { status: 500 }
        );
      }

      const target = listData.users.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );
      if (!target) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Akun tidak ditemukan. Silakan daftar ulang.',
          },
          { status: 404 }
        );
      }

      // Konfirmasi email di Supabase Auth
      const { data: updated, error: updErr } =
        await sb.auth.admin.updateUserById(target.id, {
          email_confirm: true,
        });

      if (updErr || !updated.user) {
        return NextResponse.json(
          { ok: false, error: updErr?.message || 'Gagal mengaktifkan akun.' },
          { status: 500 }
        );
      }

      const u = updated.user;
      const profile: UserProfile = {
        id: u.id,
        name:
          (u.user_metadata?.name as string) ||
          (u.user_metadata?.full_name as string) ||
          cleanEmail.split('@')[0],
        email: cleanEmail,
        loginMethod:
          u.app_metadata?.provider === 'google' ? 'google' : 'email',
        verified: true,
        avatarColor: (u.user_metadata?.avatar_color as string) || '#FFE066',
        createdAt: u.created_at,
      };

      await upsertUserProfile(profile);
      return NextResponse.json({ ok: true, user: profile });
    }

    return NextResponse.json({ ok: false }, { status: 400 });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Kesalahan server saat sinkronisasi akun.' },
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

    const sb = getSupabaseAdminClient();
    if (isSupabaseConfigured && sb) {
      await sb
        .from('users')
        .delete()
        .eq('id', String(userId))
        .then(() => {}, () => {});
      await sb.auth.admin
        .deleteUser(String(userId))
        .then(() => {}, () => {});
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
