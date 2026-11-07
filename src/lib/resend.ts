import crypto from 'crypto';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';
const resendFromEmail =
  process.env.RESEND_FROM_EMAIL || 'RuangFoto <noreply@ruangfoto.web.id>';

const tokenSecret =
  process.env.AUTH_TOKEN_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'ruangfoto-auth-hmac-secret-key-2026';

let resendInstance: Resend | null = null;

function getResendClient(): Resend | null {
  if (!resendApiKey || resendApiKey.includes('your_resend_api_key')) {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(resendApiKey);
  }
  return resendInstance;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  purpose: 'verify-email' | 'reset-password';
  redirect?: string;
  exp: number;
}

/**
 * Membuat token bertanda tangan HMAC-SHA256 untuk tautan verifikasi & reset sandi.
 */
export function createAuthToken(
  payload: Omit<AuthTokenPayload, 'exp'>,
  ttlMs: number
): string {
  const fullPayload: AuthTokenPayload = {
    ...payload,
    email: payload.email.trim().toLowerCase(),
    exp: Date.now() + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf-8').toString(
    'base64url'
  );
  const sig = crypto
    .createHmac('sha256', tokenSecret)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

/**
 * Memverifikasi keaslian dan masa berlaku token HMAC-SHA256.
 */
export function verifyAuthToken(
  token: string,
  expectedPurpose: AuthTokenPayload['purpose']
): AuthTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;

    const expectedSig = crypto
      .createHmac('sha256', tokenSecret)
      .update(encoded)
      .digest('base64url');

    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }

    const decoded = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf-8')
    ) as AuthTokenPayload;

    if (decoded.purpose !== expectedPurpose) return null;
    if (typeof decoded.exp !== 'number' || Date.now() > decoded.exp) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Hash kata sandi menggunakan scrypt + salt acak (PRD Bagian 10).
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

