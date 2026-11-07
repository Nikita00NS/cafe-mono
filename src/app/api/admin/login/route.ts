import { NextResponse } from 'next/server';
import { checkPassword, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const attempts = new Map<string, { count: number; until: number }>();

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local';

  const now = Date.now();
  const record = attempts.get(ip);
  if (record && record.count >= 8 && now < record.until) {
    const seconds = Math.ceil((record.until - now) / 1000);
    return NextResponse.json(
      { error: `Слишком много попыток. Попробуйте через ${seconds} с.` },
      { status: 429 },
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  if (!checkPassword(String(body.password ?? ''))) {
    const next = { count: (record?.count ?? 0) + 1, until: now + 5 * 60 * 1000 };
    attempts.set(ip, next);
    return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
  }

  attempts.delete(ip);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions);
  return response;
}
