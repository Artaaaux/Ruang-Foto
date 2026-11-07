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

interface LocalDatabase {
  sessions: Record<string, PhotoboothSession>;
  results: Record<string, PhotoboothResult>;
  signals: Record<string, WebRTCSignalMessage[]>;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'ruangfoto-store.json');

const SESSION_DURATION_MS = 15 * 60 * 1000; // 15 menit (NFR-03)
const RESULT_RETENTION_MS = 24 * 60 * 60 * 1000; // 1x24 jam (FR-10)

const globalForDb = globalThis as unknown as {
  __rfDbCache?: LocalDatabase;
  __rfDbMtimeMs?: number;
  __rfSessionQueues?: Map<string, Promise<unknown>>;
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
  dataUrl: string
): { mime: string; ext: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1];
  const ext = mime.includes('png') ? 'png' : 'jpg';
  const buffer = Buffer.from(match[2], 'base64');
  return { mime, ext, buffer };
}

/**
 * Mengunggah Data URL (base64) ke Supabase Storage `ruangfoto-media`
 * dan mengembalikan URL publiknya (atau mengembalikan dataUrl asli jika gagal).
 */
export async function uploadDataUrlToSupabaseStorage(
  storagePathPrefix: string,
  dataUrl: string
): Promise<{ publicUrl: string; storagePath: string } | null> {
  const sb = getSupabaseAdminClient();
  if (!sb || !dataUrl.startsWith('data:image/')) return null;

  const parsed = parseDataUrl(dataUrl);
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
 * Sinkronisasi profil pengguna ke tabel `public.users` di Supabase.
 */
export async function upsertUserProfile(user: UserProfile): Promise<void> {
  const sb = getSupabaseAdminClient();
  if (!sb) return;
  await sb.from('users').upsert(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      login_method: user.loginMethod,
      verified: user.verified,
      avatar_color: user.avatarColor || '#FFE066',
      created_at: user.createdAt || new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
}

/**
 * Membersihkan foto/hasil yang sudah melewati 1x24 jam (FR-10)
 * dan menutup sesi yang melampaui batas durasi 15 menit (NFR-03).
 */
export async function cleanupExpiredData(): Promise<{
  expiredSessions: number;
  deletedResults: number;
  mode: 'supabase-postgres' | 'local-fallback';
}> {
  const sb = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const now = Date.now();

  if (isSupabaseConfigured && sb) {
    // 1. Coba panggil fungsi RPC cleanup jika sudah ada di schema
    await sb.rpc('cleanup_expired_ruangfoto_data').then(() => {}, () => {});

    // 2. Hapus file di Supabase Storage untuk foto dan hasil yang sudah kedaluwarsa
    const { data: expPhotos, error: checkErr } = await sb
      .from('photos')
      .select('id, storage_path')
      .lte('expires_at', nowIso);

    if (!checkErr) {
      if (expPhotos && expPhotos.length > 0) {
        const paths = expPhotos
          .map((p) => String(p.storage_path))
          .filter(Boolean);
        if (paths.length > 0) {
          await sb.storage.from(STORAGE_BUCKET).remove(paths);
        }
        await sb.from('photos').delete().lte('expires_at', nowIso);
      }

      const { data: expResults } = await sb
        .from('results')
        .delete()
        .lte('expires_at', nowIso)
        .select('id');

      const { data: expSessions } = await sb
        .from('sessions')
        .update({ status: 'kedaluwarsa' })
        .in('status', ['menunggu', 'berjalan'])
        .lte('expires_at', nowIso)
        .select('id');

      await sb
        .from('signals')
        .delete()
        .lte('created_at_ms', now - 5 * 60 * 1000);

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
    if (filtered.length !== list.length) {
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

export async function createSessionRecord(params: {
  templateId: string;
  hostId: string;
  hostName: string;
  hostAvatarColor: string;
}): Promise<PhotoboothSession> {
  await cleanupExpiredData();
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
  const normalized = code.toUpperCase();
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
        await sb
          .from('sessions')
          .update({ status: 'kedaluwarsa' })
          .eq('code', normalized);
      }
      return ses;
    }
  }

  const db = readLocalDb();
  return db.sessions[normalized] || null;
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
  const sb = getSupabaseAdminClient();
  if (!isSupabaseConfigured || !sb || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  const uploaded = await uploadDataUrlToSupabaseStorage(
    `sessions/${sessionCode.toUpperCase()}/pose-${poseNumber}-${role}`,
    dataUrl
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
    .then(() => {}, () => {});

  return uploaded.publicUrl;
}

export async function updateSessionByCode(
  code: string,
  updater: (
    current: PhotoboothSession
  ) => PhotoboothSession | Promise<PhotoboothSession>
): Promise<PhotoboothSession | null> {
  const normalized = code.toUpperCase();
  const queues = getSessionQueues();
  const prev = queues.get(normalized) || Promise.resolve();

  const task = prev
    .catch(() => {})
    .then(() => updateSessionByCodeInternal(normalized, updater));

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

  const updated = await updater(existing);

  // Jika semua foto pose sudah lengkap dari host & guest, buat/perbarui entri result
  const allPosesComplete = updated.poses.every(
    (p) => Boolean(p.hostDataUrl) && Boolean(p.guestDataUrl)
  );

  let createdOrUpdatedResult: PhotoboothResult | null = null;

  if (allPosesComplete && !updated.resultId) {
    const completedTime = new Date();
    const resultExpiresAt = new Date(
      completedTime.getTime() + RESULT_RETENTION_MS
    );
    const resultId = `res_${updated.code.replace('-', '').toLowerCase()}_${Date.now().toString(36)}`;
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

  const sb = getSupabaseAdminClient();
  if (isSupabaseConfigured && sb) {
    const { data, error } = await sb
      .from('sessions')
      .update(sessionToRow(updated))
      .eq('code', normalized)
      .select('*')
      .maybeSingle();

    if (!error && data) {
      if (createdOrUpdatedResult) {
        await sb
          .from('results')
          .upsert(resultToRow(createdOrUpdatedResult), {
            onConflict: 'session_id',
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
  if (createdOrUpdatedResult) {
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
  const code = msg.sessionCode.toUpperCase();
  const full: WebRTCSignalMessage = {
    ...msg,
    sessionCode: code,
    id: msg.id || `sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };

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
  const normalized = code.toUpperCase();
  const sb = getSupabaseAdminClient();

  if (isSupabaseConfigured && sb) {
    let query = sb
      .from('signals')
      .select('*')
      .eq('session_code', normalized)
      .gt('created_at_ms', sinceTimestamp)
      .order('created_at_ms', { ascending: true })
      .limit(100);

    if (excludeSenderId) {
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
  const sb = getSupabaseAdminClient();

  if (isSupabaseConfigured && sb) {
    const { data, error } = await sb
      .from('results')
      .select('*')
      .or(`id.eq.${id},session_code.ilike.${id},session_id.eq.${id}`)
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
  if (db.results[id]) {
    return db.results[id];
  }
  const byCode = Object.values(db.results).find(
    (r) =>
      r.sessionCode.toLowerCase() === id.toLowerCase() || r.sessionId === id
  );
  return byCode || null;
}

export async function getResultsByUserId(
  userId: string
): Promise<PhotoboothResult[]> {
  if (!userId) return [];
  await cleanupExpiredData();
  const sb = getSupabaseAdminClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  const mergedMap = new Map<string, PhotoboothResult>();

  if (isSupabaseConfigured && sb) {
    const { data, error } = await sb
      .from('results')
      .select('*')
      .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
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
      (r.hostId === userId || r.guestId === userId) &&
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
  const existing = await getResultById(id);
  if (!existing) return null;

  let finalUrl = compositeDataUrl;
  const uploaded = await uploadDataUrlToSupabaseStorage(
    `results/${existing.id}`,
    compositeDataUrl
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
  const existing = await getResultById(id);
  if (!existing) return false;

  const code = existing.sessionCode.toUpperCase();
  const sb = getSupabaseAdminClient();

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

    await sb.storage
      .from(STORAGE_BUCKET)
      .remove(pathsToRemove)
      .then(() => {}, () => {});

    await sb
      .from('photos')
      .delete()
      .eq('session_id', existing.sessionId)
      .then(() => {}, () => {});

    const clearedPoses = existing.poses.map((p) => ({
      poseNumber: p.poseNumber,
    }));
    await sb
      .from('sessions')
      .update({ poses: clearedPoses })
      .eq('code', code)
      .then(() => {}, () => {});

    const { error } = await sb.from('results').delete().eq('id', existing.id);
    if (!error) {
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
