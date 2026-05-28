import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';

export function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TTL });
}

export function signRefreshToken(payload) {
  const expiresIn = `${env.REFRESH_TTL_DAYS}d`;
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
