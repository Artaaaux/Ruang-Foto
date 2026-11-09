import fs from 'fs';
import path from 'path';
import {
  PhotoboothResult,
  PhotoboothSession,
  PosePhotoPair,
  UserProfile,
  WebRTCSignalMessage,
} from './types';
import { getTemplateById } from './templates';
import {
  getSupabaseAdminClient,
  isSupabaseConfigured,
  STORAGE_BUCKET,
} from './supabase';

export interface StoredServerUser extends UserProfile {
  passwordHash?: string;
}

interface LocalDatabase {
  sessions: Record<string, PhotoboothSession>;
  results: Record<string, PhotoboothResult>;
  signals: Record<string, WebRTCSignalMessage[]>;
  users?: Record<string, StoredServerUser>;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'ruangfoto-store.json');

const SESSION_DURATION_MS = 15 * 60 * 1000; // 15 menit (NFR-03)
const RESULT_RETENTION_MS = 24 * 60 * 60 * 1000; // 1x24 jam (FR-10)
const CLEANUP_THROTTLE_MS = 2 * 60 * 1000; // 2 menit throttle
export const MAX_ACTIVE_RESULTS_PER_USER = 10; // Solusi 1.000 foto
export const MAX_ACTIVE_SESSIONS_PER_USER = 5;
export const MAX_POSE_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_COMPOSITE_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,80}$/;
export function isSafeIdentifier(val: string): boolean {
  return typeof val === 'string' && SAFE_ID_REGEX.test(val.trim());
}

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const globalForDb = globalThis as unknown as {
  __rfDbCache?: LocalDatabase;
  __rfDbMtimeMs?: number;
  __rfSessionQueues?: Map<string, Promise<unknown>>;
  __rfLastCleanupMs?: number;
};

function getSessionQueues(): Map<string, Promise<unknown>> {
  if (!globalForDb.__rfSessionQueues) {
    globalForDb.__rfSessionQueues = new Map();
  }
  return globalForDb.__rfSessionQueues;
}

function readLocalDb(): LocalDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: LocalDatabase = { sessions: {}, results: {}, signals: {} };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      globalForDb.__rfDbCache = initial;
      globalForDb.__rfDbMtimeMs = Date.now();
      return initial;
    }
    const stat = fs.statSync(DB_FILE);
    if (
      globalForDb.__rfDbCache &&
      globalForDb.__rfDbMtimeMs &&
      stat.mtimeMs <= globalForDb.__rfDbMtimeMs
    ) {
      return globalForDb.__rfDbCache;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as LocalDatabase;
    globalForDb.__rfDbCache = parsed;
    globalForDb.__rfDbMtimeMs = stat.mtimeMs;
    return parsed;
  } catch {
    if (globalForDb.__rfDbCache) {
      return globalForDb.__rfDbCache;
    }
    return { sessions: {}, results: {}, signals: {} };
  }
}

function writeLocalDb(db: LocalDatabase): void {
  globalForDb.__rfDbCache = db;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    globalForDb.__rfDbMtimeMs = fs.statSync(DB_FILE).mtimeMs;
  } catch {
    // Ignore write failure on read-only edge environments
  }
}

// Pastikan bucket Supabase Storage tersedia
let bucketChecked = false;
async function ensureStorageBucket() {
  const sb = getSupabaseAdminClient();
  if (!sb || bucketChecked) return;
  try {
    const { data: buckets } = await sb.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === STORAGE_BUCKET);
    if (!exists) {
      await sb.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: 15728640,
      });
    }
    bucketChecked = true;
  } catch {
    // Ignore storage bucket check error
  }
}

function parseDataUrl(
  dataUrl: string,
  maxBytes = MAX_POSE_IMAGE_BYTES
): { mime: string; ext: string; buffer: Buffer } | null {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  if (dataUrl.length > Math.ceil(maxBytes * 1.4) + 256) return null;

  const match = dataUrl.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/
  );
  if (!match) return null;

  const mime = match[1].toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.has(mime)) return null;

  const ext =
    mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.byteLength === 0 || buffer.byteLength > maxBytes) return null;

  return { mime, ext, buffer };
}

export function isValidImageDataUrl(
  dataUrl: string,
  maxBytes = MAX_POSE_IMAGE_BYTES
): boolean {
  return parseDataUrl(dataUrl, maxBytes) !== null;
}

/**
 * Mengunggah Data URL (base64) ke Supabase Storage `ruangfoto-media`
 * dan mengembalikan URL publiknya (atau mengembalikan dataUrl asli jika gagal).
 */
