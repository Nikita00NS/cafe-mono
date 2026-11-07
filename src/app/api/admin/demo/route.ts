import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { isAdmin } from '@/lib/auth';
import { withDb, getSettings } from '@/lib/db';
import { MENU } from '@/lib/menu';
import type { Order } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NAMES = ['Анна', 'Дмитрий', 'Ольга', 'Сергей', 'Мария', 'Игорь'];
const ADDRESSES = [
  'ул. Ленина, 24, кв. 12',
  'ул. Гагарина, 7, кв. 45',
  'пр-т 60 лет СССР, 3, кв. 101',
  'ул. Первомайская, 15, кв. 8',
];

export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });

  const settings = await getSettings();
  const type = Math.random() > 0.4 ? 'delivery' : 'pickup';
  const picked = [...MENU].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2));
  const items = picked.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    qty: 1 + Math.floor(Math.random() * 2),
  }));
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = type === 'delivery' && subtotal < settings.freeDeliveryFrom ? settings.deliveryFee : 0;
  const now = Date.now();
  const prepMinutes = type === 'delivery' ? settings.prepDelivery : settings.prepPickup;

  const order = await withDb((db) => {
    db.seq += 1;
    const created: Order = {
      id: randomUUID(),
      number: `M-${db.seq}`,
      createdAt: now,
      updatedAt: now,
      status: 'new',
      type,
      customer: {
        name: NAMES[Math.floor(Math.random() * NAMES.length)],
        phone: '+7 (959) 000-00-00',
        address:
          type === 'delivery' ? ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)] : undefined,
        comment: Math.random() > 0.6 ? 'Позвонить за 10 минут до приезда' : undefined,
      },
      items,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      payment: 'cash',
      prepMinutes,
      etaAt: now + prepMinutes * 60 * 1000,
      statusLog: [{ at: now, status: 'new' }],
    };
    db.orders.push(created);
    return created;
  });

  return NextResponse.json({ order });
}
