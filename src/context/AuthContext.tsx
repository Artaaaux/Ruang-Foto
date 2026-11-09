'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

interface StoredLocalAccount extends UserProfile {
  passwordHash: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  loginWithGoogle: (
    customName?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  loginWithEmail: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string; needsVerification?: boolean }>;
  registerWithEmail: (
    name: string,
    email: string,
    password: string,
    redirectPath?: string
  ) => Promise<{ ok: boolean; error?: string; needsVerification?: boolean }>;
  verifyEmailAccount: (
    email: string,
    token?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  resendVerificationEmail: (
    email: string,
    redirectPath?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  requestPasswordReset: (
    email: string
  ) => Promise<{ ok: boolean; error?: string }>;
  confirmPasswordReset: (
    token: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SESSION_STORAGE_KEY = 'rf_active_user_v1';
const ACCOUNTS_STORAGE_KEY = 'rf_accounts_v1';
const TEMPLATE_STORAGE_KEY = 'rf_selected_template_v1';

const AVATAR_PALETTE = [
  '#FFE066',
  '#A78BFA',
  '#36CFC0',
  '#F59E5B',
  '#FFC9C4',
  '#3BA7D9',
];

function simpleHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `h_${(h >>> 0).toString(16)}`;
}

function getLocalAccounts(): Record<string, StoredLocalAccount> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalAccounts(accounts: Record<string, StoredLocalAccount>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

function mapSupabaseUserToProfile(u: User): UserProfile {
  const email = (u.email || '').toLowerCase();
  const provider = u.app_metadata?.provider;
  return {
    id: u.id,
    name:
      (u.user_metadata?.name as string) ||
      (u.user_metadata?.full_name as string) ||
      email.split('@')[0] ||
      'Pengguna',
    email,
    loginMethod: provider === 'google' ? 'google' : 'email',
    verified: Boolean(u.email_confirmed_at || provider === 'google'),
    avatarColor: (u.user_metadata?.avatar_color as string) || '#FFE066',
    createdAt: u.created_at || new Date().toISOString(),
  };
}

async function syncUserProfileToServer(
  profile: UserProfile,
  accessToken?: string
) {
  try {
    await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync', user: profile, accessToken }),
    });
  } catch {
    // Ignore background sync failure
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateIdState] =
    useState<string>('retro-klasik');

  const persistUser = useCallback((nextUser: UserProfile | null) => {
    setUser(nextUser);
    if (typeof window !== 'undefined') {
      if (nextUser) {
        const serialized = JSON.stringify(nextUser);
        sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
        localStorage.setItem(SESSION_STORAGE_KEY, serialized);
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let tabAlreadyHasUser = false;
    try {
      const savedTemplate = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (savedTemplate) {
        setSelectedTemplateIdState(savedTemplate);
      }
      const tabUser = sessionStorage.getItem(SESSION_STORAGE_KEY);
      const savedUser = tabUser || localStorage.getItem(SESSION_STORAGE_KEY);
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as UserProfile;
        setUser(parsed);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
        tabAlreadyHasUser = true;
      }
    } catch {
      // Ignore storage read error
    }

    const supabase = getSupabaseClient();
    if (isSupabaseConfigured && supabase) {
      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (!mounted) return;
          if (data.session?.user) {
            const profile = mapSupabaseUserToProfile(data.session.user);
            if (!tabAlreadyHasUser) {
              persistUser(profile);
            }
            syncUserProfileToServer(profile, data.session.access_token);
          }
        })
        .finally(() => {
          if (mounted) setIsLoading(false);
        });

      const { data: sub } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!mounted) return;
          const currentTabUser = sessionStorage.getItem(SESSION_STORAGE_KEY);
          if (session?.user) {
            const profile = mapSupabaseUserToProfile(session.user);
            if (!currentTabUser) {
              persistUser(profile);
            }
            syncUserProfileToServer(profile, session.access_token);
          }
        }
      );

      return () => {
        mounted = false;
        sub.subscription.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [persistUser]);

  const setSelectedTemplateId = useCallback((id: string) => {
    setSelectedTemplateIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, id);
    }
  }, []);

  const loginWithGoogle = useCallback(
    async (customName?: string) => {
      const supabase = getSupabaseClient();
      if (isSupabaseConfigured && supabase) {
        // Periksa apakah Google OAuth provider sudah diaktifkan di Supabase Dashboard
        let googleOAuthEnabled = false;
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          if (supabaseUrl && anonKey) {
            const settingsRes = await fetch(`${supabaseUrl}/auth/v1/settings`, {
              headers: { apikey: anonKey },
            });
            if (settingsRes.ok) {
              const settings = await settingsRes.json();
              googleOAuthEnabled = Boolean(settings?.external?.google);
            }
          }
        } catch {
          googleOAuthEnabled = false;
        }

        if (googleOAuthEnabled) {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/app`,
            },
          });
          if (error) {
            return { ok: false, error: error.message };
          }
          return { ok: true };
        }

        // Jika provider Google di Supabase belum diaktifkan, buat/masuk akun Google di Supabase via Admin API
        try {
          const res = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'google-fallback',
              name: customName || 'Nadia Putri',
            }),
          });
          const data = await res.json();
          if (res.ok && data.user) {
            persistUser(data.user as UserProfile);
            return { ok: true };
          }
          if (res.status === 403 && data.error) {
            return { ok: false, error: data.error };
          }
        } catch {
          // Lanjut ke mode lokal jika jaringan terputus
        }
      }

      // Mode Lokal/Demo: Masuk satu klik dengan Google + sinkronkan cookie sesi server
      try {
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'google-fallback',
            name: customName || 'Nadia Putri',
          }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          persistUser(data.user as UserProfile);
          return { ok: true };
        }
      } catch {
        // Fallback offline
      }
      const accounts = getLocalAccounts();
      const email = customName
        ? `${customName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`
        : 'nadia.putri@gmail.com';
      const existing = accounts[email];

      const profile: UserProfile = existing
        ? {
            id: existing.id,
            name: existing.name,
            email: existing.email,
            loginMethod: 'google',
            verified: true,
            avatarColor: existing.avatarColor,
            createdAt: existing.createdAt,
          }
        : {
            id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: customName || 'Nadia Putri',
            email,
            loginMethod: 'google',
            verified: true,
            avatarColor:
              AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)],
            createdAt: new Date().toISOString(),
          };

      accounts[email] = {
        ...profile,
        passwordHash: existing?.passwordHash || simpleHash('google-oauth'),
      };
      saveLocalAccounts(accounts);
      persistUser(profile);
      return { ok: true };
    },
    [persistUser]
  );

  const registerWithEmail = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      redirectPath?: string
    ) => {
      try {
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register-email',
            name,
            email,
            password,
            redirect: redirectPath,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error: data.error || 'Gagal mendaftarkan akun.',
          };
        }
        return { ok: true, needsVerification: true };
      } catch {
        return {
          ok: false,
          error: 'Koneksi ke server terganggu saat mendaftar.',
        };
      }
    },
    []
  );

  const verifyEmailAccount = useCallback(
    async (email: string, token?: string) => {
      const cleanEmail = email.trim().toLowerCase();
      try {
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verify-email',
            email: cleanEmail,
            token,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.user) {
          return {
            ok: false,
            error:
              data.error ||
              'Gagal memverifikasi email. Silakan coba lagi.',
          };
        }
        persistUser(data.user as UserProfile);
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: 'Koneksi terganggu saat memverifikasi email.',
        };
      }
    },
    [persistUser]
  );

  const resendVerificationEmail = useCallback(
    async (email: string, redirectPath?: string) => {
      const cleanEmail = email.trim().toLowerCase();
      try {
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'resend-verification',
            email: cleanEmail,
            redirect: redirectPath,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error: data.error || 'Gagal mengirim ulang email verifikasi.',
          };
        }
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: 'Koneksi terganggu saat mengirim ulang email.',
        };
      }
    },
    []
  );

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      const cleanEmail = email.trim().toLowerCase();
      try {
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'login-email',
            email: cleanEmail,
            password,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.user) {
          return {
            ok: false,
            needsVerification: Boolean(data.needsVerification),
            error:
              data.error ||
              'Email atau kata sandi belum tepat. Periksa kembali lalu coba lagi.',
          };
        }

        const supabase = getSupabaseClient();
        if (isSupabaseConfigured && supabase) {
          await supabase.auth
            .signInWithPassword({ email: cleanEmail, password })
            .catch(() => {});
        }

        persistUser(data.user as UserProfile);
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: 'Koneksi ke server terganggu saat masuk.',
        };
      }
    },
    [persistUser]
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forgot-password',
          email: cleanEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error: data.error || 'Gagal mengirim tautan reset kata sandi.',
        };
      }
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: 'Koneksi ke server terganggu saat meminta reset kata sandi.',
      };
    }
  }, []);

  const confirmPasswordReset = useCallback(
    async (token: string, newPassword: string) => {
      try {
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reset-password',
            token,
            newPassword,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.user) {
          return {
            ok: false,
            error: data.error || 'Gagal memperbarui kata sandi.',
          };
        }
        persistUser(data.user as UserProfile);
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: 'Koneksi ke server terganggu saat menyimpan kata sandi baru.',
        };
      }
    },
    [persistUser]
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    }).catch(() => {});
    const supabase = getSupabaseClient();
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    persistUser(null);
  }, [persistUser]);

  const deleteAccount = useCallback(async () => {
    if (user) {
      await fetch('/api/auth/sync', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      }).catch(() => {});
      const accounts = getLocalAccounts();
      delete accounts[user.email];
      saveLocalAccounts(accounts);
    }
    const supabase = getSupabaseClient();
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    persistUser(null);
  }, [user, persistUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        selectedTemplateId,
        setSelectedTemplateId,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        verifyEmailAccount,
        resendVerificationEmail,
        requestPasswordReset,
        confirmPasswordReset,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider');
  }
  return ctx;
}
