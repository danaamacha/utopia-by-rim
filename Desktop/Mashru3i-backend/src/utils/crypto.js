// src/utils/crypto.js
import argon2 from 'argon2';
import crypto from 'crypto';

export async function hashPassword(password) {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(hash, plain) {
  return argon2.verify(hash, plain);
}

export function randomTokenHex(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex'); // raw token to email
}

export function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex'); // store only hash
}