export async function uploadDataUrlToSupabaseStorage(
  storagePathPrefix: string,
  dataUrl: string,
  maxBytes = MAX_POSE_IMAGE_BYTES
): Promise<{ publicUrl: string; storagePath: string } | null> {
  const sb = getSupabaseAdminClient();
  if (!sb || !dataUrl.startsWith('data:image/')) return null;

  const parsed = parseDataUrl(dataUrl, maxBytes);
  if (!parsed) return null;

  await ensureStorageBucket();
  const storagePath = `${storagePathPrefix}.${parsed.ext}`;

  const { error } = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, parsed.buffer, {
      contentType: parsed.mime,
      upsert: true,
    });

  if (error) return null;

  const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  if (!data?.publicUrl) return null;

  return {
    publicUrl: `${data.publicUrl}?t=${Date.now()}`,
    storagePath,
  };
}

// ============================================================================
// Mapper Baris PostgreSQL <-> Objek Domain RuangFoto
// ============================================================================

function rowToSession(row: Record<string, unknown>): PhotoboothSession {
  return {
    id: String(row.id),
    code: String(row.code),
    templateId: String(row.template_id),
    hostId: String(row.host_id),
    hostName: String(row.host_name || 'Host'),
    hostAvatarColor: String(row.host_avatar_color || '#FFE066'),
    guestId: row.guest_id ? String(row.guest_id) : undefined,
    guestName: row.guest_name ? String(row.guest_name) : undefined,
    guestAvatarColor: row.guest_avatar_color
      ? String(row.guest_avatar_color)
      : undefined,
    status: (row.status as PhotoboothSession['status']) || 'menunggu',
    hostReady: Boolean(row.host_ready),
    guestReady: Boolean(row.guest_ready),
    hostMicOn: row.host_mic_on !== false,
    hostCamOn: row.host_cam_on !== false,
    guestMicOn: row.guest_mic_on !== false,
    guestCamOn: row.guest_cam_on !== false,
    currentPose: Number(row.current_pose || 1),
    countdownStartedAt:
      row.countdown_started_at !== null &&
      row.countdown_started_at !== undefined
        ? Number(row.countdown_started_at)
        : null,
    poses: Array.isArray(row.poses) ? (row.poses as PosePhotoPair[]) : [],
    resultId: row.result_id ? String(row.result_id) : undefined,
    startedAt: String(row.started_at || new Date().toISOString()),
    completedAt: row.completed_at ? String(row.completed_at) : undefined,
    expiresAt: String(row.expires_at || new Date().toISOString()),
  };
}

function sessionToRow(session: PhotoboothSession) {
  return {
    id: session.id,
    code: session.code,
    template_id: session.templateId,
    host_id: session.hostId,
    host_name: session.hostName,
    host_avatar_color: session.hostAvatarColor,
    guest_id: session.guestId ?? null,
    guest_name: session.guestName ?? null,
    guest_avatar_color: session.guestAvatarColor ?? null,
    status: session.status,
    host_ready: session.hostReady,
    guest_ready: session.guestReady,
    host_mic_on: session.hostMicOn,
    host_cam_on: session.hostCamOn,
    guest_mic_on: session.guestMicOn,
    guest_cam_on: session.guestCamOn,
    current_pose: session.currentPose,
    countdown_started_at: session.countdownStartedAt ?? null,
    poses: session.poses,
    result_id: session.resultId ?? null,
    started_at: session.startedAt,
    completed_at: session.completedAt ?? null,
    expires_at: session.expiresAt,
  };
}

function rowToResult(row: Record<string, unknown>): PhotoboothResult {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    sessionCode: String(row.session_code),
    templateId: String(row.template_id),
    hostId: String(row.host_id),
    hostName: String(row.host_name || 'Host'),
    guestId: row.guest_id ? String(row.guest_id) : undefined,
    guestName: row.guest_name ? String(row.guest_name) : undefined,
    poses: Array.isArray(row.poses) ? (row.poses as PosePhotoPair[]) : [],
    compositeDataUrl: row.composite_data_url
      ? String(row.composite_data_url)
      : row.image_url
        ? String(row.image_url)
        : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    expiresAt: String(row.expires_at || new Date().toISOString()),
  };
}

function resultToRow(result: PhotoboothResult) {
  return {
    id: result.id,
    session_id: result.sessionId,
    session_code: result.sessionCode,
    template_id: result.templateId,
    host_id: result.hostId,
    host_name: result.hostName,
    guest_id: result.guestId ?? null,
    guest_name: result.guestName ?? null,
    poses: result.poses,
    image_url: result.compositeDataUrl || '',
    composite_data_url: result.compositeDataUrl ?? null,
    created_at: result.createdAt,
    expires_at: result.expiresAt,
  };
}

async function ensureTemplateSeededInSupabase(templateId: string) {
  const sb = getSupabaseAdminClient();
  if (!sb) return;
  const tpl = getTemplateById(templateId);
  await sb.from('templates').upsert(
    {
      id: tpl.id,
      name: tpl.name,
      category: tpl.category,
      pose_count: tpl.poseCount,
      layout_config: {
        orientation: 'vertical',
        width: tpl.frame?.width || 1080,
        height: tpl.frame?.height || 2880,
        frameSrc: tpl.frame?.src || null,
      },
      frame_color: tpl.stripBg,
      accent_color: '#FFE066',
      is_free: true,
    },
    { onConflict: 'id' }
  );
}

