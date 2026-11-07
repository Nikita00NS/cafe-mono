import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { adjustEta, setOrderStatus } from '@/lib/orders';
import type { OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STATUSES: OrderStatus[] = [
  'new',
  'accepted',
  'cooking',
  'ready',
  'delivering',
  'done',
  'cancelled',
];

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: { status?: string; etaDeltaMinutes?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  if (typeof body.etaDeltaMinutes === 'number') {
    const updated = await adjustEta(id, Math.max(-60, Math.min(60, body.etaDeltaMinutes)));
    if (!updated) return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    return NextResponse.json({ order: updated });
  }

  if (!body.status || !STATUSES.includes(body.status as OrderStatus)) {
    return NextResponse.json({ error: 'Неизвестный статус' }, { status: 400 });
  }

  const updated = await setOrderStatus(id, body.status as OrderStatus);
  if (!updated) return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
  return NextResponse.json({ order: updated });
}
