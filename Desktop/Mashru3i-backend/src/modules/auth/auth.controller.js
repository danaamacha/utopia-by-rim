import {
  registerUser,
  loginWithEmailPassword,
  refreshSession,
  logout,
  sendVerificationEmail,
  verifyEmailByToken,
  getUserByEmail,
  // ✅ for reset
  sendPasswordResetEmail,
  resetPasswordByToken,
} from './auth.service.js';
import { validateRegister, validateLogin } from './auth.validators.js';
import { hashPassword } from '../../utils/crypto.js';

/* ===== Core auth ===== */

export async function postRegister(req, res) {
  const err = validateRegister(req.body);
  if (err) return res.status(400).json({ ok: false, error: err });

  try {
    const user = await registerUser(req.body);
    try { await sendVerificationEmail(user); } catch (_) {}
    return res.status(201).json({ ok: true, user });
  } catch (e) {
    if (e?.code === '23505') {
      return res.status(409).json({ ok: false, error: 'Email or phone already exists' });
    }
    console.error('register error:', e);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}

export async function postLogin(req, res) {
  const err = validateLogin(req.body);
  if (err) return res.status(400).json({ ok: false, error: err });

  const ctx = { userAgent: req.get('user-agent'), ip: req.ip };
  const result = await loginWithEmailPassword(req.body, ctx);
  if (result.error) return res.status(401).json({ ok: false, error: result.error });

  return res.json({
    ok: true,
    user: result.user,
    access_token: result.access_token,
    refresh_token: result.refresh_token,
  });
}

export async function postRefresh(req, res) {
  const { refresh_token } = req.body || {};
  const ctx = { userAgent: req.get('user-agent'), ip: req.ip };
  const result = await refreshSession(refresh_token, ctx);
  if (result.error) return res.status(401).json({ ok: false, error: result.error });

  return res.json({
    ok: true,
    user: result.user,
    access_token: result.access_token,
    refresh_token: result.refresh_token,
  });
}

export async function postLogout(req, res) {
  const { refresh_token } = req.body || {};
  await logout(refresh_token);
  return res.json({ ok: true });
}

export async function getMe(req, res) {
  return res.json({ ok: true, user: req.user });
}

/* ===== Email verification ===== */

export async function postResendVerification(req, res) {
  const email = req.body?.email;
  if (!email) return res.status(400).json({ ok: false, error: 'email is required' });

  try {
    const user = await getUserByEmail(email);
    if (user && !user.email_verified_at) {
      await sendVerificationEmail(user);
    }
    return res.json({
      ok: true,
      message: 'If this email exists and is not verified, a verification email has been sent.',
    });
  } catch (e) {
    console.error('resend-verification error:', e);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}

export async function getVerifyEmail(req, res) {
  const token = req.query?.token;
  if (!token) return res.status(400).json({ ok: false, error: 'token is required' });

  try {
    const result = await verifyEmailByToken(token);
    if (!result?.ok) return res.status(400).json({ ok: false, error: 'Invalid or expired token' });
    return res.json({ ok: true, message: 'Email verified' });
  } catch (e) {
    console.error('verify-email error:', e);
    return res.status(400).json({ ok: false, error: 'Invalid or expired token' });
  }
}

/* ===== Password reset ===== */

// Non-enumerating
export async function postForgotPassword(req, res) {
  const email = req.body?.email;
  if (!email) return res.status(400).json({ ok: false, error: 'email is required' });

  try {
    const user = await getUserByEmail(email);
    if (user) await sendPasswordResetEmail(user);
    return res.json({ ok: true, message: 'If this email exists, a password reset email has been sent.' });
  } catch (e) {
    console.error('forgot-password error:', e);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}

export async function postResetPassword(req, res) {
  const { token, password } = req.body || {};
  if (!token || !password) {
    return res.status(400).json({ ok: false, error: 'token and password are required' });
  }

  try {
    const newHash = await hashPassword(password);
    const result = await resetPasswordByToken(token, newHash);
    if (!result?.ok) return res.status(400).json({ ok: false, error: 'Invalid or expired token' });
    return res.json({ ok: true, message: 'Password has been reset' });
  } catch (e) {
    console.error('reset-password error:', e);
    return res.status(400).json({ ok: false, error: 'Invalid or expired token' });
  }
}
