import { NextResponse } from 'next/server';
import { findOrderByNumber } from '@/lib/db';
import { publicOrder } from '@/lib/orders';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, ctx: { params: Promise<{ number: string }> }) {
  const { number } = await ctx.params;
  const order = await findOrderByNumber(decodeURIComponent(number));
  if (!order) {
    return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
  }
  return NextResponse.json(
    { order: publicOrder(order), now: Date.now() },
    { headers: { 'cache-control': 'no-store' } },
  );
}
