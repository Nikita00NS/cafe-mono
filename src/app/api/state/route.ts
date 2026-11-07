import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';
import { getOpenState } from '@/lib/hours';
import { PUBLIC_SETTING_KEYS } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const settings = await getSettings();
  const open = getOpenState(settings.openHour, settings.closeHour, new Date(), settings.acceptingOrders);
  const publicSettings: Record<string, unknown> = {};
  for (const key of PUBLIC_SETTING_KEYS) publicSettings[key] = settings[key];

  return NextResponse.json(
    { settings: publicSettings, open },
    { headers: { 'cache-control': 'no-store' } },
  );
}
