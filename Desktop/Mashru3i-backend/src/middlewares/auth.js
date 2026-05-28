import { verifyAccessToken } from '../utils/jwt.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ ok: false, error: 'Missing token' });

  try {
    const payload = verifyAccessToken(token);
    req.user = payload; // { sub, role_key, ... }
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Invalid or expired token' });
  }
}

export function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user?.role_key) return res.status(403).json({ ok: false, error: 'Forbidden' });
    if (!allowed.includes(req.user.role_key)) {
      return res.status(403).json({ ok: false, error: 'Insufficient role' });
    }
    next();
  };
}