/**
 * Sinkronisasi profil pengguna ke tabel `public.users` di Supabase dan fallback lokal.
 */
export async function upsertUserProfile(
  user: UserProfile,
  passwordHash?: string
): Promise<void> {
  const cleanEmail = user.email.trim().toLowerCase();
  const sb = getSupabaseAdminClient();
  let sbSaved = false;

  if (isSupabaseConfigured && sb) {
    const { error } = await sb.from('users').upsert(
      {
        id: user.id,
        name: user.name,
        email: cleanEmail,
        login_method: user.loginMethod,
        verified: user.verified,
        avatar_color: user.avatarColor || '#FFE066',
        created_at: user.createdAt || new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    sbSaved = !error;
  }

  if (!sbSaved || passwordHash || process.env.NODE_ENV !== 'production') {
    const db = readLocalDb();
    if (!db.users) {
      db.users = {};
    }
    const existing = db.users[cleanEmail];
    db.users[cleanEmail] = {
      ...user,
      email: cleanEmail,
      passwordHash: passwordHash ?? existing?.passwordHash,
    };
    writeLocalDb(db);
  }
}

export function getLocalServerUserByEmail(
  email: string
): StoredServerUser | null {
  const cleanEmail = email.trim().toLowerCase();
  const db = readLocalDb();
  return db.users?.[cleanEmail] || null;
}

export function deleteLocalServerUserById(userId: string): void {
  const db = readLocalDb();
  if (!db.users) return;
  let changed = false;
  for (const [email, u] of Object.entries(db.users)) {
    if (u.id === userId) {
      delete db.users[email];
      changed = true;
    }
  }
  if (changed) {
    writeLocalDb(db);
  }
}

/**
 * Membersihkan foto/hasil yang sudah melewati 1x24 jam (FR-10)
 * dan menutup sesi yang melampaui batas durasi 15 menit (NFR-03).
 */
export async function cleanupExpiredData(force = false): Promise<{
  expiredSessions: number;
  deletedResults: number;
  mode: 'supabase-postgres' | 'local-fallback';
}> {
  const now = Date.now();
  if (
    !force &&
    globalForDb.__rfLastCleanupMs &&
    now - globalForDb.__rfLastCleanupMs < CLEANUP_THROTTLE_MS
  ) {
    return {
      expiredSessions: 0,
      deletedResults: 0,
      mode: isSupabaseConfigured ? 'supabase-postgres' : 'local-fallback',
    };
  }
  globalForDb.__rfLastCleanupMs = now;

  const sb = getSupabaseAdminClient();
  const nowIso = new Date(now).toISOString();

  if (isSupabaseConfigured && sb) {
    const [{ data: expPhotos, error: checkErr }, { data: expResultsList }] =
      await Promise.all([
        sb.from('photos').select('id, storage_path').lte('expires_at', nowIso),
        sb.from('results').select('id').lte('expires_at', nowIso),
      ]);

    if (!checkErr) {
      const storagePathsToRemove = new Set<string>();
      if (Array.isArray(expPhotos)) {
        for (const p of expPhotos) {
          if (p.storage_path) storagePathsToRemove.add(String(p.storage_path));
        }
      }
      if (Array.isArray(expResultsList)) {
        for (const r of expResultsList) {
          if (r.id) {
            storagePathsToRemove.add(`results/${r.id}.png`);
            storagePathsToRemove.add(`results/${r.id}.jpg`);
            storagePathsToRemove.add(`results/${r.id}.webp`);
          }
        }
      }

      if (storagePathsToRemove.size > 0) {
        await sb.storage
          .from(STORAGE_BUCKET)
          .remove(Array.from(storagePathsToRemove))
          .then(
            () => {},
            () => {}
          );
      }

      if (expPhotos && expPhotos.length > 0) {
        await sb.from('photos').delete().lte('expires_at', nowIso);
      }

      const { data: expResults } = await sb
        .from('results')
        .delete()
        .lte('expires_at', nowIso)
        .select('id');

      const { data: expSessions } = await sb
        .from('sessions')
        .update({ status: 'kedaluwarsa', poses: [] })
        .in('status', ['menunggu', 'berjalan'])
        .lte('expires_at', nowIso)
        .select('id');

      await sb
        .from('signals')
        .delete()
        .lte('created_at_ms', now - 5 * 60 * 1000);

      await sb.rpc('cleanup_expired_ruangfoto_data').then(
        () => {},
        () => {}
      );

      return {
        expiredSessions: expSessions?.length || 0,
        deletedResults: expResults?.length || 0,
        mode: 'supabase-postgres',
      };
    }
  }

  // Fallback ke penyimpanan lokal jika tabel PostgreSQL belum di-migrate
  const db = readLocalDb();
  let expiredSessions = 0;
  let deletedResults = 0;
  let dirty = false;

  for (const [code, session] of Object.entries(db.sessions)) {
    const exp = new Date(session.expiresAt).getTime();
    if (
      (session.status === 'menunggu' || session.status === 'berjalan') &&
      exp <= now
    ) {
      db.sessions[code].status = 'kedaluwarsa';
      db.sessions[code].poses = [];
      expiredSessions++;
      dirty = true;
    }
    if (session.completedAt) {
      const retentionExp =
        new Date(session.completedAt).getTime() + RESULT_RETENTION_MS;
      if (
        retentionExp <= now &&
        session.poses.some((p) => p.hostDataUrl || p.guestDataUrl)
      ) {
        db.sessions[code].poses = session.poses.map((p) => ({
          poseNumber: p.poseNumber,
        }));
        dirty = true;
      }
    }
    if (
      session.status === 'kedaluwarsa' &&
      now - exp > RESULT_RETENTION_MS
    ) {
      delete db.sessions[code];
      delete db.signals[code];
      dirty = true;
    }
  }

  for (const [id, result] of Object.entries(db.results)) {
    const exp = new Date(result.expiresAt).getTime();
    if (exp <= now) {
      delete db.results[id];
      deletedResults++;
      dirty = true;
    }
  }

  for (const [code, list] of Object.entries(db.signals)) {
    const filtered = list.filter((msg) => now - msg.createdAt < 5 * 60 * 1000);
    if (filtered.length === 0) {
      delete db.signals[code];
      dirty = true;
    } else if (filtered.length !== list.length) {
      db.signals[code] = filtered;
      dirty = true;
    }
  }

  if (dirty) {
    writeLocalDb(db);
  }
  return { expiredSessions, deletedResults, mode: 'local-fallback' };
}

export function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 3; i++) {
    part1 += chars[Math.floor(Math.random() * chars.length)];
    part2 += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${part1}-${part2}`;
}

async function getActiveSessionsCountByHost(hostId: string): Promise<number> {
  const cleanHostId = hostId.trim();
  if (!isSafeIdentifier(cleanHostId)) return 0;

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const sb = getSupabaseAdminClient();

  if (isSupabaseConfigured && sb) {
    const { count, error } = await sb
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', cleanHostId)
      .in('status', ['menunggu', 'berjalan'])
      .gt('expires_at', nowIso);

    if (!error && typeof count === 'number') {
      return count;
    }
  }

  const db = readLocalDb();
  let count = 0;
  for (const ses of Object.values(db.sessions)) {
    if (
      ses.hostId === cleanHostId &&
      (ses.status === 'menunggu' || ses.status === 'berjalan') &&
      new Date(ses.expiresAt).getTime() > now
    ) {
      count += 1;
    }
  }
  return count;
}

export async function createSessionRecord(params: {
  templateId: string;
  hostId: string;
  hostName: string;
  hostAvatarColor: string;
}): Promise<PhotoboothSession> {
  await cleanupExpiredData(false);

  const activeResults = await getResultsByUserId(params.hostId);
  if (activeResults.length >= MAX_ACTIVE_RESULTS_PER_USER) {
    throw new Error(
      `QUOTA_EXCEEDED:Kamu sudah memiliki ${MAX_ACTIVE_RESULTS_PER_USER} hasil foto aktif (1x24 jam). Unduh atau hapus lebih awal salah satu hasil fotomu sebelum membuat sesi baru.`
    );
  }

  const activeSessionsCount = await getActiveSessionsCountByHost(params.hostId);
  if (activeSessionsCount >= MAX_ACTIVE_SESSIONS_PER_USER) {
    throw new Error(
      `QUOTA_EXCEEDED:Kamu sudah memiliki ${MAX_ACTIVE_SESSIONS_PER_USER} sesi foto yang masih aktif. Selesaikan sesi sebelumnya terlebih dahulu.`
    );
  }

  const template = getTemplateById(params.templateId);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  const poses = Array.from({ length: template.poseCount }, (_, idx) => ({
    poseNumber: idx + 1,
  }));

  const sb = getSupabaseAdminClient();
  let code = generateSessionCode();

  const session: PhotoboothSession = {
    id: `ses_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    code,
    templateId: template.id,
    hostId: params.hostId,
    hostName: params.hostName,
    hostAvatarColor: params.hostAvatarColor || '#FFE066',
    status: 'menunggu',
    hostReady: false,
    guestReady: false,
    hostMicOn: true,
    hostCamOn: true,
    guestMicOn: true,
    guestCamOn: true,
    currentPose: 1,
    countdownStartedAt: null,
    poses,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  if (isSupabaseConfigured && sb) {
    await ensureTemplateSeededInSupabase(template.id);
    const { data, error } = await sb
      .from('sessions')
      .insert(sessionToRow(session))
      .select('*')
      .single();

    if (!error && data) {
      return rowToSession(data as Record<string, unknown>);
    }
  }

  // Fallback ke local DB jika tabel belum ada
  const db = readLocalDb();
  while (db.sessions[code]) {
    code = generateSessionCode();
    session.code = code;
  }
  db.sessions[code] = session;
  db.signals[code] = [];
  writeLocalDb(db);
  return session;
}

export async function getSessionByCode(
  code: string
): Promise<PhotoboothSession | null> {
  const normalized = code.trim().toUpperCase();
  if (!isSafeIdentifier(normalized)) return null;

  const sb = getSupabaseAdminClient();

  if (isSupabaseConfigured && sb) {
    const { data, error } = await sb
      .from('sessions')
      .select('*')
      .eq('code', normalized)
      .maybeSingle();

    if (!error && data) {
      const ses = rowToSession(data as Record<string, unknown>);
      const exp = new Date(ses.expiresAt).getTime();
      if (
        (ses.status === 'menunggu' || ses.status === 'berjalan') &&
        exp <= Date.now()
      ) {
        ses.status = 'kedaluwarsa';
        ses.poses = [];
        await sb
          .from('sessions')
          .update({ status: 'kedaluwarsa', poses: [] })
          .eq('code', normalized);
      }
      return ses;
    }
  }

  const db = readLocalDb();
  const ses = db.sessions[normalized];
  if (!ses) return null;
  const exp = new Date(ses.expiresAt).getTime();
  if (
    (ses.status === 'menunggu' || ses.status === 'berjalan') &&
    exp <= Date.now()
  ) {
    ses.status = 'kedaluwarsa';
    ses.poses = [];
    writeLocalDb(db);
  }
  return ses;
}

/**
 * Mengunggah foto jepretan pose ke Supabase Storage `ruangfoto-media`
 * dan menyimpan metadata ke tabel `public.photos`.
 */
export async function storePosePhoto(params: {
  sessionId: string;
  sessionCode: string;
  poseNumber: number;
  role: 'host' | 'guest';
  ownerId?: string;
  dataUrl: string;
}): Promise<string> {
  const { sessionId, sessionCode, poseNumber, role, ownerId, dataUrl } = params;
  const parsed = parseDataUrl(dataUrl, MAX_POSE_IMAGE_BYTES);
  if (!parsed) {
    throw new Error(
      'INVALID_IMAGE:Format atau ukuran gambar pose tidak valid (maksimal 5 MB, format JPG/PNG/WebP).'
    );
  }

  const sb = getSupabaseAdminClient();
  if (!isSupabaseConfigured || !sb) {
    return dataUrl;
  }

  const uploaded = await uploadDataUrlToSupabaseStorage(
    `sessions/${sessionId}/pose-${poseNumber}-${role}`,
    dataUrl,
    MAX_POSE_IMAGE_BYTES
  );
  if (!uploaded) {
    return dataUrl;
  }

  const expiresAt = new Date(Date.now() + RESULT_RETENTION_MS).toISOString();
  await sb
    .from('photos')
    .upsert(
      {
        session_id: sessionId,
        session_code: sessionCode.toUpperCase(),
        pose_number: poseNumber,
        owner_role: role,
        owner_id: ownerId ?? null,
        storage_path: uploaded.storagePath,
        public_url: uploaded.publicUrl,
        expires_at: expiresAt,
      },
      { onConflict: 'session_id,pose_number,owner_role' }
    )
    .then(
      () => {},
      () => {}
    );

  return uploaded.publicUrl;
}

export async function clearSessionPosePhotos(
  sessionId: string,
  poseNumber?: number
): Promise<void> {
  const sb = getSupabaseAdminClient();
  if (!isSupabaseConfigured || !sb || !isSafeIdentifier(sessionId)) return;

  try {
    let selectQuery = sb
      .from('photos')
      .select('storage_path')
      .eq('session_id', sessionId);
    if (typeof poseNumber === 'number') {
      selectQuery = selectQuery.eq('pose_number', poseNumber);
    }
    const { data: photos } = await selectQuery;
    if (Array.isArray(photos) && photos.length > 0) {
      const paths = photos
        .map((p) => (p.storage_path ? String(p.storage_path) : ''))
        .filter(Boolean);
      if (paths.length > 0) {
        await sb.storage
          .from(STORAGE_BUCKET)
          .remove(paths)
          .catch(() => {});
      }
    }

    let deleteQuery = sb.from('photos').delete().eq('session_id', sessionId);
    if (typeof poseNumber === 'number') {
      deleteQuery = deleteQuery.eq('pose_number', poseNumber);
    }
    await deleteQuery;
  } catch {
    // Ignore cleanup hiccup
  }
}

export async function updateSessionByCode(
  code: string,
  updater: (
    current: PhotoboothSession
  ) => PhotoboothSession | Promise<PhotoboothSession>
): Promise<PhotoboothSession | null> {
  const normalized = code.trim().toUpperCase();
  if (!isSafeIdentifier(normalized)) return null;

  const queues = getSessionQueues();
  const prev = queues.get(normalized) || Promise.resolve();

  const task = prev
    .catch(() => {})
    .then(() => updateSessionByCodeInternal(normalized, updater))
    .finally(() => {
      if (queues.get(normalized) === task) {
        queues.delete(normalized);
      }
    });

  queues.set(normalized, task);
  return task;
}

async function updateSessionByCodeInternal(
  normalized: string,
  updater: (
    current: PhotoboothSession
  ) => PhotoboothSession | Promise<PhotoboothSession>
): Promise<PhotoboothSession | null> {
  const existing = await getSessionByCode(normalized);
  if (!existing) return null;

  const previousResultId = existing.resultId;
  const updated = await updater(existing);
  const sb = getSupabaseAdminClient();

  // Sinkronkan baris foto dari tabel `public.photos` agar unggahan paralel Host & Guest tidak saling menimpa
  if (
    isSupabaseConfigured &&
    sb &&
    updated.status !== 'kedaluwarsa' &&
    updated.poses.length > 0
  ) {
    const { data: photoRows } = await sb
      .from('photos')
      .select('pose_number, owner_role, public_url, created_at')
      .eq('session_id', existing.id);

    if (Array.isArray(photoRows) && photoRows.length > 0) {
      const byPose = new Map<
        number,
        { hostUrl?: string; guestUrl?: string; capturedAt?: string }
      >();
      for (const row of photoRows) {
        const pNum = Number(row.pose_number);
        const role = String(row.owner_role);
        const url = row.public_url ? String(row.public_url) : undefined;
        if (!url) continue;
        const entry = byPose.get(pNum) || {};
        if (role === 'host') entry.hostUrl = url;
        if (role === 'guest') entry.guestUrl = url;
        if (row.created_at) entry.capturedAt = String(row.created_at);
        byPose.set(pNum, entry);
      }

      updated.poses = updated.poses.map((p) => {
        const dbEntry = byPose.get(p.poseNumber);
        if (!dbEntry) return p;
        return {
          ...p,
          hostDataUrl: p.hostDataUrl || dbEntry.hostUrl,
          guestDataUrl: p.guestDataUrl || dbEntry.guestUrl,
          capturedAt:
            p.capturedAt || dbEntry.capturedAt || new Date().toISOString(),
        };
      });

      const currentPoseObj = updated.poses.find(
        (p) => p.poseNumber === updated.currentPose
      );
      const currentPoseDone = Boolean(
        currentPoseObj?.hostDataUrl && currentPoseObj?.guestDataUrl
      );
      if (currentPoseDone) {
        if (updated.currentPose < updated.poses.length) {
          updated.currentPose += 1;
        }
        updated.hostReady = false;
        updated.guestReady = false;
        updated.countdownStartedAt = null;
      }
    }
  }

  // Jika semua foto pose sudah lengkap dari host & guest, buat/perbarui entri result
  const allPosesComplete =
    updated.poses.length > 0 &&
    updated.poses.every(
      (p) => Boolean(p.hostDataUrl) && Boolean(p.guestDataUrl)
    );

  let createdOrUpdatedResult: PhotoboothResult | null = null;

  if (allPosesComplete && !updated.resultId) {
    const completedTime = new Date();
    const resultExpiresAt = new Date(
      completedTime.getTime() + RESULT_RETENTION_MS
    );
    const resultId =
      previousResultId ||
      `res_${updated.code.replace('-', '').toLowerCase()}_${Date.now().toString(36)}`;
    updated.status = 'selesai';
    updated.completedAt = completedTime.toISOString();
    updated.resultId = resultId;

    createdOrUpdatedResult = {
      id: resultId,
      sessionId: updated.id,
      sessionCode: updated.code,
      templateId: updated.templateId,
      hostId: updated.hostId,
      hostName: updated.hostName,
      guestId: updated.guestId,
      guestName: updated.guestName || 'Pasangan',
      poses: updated.poses,
      createdAt: completedTime.toISOString(),
      expiresAt: resultExpiresAt.toISOString(),
    };
  }

  if (isSupabaseConfigured && sb) {
    const { data, error } = await sb
      .from('sessions')
      .update(sessionToRow(updated))
      .eq('code', normalized)
      .select('*')
      .maybeSingle();

    if (!error && data) {
      if (previousResultId && !updated.resultId) {
        await sb.storage
          .from(STORAGE_BUCKET)
          .remove([
            `results/${previousResultId}.png`,
            `results/${previousResultId}.jpg`,
            `results/${previousResultId}.webp`,
          ])
          .then(
            () => {},
            () => {}
          );
        await sb
          .from('results')
          .delete()
          .eq('session_id', updated.id)
          .then(
            () => {},
            () => {}
          );
      }
      if (createdOrUpdatedResult) {
        // Cegah bentrok Primary Key `id` vs Unique Key `session_id` saat retake-all
        await sb
          .from('results')
          .delete()
          .eq('session_id', updated.id)
          .neq('id', createdOrUpdatedResult.id)
          .then(
            () => {},
            () => {}
          );
        await sb
          .from('results')
          .upsert(resultToRow(createdOrUpdatedResult), {
            onConflict: 'id',
          });
      } else if (updated.resultId) {
        await sb
          .from('results')
          .update({ poses: updated.poses })
          .eq('id', updated.resultId);
      }
      return rowToSession(data as Record<string, unknown>);
    }
  }

  // Fallback ke penyimpanan lokal
  const db = readLocalDb();
  db.sessions[normalized] = updated;
  if (previousResultId && !updated.resultId) {
    delete db.results[previousResultId];
  }
  if (createdOrUpdatedResult) {
    for (const [rid, r] of Object.entries(db.results)) {
      if (r.sessionId === updated.id && rid !== createdOrUpdatedResult.id) {
        delete db.results[rid];
      }
    }
    db.results[createdOrUpdatedResult.id] = createdOrUpdatedResult;
  } else if (updated.resultId && db.results[updated.resultId]) {
    db.results[updated.resultId].poses = updated.poses;
  }
  writeLocalDb(db);
  return updated;
}

export async function pushSignalMessage(
  msg: Omit<WebRTCSignalMessage, 'id' | 'createdAt'> & { id?: string }
): Promise<WebRTCSignalMessage> {
  const code = msg.sessionCode.trim().toUpperCase();
  const full: WebRTCSignalMessage = {
    ...msg,
    sessionCode: code,
    id: msg.id || `sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };

  if (!isSafeIdentifier(code)) return full;

  const sb = getSupabaseAdminClient();
  if (isSupabaseConfigured && sb) {
    const { error } = await sb.from('signals').insert({
      id: full.id,
      session_code: full.sessionCode,
      sender_id: full.senderId,
      sender_role: full.senderRole,
      type: full.type,
      payload: full.payload,
      created_at_ms: full.createdAt,
    });
    if (!error) {
      return full;
    }
  }

  const db = readLocalDb();
  if (!db.signals[code]) {
    db.signals[code] = [];
  }
  db.signals[code].push(full);
  if (db.signals[code].length > 100) {
    db.signals[code] = db.signals[code].slice(-100);
  }
  writeLocalDb(db);
  return full;
}

export async function getSignalsSince(
  code: string,
  sinceTimestamp: number,
  excludeSenderId?: string
): Promise<WebRTCSignalMessage[]> {
  const normalized = code.trim().toUpperCase();
  if (!isSafeIdentifier(normalized)) return [];

  const sb = getSupabaseAdminClient();

  if (isSupabaseConfigured && sb) {
    let query = sb
      .from('signals')
      .select('*')
      .eq('session_code', normalized)
      .gt('created_at_ms', sinceTimestamp)
      .order('created_at_ms', { ascending: true })
      .limit(100);

    if (excludeSenderId && isSafeIdentifier(excludeSenderId)) {
      query = query.neq('sender_id', excludeSenderId);
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      return data.map((row) => ({
        id: String(row.id),
        sessionCode: String(row.session_code),
        senderId: String(row.sender_id),
        senderRole: (row.sender_role as 'host' | 'guest') || 'host',
        type: row.type as WebRTCSignalMessage['type'],
        payload: (row.payload as Record<string, unknown>) || {},
        createdAt: Number(row.created_at_ms),
      }));
    }
  }

  const db = readLocalDb();
  const list = db.signals[normalized] || [];
  return list.filter(
    (m) =>
      m.createdAt > sinceTimestamp &&
      (!excludeSenderId || m.senderId !== excludeSenderId)
  );
}

export async function getResultById(
  id: string
): Promise<PhotoboothResult | null> {
  const cleanId = id.trim();
  if (!isSafeIdentifier(cleanId)) return null;

  const sb = getSupabaseAdminClient();

  if (isSupabaseConfigured && sb) {
    const { data, error } = await sb
      .from('results')
      .select('*')
      .or(
        `id.eq.${cleanId},session_code.ilike.${cleanId},session_id.eq.${cleanId}`
      )
      .maybeSingle();

    if (!error && data) {
      const res = rowToResult(data as Record<string, unknown>);
      if (new Date(res.expiresAt).getTime() <= Date.now()) {
        await deleteResultEarly(res.id);
        return null;
      }
      return res;
    }
  }

  const db = readLocalDb();
  if (db.results[cleanId]) {
    if (new Date(db.results[cleanId].expiresAt).getTime() <= Date.now()) {
      await deleteResultEarly(cleanId);
      return null;
    }
    return db.results[cleanId];
  }
  const byCode = Object.values(db.results).find(
    (r) =>
      r.sessionCode.toLowerCase() === cleanId.toLowerCase() ||
      r.sessionId === cleanId
  );
  if (byCode && new Date(byCode.expiresAt).getTime() <= Date.now()) {
    await deleteResultEarly(byCode.id);
    return null;
  }
  return byCode || null;
}

export async function getResultsByUserId(
  userId: string
): Promise<PhotoboothResult[]> {
  const cleanUserId = (userId || '').trim();
  if (!isSafeIdentifier(cleanUserId)) return [];
  await cleanupExpiredData(false);
  const sb = getSupabaseAdminClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  const mergedMap = new Map<string, PhotoboothResult>();

  if (isSupabaseConfigured && sb) {
    const { data, error } = await sb
      .from('results')
      .select('*')
      .or(`host_id.eq.${cleanUserId},guest_id.eq.${cleanUserId}`)
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      for (const row of data) {
        const mapped = rowToResult(row as Record<string, unknown>);
        if (new Date(mapped.expiresAt).getTime() > now) {
          mergedMap.set(mapped.id, mapped);
        }
      }
    }
  }

  const db = readLocalDb();
  for (const r of Object.values(db.results)) {
    if (
      (r.hostId === cleanUserId || r.guestId === cleanUserId) &&
      new Date(r.expiresAt).getTime() > now &&
      !mergedMap.has(r.id)
    ) {
      mergedMap.set(r.id, r);
    }
  }

  return Array.from(mergedMap.values()).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function saveResultComposite(
  id: string,
  compositeDataUrl: string
): Promise<PhotoboothResult | null> {
  if (!parseDataUrl(compositeDataUrl, MAX_COMPOSITE_IMAGE_BYTES)) {
    return null;
  }

  const existing = await getResultById(id);
  if (!existing) return null;

  let finalUrl = compositeDataUrl;
  const uploaded = await uploadDataUrlToSupabaseStorage(
    `results/${existing.id}`,
    compositeDataUrl,
    MAX_COMPOSITE_IMAGE_BYTES
  );
  if (uploaded) {
    finalUrl = uploaded.publicUrl;
  }

  existing.compositeDataUrl = finalUrl;

  const sb = getSupabaseAdminClient();
  if (isSupabaseConfigured && sb) {
    const { data, error } = await sb
      .from('results')
      .update({
        image_url: finalUrl,
        composite_data_url: finalUrl,
      })
      .eq('id', existing.id)
      .select('*')
      .maybeSingle();

    if (!error && data) {
      return rowToResult(data as Record<string, unknown>);
    }
  }

  const db = readLocalDb();
  if (db.results[existing.id]) {
    db.results[existing.id].compositeDataUrl = finalUrl;
    writeLocalDb(db);
  }
  return existing;
}

export async function deleteResultEarly(id: string): Promise<boolean> {
  const cleanId = id.trim();
  if (!isSafeIdentifier(cleanId)) return false;

  const sb = getSupabaseAdminClient();
  let existing: PhotoboothResult | null = null;

  if (isSupabaseConfigured && sb) {
    const { data } = await sb
      .from('results')
      .select('*')
      .or(
        `id.eq.${cleanId},session_code.ilike.${cleanId},session_id.eq.${cleanId}`
      )
      .maybeSingle();
    if (data) {
      existing = rowToResult(data as Record<string, unknown>);
    }
  }

  if (!existing) {
    const db = readLocalDb();
    existing =
      db.results[cleanId] ||
      Object.values(db.results).find(
        (r) =>
          r.sessionCode.toLowerCase() === cleanId.toLowerCase() ||
          r.sessionId === cleanId
      ) ||
      null;
  }

  if (!existing) return false;

  const code = existing.sessionCode.toUpperCase();

  if (isSupabaseConfigured && sb) {
    // Hapus file foto dari Supabase Storage
    const { data: photos } = await sb
      .from('photos')
      .select('storage_path')
      .eq('session_id', existing.sessionId);

    const pathsToRemove: string[] = [];
    if (Array.isArray(photos)) {
      for (const p of photos) {
        if (p.storage_path) pathsToRemove.push(String(p.storage_path));
      }
    }
    pathsToRemove.push(`results/${existing.id}.png`);
    pathsToRemove.push(`results/${existing.id}.jpg`);
    pathsToRemove.push(`results/${existing.id}.webp`);

    await sb.storage
      .from(STORAGE_BUCKET)
      .remove(pathsToRemove)
      .then(
        () => {},
        () => {}
      );

    await sb
      .from('photos')
      .delete()
      .eq('session_id', existing.sessionId)
      .then(
        () => {},
        () => {}
      );

    const clearedPoses = existing.poses.map((p) => ({
      poseNumber: p.poseNumber,
    }));
    await sb
      .from('sessions')
      .update({ poses: clearedPoses })
      .eq('code', code)
      .then(
        () => {},
        () => {}
      );

    const { error } = await sb.from('results').delete().eq('id', existing.id);
    if (!error) {
      const db = readLocalDb();
      if (db.results[existing.id]) {
        delete db.results[existing.id];
        writeLocalDb(db);
      }
      return true;
    }
  }

  const db = readLocalDb();
  if (db.sessions[code]) {
    db.sessions[code].poses = db.sessions[code].poses.map((p) => ({
      poseNumber: p.poseNumber,
    }));
  }
  delete db.results[existing.id];
  writeLocalDb(db);
  return true;
}
