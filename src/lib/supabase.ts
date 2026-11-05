import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const STORAGE_BUCKET = 'ruangfoto-media';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project')
);

let clientInstance: SupabaseClient | null = null;
let adminInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
}

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  if (!adminInstance) {
    adminInstance = createClient(supabaseUrl, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminInstance;
}

export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    {
      urls: [
        process.env.NEXT_PUBLIC_STUN_URL || 'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
      ],
    },
  ];

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnUrl) {
    const urls = turnUrl.includes(',')
      ? turnUrl.split(',').map((u) => u.trim()).filter(Boolean)
      : turnUrl;
    servers.push({
      urls,
      username: turnUsername || undefined,
      credential: turnCredential || undefined,
    });
  } else {
    // Fallback publik TURN relay gratis (OpenRelay by Metered) untuk traversal NAT antar-jaringan/seluler
    servers.push({
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    });
  }

  return servers;
}
