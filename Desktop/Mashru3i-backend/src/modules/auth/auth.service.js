import { query } from '../../lib/db.js';
import {
  hashPassword,
  verifyPassword,
  sha256,
  randomTokenHex,
} from '../../utils/crypto.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.js';
import { env } from '../../lib/env.js';
import { sendMail } from '../../lib/mailer.js'; // ✅ ESM import
// ... (rest of the file unchanged from your latest working version)


export const REQUIRE_EMAIL_VERIFIED =
  String(process.env.REQUIRE_EMAIL_VERIFIED_BEFORE_LOGIN || 'false')
    .toLowerCase() === 'true';

/* ======================= Roles ======================= */

async function getRoleIdByKey(role_key) {
  if (!role_key) return null;
  const { rows } = await query(
    'SELECT id, key FROM public.roles WHERE key = $1 LIMIT 1',
    [role_key]
  );
  return rows[0]?.id || null;
}

/* ======================= Core Auth ======================= */

export async function registerUser({
  full_name,
  email,
  phone_e164,
  password,
  role_key,
}) {
  const password_hash = await hashPassword(password);
  const role_id = await getRoleIdByKey(role_key || 'customer');

  const text = `
    INSERT INTO public.users (email, phone_e164, password_hash, full_name, role_id)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING id, email, phone_e164, full_name, is_active, role_id
  `;
  const { rows } = await query(text, [
    email?.toLowerCase() || null,
    phone_e164 || null,
    password_hash,
    full_name || null,
    role_id,
  ]);
  return rows[0];
}

export async function loginWithEmailPassword({ email, password }, ctx = {}) {
  const user = await getUserByEmail(email);
  if (!user) return { error: 'Invalid credentials' };
  if (!user.is_active) return { error: 'Account disabled' };

  const ok = await verifyPassword(user.password_hash, password);
  if (!ok) return { error: 'Invalid credentials' };

  if (REQUIRE_EMAIL_VERIFIED && !user.email_verified_at) {
    return { error: 'Email not verified' };
  }

  const tokens = await issueTokens(user, ctx);
  return { user: sanitizeUser(user), ...tokens };
}

export async function refreshSession(refresh_token, ctx = {}) {
  if (!refresh_token) return { error: 'Missing refresh token' };

  let payload;
  try {
    payload = verifyRefreshToken(refresh_token);
  } catch {
    return { error: 'Invalid refresh token' };
  }

  const { sub: user_id } = payload;
  const valid = await isStoredRefreshValid(user_id, refresh_token);
  if (!valid) return { error: 'Refresh token revoked/expired' };

  // Rotate: revoke old, issue new
  await revokeRefreshToken(refresh_token);

  const { rows } = await query(
    `SELECT u.id, u.email, u.phone_e164, u.full_name, u.is_active, u.role_id, r.key as role_key, u.email_verified_at
       FROM public.users u
       LEFT JOIN public.roles r ON r.id = u.role_id
      WHERE u.id = $1 LIMIT 1`,
    [user_id]
  );
  const user = rows[0];
  if (!user || !user.is_active) return { error: 'Account not available' };

  const tokens = await issueTokens(user, ctx);
  return { user: sanitizeUser(user), ...tokens };
}

export async function logout(refresh_token) {
  if (!refresh_token) return;
  await revokeRefreshToken(refresh_token);
}

/* ======================= Token Store ======================= */

async function storeRefreshToken(user_id, refreshToken, userAgent, ip) {
  const token_hash = sha256(refreshToken);
  const expires_at = new Date(
    Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
  );
  await query(
    `INSERT INTO public.auth_refresh_tokens (user_id, token_hash, user_agent, ip, expires_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [user_id, token_hash, userAgent || null, ip || null, expires_at]
  );
}

async function revokeRefreshToken(refreshToken) {
  const token_hash = sha256(refreshToken);
  await query(
    `UPDATE public.auth_refresh_tokens
        SET revoked_at = now()
      WHERE token_hash = $1 AND revoked_at IS NULL`,
    [token_hash]
  );
}

async function isStoredRefreshValid(user_id, refreshToken) {
  const token_hash = sha256(refreshToken);
  const { rows } = await query(
    `SELECT id FROM public.auth_refresh_tokens
      WHERE user_id = $1 AND token_hash = $2
        AND revoked_at IS NULL AND expires_at > now()
      LIMIT 1`,
    [user_id, token_hash]
  );
  return !!rows[0];
}

async function issueTokens(user, ctx = {}) {
  const payload = { sub: user.id, role_key: user.role_key || null };
  const access_token = signAccessToken(payload);
  const refresh_token = signRefreshToken(payload);
  await storeRefreshToken(user.id, refresh_token, ctx.userAgent, ctx.ip);
  return { access_token, refresh_token };
}

/* ======================= Email Verification ======================= */

async function createEmailVerification(user_id) {
  console.log('[SERVICE] createEmailVerification start for:', user_id);

  // Optional tidy: mark expired previous tokens as used
  await query(
    `UPDATE public.auth_email_verifications
        SET used_at = now()
      WHERE user_id = $1 AND used_at IS NULL AND expires_at < now()`,
    [user_id]
  );

  const token = randomTokenHex(32);
  const token_hash = sha256(token);
  const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  await query(
    `INSERT INTO public.auth_email_verifications (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user_id, token_hash, expires_at]
  );

  console.log('[SERVICE] createEmailVerification inserted for:', user_id);
  return token; // raw token (to email)
}

