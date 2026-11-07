import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'mono_admin';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function adminPassword() {
  return process.env.ADMIN_PASSWORD || 'mono2026';
}

function secret() {
  return process.env.ADMIN_SECRET || `cafe-mono-dev-secret::${adminPassword()}`;
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function checkPassword(input: string) {
  const expected = adminPassword();
  const a = Buffer.from(String(input ?? ''));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createSessionToken(now = Date.now()) {
  const payload = `admin.${now + SESSION_TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null, now = Date.now()) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [role, expRaw, signature] = parts;
  const payload = `${role}.${expRaw}`;
  const expected = sign(payload);
  if (signature.length !== expected.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  } catch {
    return false;
  }
  const exp = Number(expRaw);
  return role === 'admin' && Number.isFinite(exp) && exp > now;
}

export async function isAdmin() {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_TTL_MS / 1000,
};