/**
 * Verifikasi kata sandi terhadap hash scrypt.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (!storedHash.startsWith('scrypt:')) return false;
    const [, salt, keyHex] = storedHash.split(':');
    if (!salt || !keyHex) return false;
    const keyBuf = Buffer.from(keyHex, 'hex');
    const derivedBuf = crypto.scryptSync(password, salt, 64);
    if (keyBuf.length !== derivedBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, derivedBuf);
  } catch {
    return false;
  }
}

export function resolveAppOrigin(requestOrigin?: string): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl.replace(/\/+$/, '');
  }
  if (requestOrigin && requestOrigin.startsWith('http')) {
    return requestOrigin.replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const resend = getResendClient();
  const safeName = escapeHtml(params.name || 'Teman RuangFoto');
  const safeUrl = escapeHtml(params.verifyUrl);

  if (!resend) {
    console.warn(
      '[RuangFoto Resend] RESEND_API_KEY belum diatur. Tautan verifikasi:',
      params.verifyUrl
    );
    return {
      ok: false,
      error:
        'Layanan email belum aktif (RESEND_API_KEY belum diisi di .env.local).',
    };
  }

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verifikasi Email RuangFoto</title>
</head>
<body style="margin:0;padding:24px;background-color:#FFF8EC;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1A1A1A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background-color:#FFFFFF;border:3px solid #1A1A1A;border-radius:16px;">
    <tr>
      <td style="padding:28px 24px;background-color:#FFE066;border-bottom:3px solid #1A1A1A;border-radius:13px 13px 0 0;">
        <span style="display:inline-block;padding:6px 12px;background-color:#FF5C5C;color:#1A1A1A;border:2px solid #1A1A1A;border-radius:8px;font-weight:800;font-size:14px;">RuangFoto</span>
        <h1 style="margin:14px 0 0;font-size:24px;line-height:1.25;font-weight:800;color:#1A1A1A;">
          Verifikasi Email Kamu
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 24px;">
        <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">
          Halo <strong>${safeName}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4A453E;">
          Terima kasih sudah mendaftar di <strong>RuangFoto</strong> — photobooth jarak jauh gratis untuk berfoto serempak bersama pasangan atau sahabat. Klik tombol di bawah ini untuk mengaktifkan akunmu:
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
          <tr>
            <td style="border-radius:12px;background-color:#FF5C5C;border:3px solid #1A1A1A;">
              <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:14px 24px;font-size:16px;font-weight:800;color:#1A1A1A;text-decoration:none;">
                Verifikasi Email Sekarang
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#6E665E;">
          Atau salin dan buka tautan ini di browser kamu:
        </p>
        <p style="margin:0 0 20px;font-size:12px;line-height:1.5;word-break:break-all;color:#1A1A1A;background-color:#FFF8EC;padding:10px 12px;border:2px solid #1A1A1A;border-radius:8px;">
          ${safeUrl}
        </p>
        <p style="margin:0;font-size:13px;line-height:1.5;color:#6E665E;">
          Tautan ini berlaku selama 24 jam. Jika kamu tidak merasa mendaftar di RuangFoto, abaikan email ini.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = [
    `Halo ${params.name || 'Teman RuangFoto'},`,
    '',
    'Terima kasih sudah mendaftar di RuangFoto.',
    'Klik tautan berikut untuk memverifikasi email dan mengaktifkan akunmu:',
    params.verifyUrl,
    '',
    'Tautan ini berlaku selama 24 jam.',
  ].join('\n');

  try {
    const { data, error } = await resend.emails.send({
      from: resendFromEmail,
      to: [params.to.trim().toLowerCase()],
      subject: 'Verifikasi Email Akun RuangFoto Kamu',
      html,
      text,
    });

    if (error) {
      return {
        ok: false,
        error: `Gagal mengirim email verifikasi via Resend: ${error.message}`,
      };
    }

    return { ok: true, messageId: data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Kesalahan jaringan Resend';
    return {
      ok: false,
      error: `Gagal mengirim email verifikasi: ${msg}`,
    };
  }
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const resend = getResendClient();
  const safeName = escapeHtml(params.name || 'Teman RuangFoto');
  const safeUrl = escapeHtml(params.resetUrl);

  if (!resend) {
    console.warn(
      '[RuangFoto Resend] RESEND_API_KEY belum diatur. Tautan reset sandi:',
      params.resetUrl
    );
    return {
      ok: false,
      error:
        'Layanan email belum aktif (RESEND_API_KEY belum diisi di .env.local).',
    };
  }

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Atur Ulang Kata Sandi RuangFoto</title>
</head>
<body style="margin:0;padding:24px;background-color:#FFF8EC;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1A1A1A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background-color:#FFFFFF;border:3px solid #1A1A1A;border-radius:16px;">
    <tr>
      <td style="padding:28px 24px;background-color:#36CFC0;border-bottom:3px solid #1A1A1A;border-radius:13px 13px 0 0;">
        <span style="display:inline-block;padding:6px 12px;background-color:#FFE066;color:#1A1A1A;border:2px solid #1A1A1A;border-radius:8px;font-weight:800;font-size:14px;">RuangFoto</span>
        <h1 style="margin:14px 0 0;font-size:24px;line-height:1.25;font-weight:800;color:#1A1A1A;">
          Atur Ulang Kata Sandi
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 24px;">
        <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">
          Halo <strong>${safeName}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4A453E;">
          Kami menerima permintaan untuk mengatur ulang kata sandi akun RuangFoto kamu. Klik tombol di bawah ini untuk membuat kata sandi baru:
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
          <tr>
            <td style="border-radius:12px;background-color:#FF5C5C;border:3px solid #1A1A1A;">
              <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:14px 24px;font-size:16px;font-weight:800;color:#1A1A1A;text-decoration:none;">
                Buat Kata Sandi Baru
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#6E665E;">
          Atau salin dan buka tautan ini di browser kamu:
        </p>
        <p style="margin:0 0 20px;font-size:12px;line-height:1.5;word-break:break-all;color:#1A1A1A;background-color:#FFF8EC;padding:10px 12px;border:2px solid #1A1A1A;border-radius:8px;">
          ${safeUrl}
        </p>
        <p style="margin:0;font-size:13px;line-height:1.5;color:#6E665E;">
          Tautan ini berlaku selama 1 jam. Jika kamu tidak meminta pengaturan ulang kata sandi, abaikan email ini.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = [
    `Halo ${params.name || 'Teman RuangFoto'},`,
    '',
    'Kami menerima permintaan untuk mengatur ulang kata sandi akun RuangFoto kamu.',
    'Buka tautan berikut untuk membuat kata sandi baru:',
    params.resetUrl,
    '',
    'Tautan ini berlaku selama 1 jam.',
  ].join('\n');

  try {
    const { data, error } = await resend.emails.send({
      from: resendFromEmail,
      to: [params.to.trim().toLowerCase()],
      subject: 'Atur Ulang Kata Sandi RuangFoto',
      html,
      text,
    });

    if (error) {
      return {
        ok: false,
        error: `Gagal mengirim email reset kata sandi via Resend: ${error.message}`,
      };
    }

    return { ok: true, messageId: data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Kesalahan jaringan Resend';
    return {
      ok: false,
      error: `Gagal mengirim email reset kata sandi: ${msg}`,
    };
  }
}