export async function sendVerificationEmail(user) {
  if (!user?.email) return;

  console.log('[SERVICE] sendVerificationEmail for:', user.id, user.email, 'verified_at=', user.email_verified_at);

  const token = await createEmailVerification(user.id);
  const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';
  const frontendLink = `${APP_BASE_URL}/verify-email?token=${token}`;
  const backendLink = `${
    process.env.API_BASE_URL || 'http://localhost:5000'
  }/api/auth/verify-email?token=${token}`;

  const html = `
    <p>Hi ${user.full_name || ''},</p>
    <p>Verify your email by clicking the link below (valid for 24 hours):</p>
    <p><a href="${frontendLink}">Verify Email</a></p>
    <p>Or call API directly: <a href="${backendLink}">${backendLink}</a></p>
  `;
  const text = `Verify your email (24h): ${frontendLink}\nAPI: ${backendLink}`;

  await sendMail({
    to: user.email,
    subject: 'Verify your email',
    html,
    text,
  });

  console.log('[SERVICE] verification email queued for:', user.id);
}

export async function verifyEmailByToken(rawToken) {
  const token_hash = sha256(rawToken);
  const { rows } = await query(
    `SELECT aev.user_id
       FROM public.auth_email_verifications aev
      WHERE aev.token_hash = $1
        AND aev.used_at IS NULL
        AND aev.expires_at > now()
      LIMIT 1`,
    [token_hash]
  );

  const row = rows[0];
  if (!row) return { ok: false, error: 'Invalid or expired token' };

  await query('UPDATE public.users SET email_verified_at = now() WHERE id = $1', [
    row.user_id,
  ]);
  await query(
    'UPDATE public.auth_email_verifications SET used_at = now() WHERE token_hash = $1',
    [token_hash]
  );

  return { ok: true };
}

/* ======================= Password Reset ======================= */

async function createPasswordReset(user_id) {
  // Optional tidy: mark expired previous tokens as used
  await query(
    `UPDATE public.auth_password_resets
        SET used_at = now()
      WHERE user_id = $1 AND used_at IS NULL AND expires_at < now()`,
    [user_id]
  );

  const token = randomTokenHex(32);
  const token_hash = sha256(token);
  const expires_at = new Date(Date.now() + 1000 * 60 * 30); // 30 min

  await query(
    `INSERT INTO public.auth_password_resets (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user_id, token_hash, expires_at]
  );

  return token;
}

export async function sendPasswordResetEmail(user) {
  if (!user?.email) return;

  const token = await createPasswordReset(user.id);
  const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';
  const resetLink = `${APP_BASE_URL}/reset-password?token=${token}`;

  const html = `
    <p>Hello ${user.full_name || ''},</p>
    <p>We received a password reset request. If this was you, click below within 30 minutes:</p>
    <p><a href="${resetLink}">Reset Password</a></p>
    <p>If you didn't request this, ignore this email.</p>
  `;
  const text = `Reset your password (30m): ${resetLink}`;

  await sendMail({
    to: user.email,
    subject: 'Reset your password',
    html,
    text,
  });
}

/* ======================= Helpers ======================= */

export async function getUserByEmail(email) {
  const { rows } = await query(
    `SELECT u.id,
            u.email,
            u.phone_e164,
            u.password_hash,
            u.full_name,
            u.is_active,
            u.email_verified_at,
            u.role_id,
            r.key AS role_key
       FROM public.users u
       LEFT JOIN public.roles r ON r.id = u.role_id
      WHERE u.email = $1
      LIMIT 1`,
    [String(email || '').toLowerCase()]
  );
  return rows[0];
}

function sanitizeUser(u) {
  return {
    id: u.id,
    email: u.email,
    phone_e164: u.phone_e164,
    full_name: u.full_name,
    role_key: u.role_key || null,
  };
}
export async function resetPasswordByToken(rawToken, newHash) {
  const token_hash = sha256(rawToken);

  // Find a valid, unused, unexpired reset token
  const { rows } = await query(
    `SELECT apr.user_id
       FROM public.auth_password_resets apr
      WHERE apr.token_hash = $1
        AND apr.used_at IS NULL
        AND apr.expires_at > now()
      LIMIT 1`,
    [token_hash]
  );

  const row = rows[0];
  if (!row) return { ok: false, error: 'Invalid or expired token' };

  // Update the user's password and mark the token used
  await query('UPDATE public.users SET password_hash = $1 WHERE id = $2', [
    newHash,
    row.user_id,
  ]);
  await query(
    'UPDATE public.auth_password_resets SET used_at = now() WHERE token_hash = $1',
    [token_hash]
  );

  return { ok: true };
}
