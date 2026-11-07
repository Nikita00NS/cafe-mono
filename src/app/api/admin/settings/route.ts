import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { getSettings, saveSettings } from '@/lib/db';
import type { Settings } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.round(num)));
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });

  const current = await getSettings();
  let body: Partial<Settings>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const patch: Partial<Settings> = {
    acceptingOrders:
      typeof body.acceptingOrders === 'boolean' ? body.acceptingOrders : current.acceptingOrders,
    openHour: clamp(body.openHour ?? current.openHour, 0, 23, current.openHour),
    closeHour: clamp(body.closeHour ?? current.closeHour, 1, 24, current.closeHour),
    prepPickup: clamp(body.prepPickup ?? current.prepPickup, 5, 180, current.prepPickup),
    prepDelivery: clamp(body.prepDelivery ?? current.prepDelivery, 5, 240, current.prepDelivery),
    deliveryFee: clamp(body.deliveryFee ?? current.deliveryFee, 0, 2000, current.deliveryFee),
    freeDeliveryFrom: clamp(
      body.freeDeliveryFrom ?? current.freeDeliveryFrom,
      0,
      20000,
      current.freeDeliveryFrom,
    ),
    minOrder: clamp(body.minOrder ?? current.minOrder, 0, 10000, current.minOrder),
  };

  if (patch.closeHour !== undefined && patch.openHour !== undefined && patch.closeHour <= patch.openHour) {
    return NextResponse.json({ error: 'Время закрытия должно быть позже открытия' }, { status: 400 });
  }

  const settings = await saveSettings(patch);
  return NextResponse.json({ settings });
}
