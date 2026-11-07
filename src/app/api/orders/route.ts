import { NextResponse } from 'next/server';
import { createOrder, type IncomingOrder } from '@/lib/orders';
import { listOrders, getSettings } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: Partial<IncomingOrder>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const order: IncomingOrder = {
    type: body.type === 'pickup' ? 'pickup' : 'delivery',
    customer: {
      name: String(body.customer?.name ?? ''),
      phone: String(body.customer?.phone ?? ''),
      address: String(body.customer?.address ?? ''),
      comment: String(body.customer?.comment ?? ''),
    },
    items: Array.isArray(body.items)
      ? body.items.map((item) => ({ id: String(item?.id ?? ''), qty: Number(item?.qty ?? 1) }))
      : [],
    payment: body.payment === 'card' || body.payment === 'online' ? body.payment : 'cash',
  };

  try {
    const result = await createOrder(order);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(
      {
        order: {
          number: result.order.number,
          total: result.order.total,
          etaAt: result.order.etaAt,
          preorder: Boolean(result.order.preorder),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('order create failed', error);
    return NextResponse.json(
      { error: 'Не удалось оформить заказ. Позвоните нам — примем по телефону.' },
      { status: 500 },
    );
  }
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  const [orders, settings] = await Promise.all([listOrders(), getSettings()]);
  return NextResponse.json(
    { orders, settings, now: Date.now() },
    { headers: { 'cache-control': 'no-store' } },
  );
}
