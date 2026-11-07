import { randomUUID } from 'node:crypto';
import { LUNCH_BY_ID, MENU_BY_ID } from './menu';
import { withDb, readDb } from './db';
import { getOpenState, nextOpeningTs } from './hours';
import type { Order, OrderStatus, OrderType, PaymentMethod } from './types';
import { isValidPhone } from './format';

export type IncomingOrder = {
  type: OrderType;
  customer: { name: string; phone: string; address?: string; comment?: string };
  items: { id: string; qty: number }[];
  payment: PaymentMethod;
};

export type CreateOrderResult =
  | { ok: true; order: Order }
  | { ok: false; status: number; error: string };

function resolveItem(id: string) {
  const menuItem = MENU_BY_ID[id];
  if (menuItem) return { id: menuItem.id, name: menuItem.name, price: menuItem.price };
  const lunch = LUNCH_BY_ID[id];
  if (lunch) return { id: lunch.id, name: `Обед «${lunch.title}»`, price: lunch.price };
  return null;
}

export async function createOrder(input: IncomingOrder): Promise<CreateOrderResult> {
  const settings = await readDb((db) => ({ ...db.settings }));

  if (!settings.acceptingOrders) {
    return {
      ok: false,
      status: 409,
      error: 'Приём заказов временно приостановлен. Позвоните нам — примем заказ по телефону.',
    };
  }

  const name = (input.customer?.name ?? '').trim();
  const phone = (input.customer?.phone ?? '').trim();
  const address = (input.customer?.address ?? '').trim();
  const comment = (input.customer?.comment ?? '').trim().slice(0, 400);
  const type: OrderType = input.type === 'pickup' ? 'pickup' : 'delivery';

  if (name.length < 2) return { ok: false, status: 400, error: 'Укажите, как к вам обращаться' };
  if (!isValidPhone(phone)) return { ok: false, status: 400, error: 'Проверьте номер телефона' };
  if (type === 'delivery' && address.length < 5) {
    return { ok: false, status: 400, error: 'Укажите адрес доставки: улица, дом, квартира' };
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, status: 400, error: 'Корзина пуста' };
  }

  const items: { id: string; name: string; price: number; qty: number }[] = [];
  for (const raw of input.items.slice(0, 60)) {
    const resolved = resolveItem(String(raw.id));
    const qty = Math.max(1, Math.min(30, Math.floor(Number(raw.qty) || 1)));
    if (!resolved) continue;
    if (settings.stopList.includes(resolved.id)) {
      return {
        ok: false,
        status: 409,
        error: `Блюдо «${resolved.name}» временно недоступно. Уберите его из заказа.`,
      };
    }
    items.push({ ...resolved, qty });
  }

  if (items.length === 0) return { ok: false, status: 400, error: 'Не удалось распознать блюда в заказе' };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (type === 'delivery' && subtotal < settings.minOrder) {
    return {
      ok: false,
      status: 400,
      error: `Минимальная сумма доставки — ${settings.minOrder} ₽. Добавьте что-нибудь ещё или выберите самовывоз.`,
    };
  }

  const deliveryFee =
    type === 'delivery' && subtotal < settings.freeDeliveryFrom ? settings.deliveryFee : 0;
  const total = subtotal + deliveryFee;
  const prepMinutes = type === 'delivery' ? settings.prepDelivery : settings.prepPickup;

  const now = Date.now();
  const openState = getOpenState(settings.openHour, settings.closeHour, new Date(now), true);
  const preorder = !openState.isOpen;
  const etaBase = preorder ? nextOpeningTs(settings.openHour, new Date(now)).getTime() : now;
  const etaAt = etaBase + prepMinutes * 60 * 1000;

  const order = await withDb((db) => {
    db.seq += 1;
    const created: Order = {
      id: randomUUID(),
      number: `M-${db.seq}`,
      createdAt: now,
      updatedAt: now,
      status: 'new',
      type,
      customer: { name, phone, address: type === 'delivery' ? address : undefined, comment: comment || undefined },
      items,
      subtotal,
      deliveryFee,
      total,
      payment: input.payment === 'card' || input.payment === 'online' ? input.payment : 'cash',
      prepMinutes,
      etaAt,
      preorder,
      statusLog: [{ at: now, status: 'new' }],
    };
    db.orders.push(created);
    return created;
  });

  return { ok: true, order };
}

const ALLOWED: OrderStatus[] = ['new', 'accepted', 'cooking', 'ready', 'delivering', 'done', 'cancelled'];

export async function setOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  if (!ALLOWED.includes(status)) return null;
  return withDb((db) => {
    const order = db.orders.find((item) => item.id === id);
    if (!order) return null;
    if (order.status === status) return { ...order };
    const now = Date.now();
    order.status = status;
    order.updatedAt = now;
    order.statusLog.push({ at: now, status });
    if (status === 'accepted' && !order.acceptedAt) order.acceptedAt = now;
    if (status === 'done' || status === 'cancelled') order.completedAt = now;
    if (status === 'new') {
      order.acceptedAt = undefined;
      order.completedAt = undefined;
      order.etaAt = now + order.prepMinutes * 60 * 1000;
    }
    return { ...order };
  });
}

export async function adjustEta(id: string, deltaMinutes: number): Promise<Order | null> {
  return withDb((db) => {
    const order = db.orders.find((item) => item.id === id);
    if (!order) return null;
    const base = order.etaAt ?? Date.now();
    const next = base + deltaMinutes * 60 * 1000;
    if (next < Date.now()) return { ...order };
    order.etaAt = next;
    order.prepMinutes = Math.max(1, order.prepMinutes + deltaMinutes);
    order.updatedAt = Date.now();
    return { ...order };
  });
}

export function publicOrder(order: Order) {
  return {
    number: order.number,
    createdAt: order.createdAt,
    status: order.status,
    type: order.type,
    items: order.items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    etaAt: order.etaAt,
    preorder: Boolean(order.preorder),
    name: order.customer.name,
    address: order.customer.address,
  };
}
