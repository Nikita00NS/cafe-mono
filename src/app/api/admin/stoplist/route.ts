import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { saveSettings, getSettings } from '@/lib/db';
import { LUNCH_BY_ID, MENU_BY_ID } from '@/lib/menu';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });

  let body: { id?: string; stopped?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const id = String(body.id ?? '');
  if (!MENU_BY_ID[id] && !LUNCH_BY_ID[id]) {
    return NextResponse.json({ error: 'Блюдо не найдено' }, { status: 404 });
  }

  const current = await getSettings();
  const set = new Set(current.stopList);
  const shouldStop = typeof body.stopped === 'boolean' ? body.stopped : !set.has(id);
  if (shouldStop) set.add(id);
  else set.delete(id);

  const settings = await saveSettings({ stopList: Array.from(set) });
  return NextResponse.json({ settings });
}
