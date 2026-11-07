/**
 * Демонстрационное «хранилище» заказов в браузере (localStorage).
 *
 * Зачем: GitHub Pages умеет отдавать только статические файлы — там нет сервера,
 * базы и авторизации. Чтобы показать владельцу кафе полноценную панель заказов
 * прямо на демо-сайте, этот модуль повторяет поведение серверного API, но хранит
 * данные в браузере посетителя.
 *
 * В обычной (серверной) версии модуль не используется: там работает /api/*.
 * Ограничение демо-режима: заказы видны только в том браузере, где их оформили,
 * и не переживают очистку данных сайта.
 */

import { LUNCH_BY_ID, MENU, MENU_BY_ID } from './menu';
import { isValidPhone } from './format';
import { getOpenState, nextOpeningTs } from './hours';
import {
  DEFAULT_SETTINGS,
  type Order,
  type OrderItem,
  type OrderStatus,
  type OrderType,
  type PaymentMethod,
  type Settings,
} from './types';

const DB_KEY = 'mono-demo-db-v1';
const AUTH_KEY = 'mono-demo-auth-v1';
const CHANGE_EVENT = 'mono-demo-change';

export const DEMO_PASSWORD = 'mono2026';

type DemoDb = { orders: Order[]; settings: Settings; seq: number };

const isBrowser = () => typeof window !== 'undefined';

function uid() {
  return `demo-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function emptyDb(): DemoDb {
  return { orders: [], settings: { ...DEFAULT_SETTINGS }, seq: 1000 };
}

function resolveItem(id: string): { id: string; name: string; price: number } | null {
  const menuItem = MENU_BY_ID[id];
  if (menuItem) return { id: menuItem.id, name: menuItem.name, price: menuItem.price };
  const lunch = LUNCH_BY_ID[id];
  if (lunch) return { id: lunch.id, name: `Обед «${lunch.title}»`, price: lunch.price };
  return null;
}

/* ── Демонстрационные заказы ─────────────────────────────────────────────── */

type SeedSpec = {
  number: number;
  minutesAgo: number;
  status: OrderStatus;
  type: OrderType;
  name: string;
  phone: string;
  address?: string;
  payment: PaymentMethod;
  items: { id: string; qty: number }[];
};

const SEED: SeedSpec[] = [
  {
    number: 1001,
    minutesAgo: 4,
    status: 'new',
    type: 'delivery',
    name: 'Анна',
    phone: '+7 (959) 279-98-99',
    address: 'ул. Ленина, 24, кв. 7',
    payment: 'online',
    items: [{ id: 'jp-spicy-tuna', qty: 1 }, { id: 'cf-cappuccino', qty: 2 }],
  },
  {
    number: 1000,
    minutesAgo: 16,
    status: 'cooking',
    type: 'pickup',
    name: 'Дмитрий',
    phone: '+7 (959) 560-29-69',
    payment: 'card',
    items: [{ id: 'lunch-3', qty: 1 }, { id: 'eu-caesar', qty: 1 }],
  },
  {
    number: 999,
    minutesAgo: 33,
    status: 'delivering',
    type: 'delivery',
    name: 'Марина',
    phone: '+7 (928) 114-55-02',
    address: 'ул. Мира, 5, кв. 42',
    payment: 'cash',
    items: [{ id: 'it-margherita', qty: 1 }, { id: 'it-carbonara', qty: 1 }],
  },
  {
    number: 998,
    minutesAgo: 95,
    status: 'done',
    type: 'delivery',
    name: 'Игорь',
    phone: '+7 (903) 771-20-18',
    address: 'пер. Школьный, 3',
    payment: 'card',
    items: [{ id: 'jp-philadelphia', qty: 2 }],
  },
  {
    number: 997,
    minutesAgo: 140,
    status: 'done',
    type: 'pickup',
    name: 'Ольга',
    phone: '+7 (961) 300-77-45',
    payment: 'cash',
    items: [{ id: 'bf-english', qty: 1 }, { id: 'cf-latte', qty: 1 }],
  },
];

function buildOrder(spec: SeedSpec, settings: Settings, now: number): Order {
  const createdAt = now - spec.minutesAgo * 60_000;
  const items: OrderItem[] = [];
  for (const raw of spec.items) {
    const resolved = resolveItem(raw.id);
    if (resolved) items.push({ ...resolved, qty: raw.qty });
  }
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee =
    spec.type === 'delivery' && subtotal < settings.freeDeliveryFrom ? settings.deliveryFee : 0;
  const prepMinutes = spec.type === 'delivery' ? settings.prepDelivery : settings.prepPickup;
  const etaAt = createdAt + prepMinutes * 60_000;
  const finished = spec.status === 'done' || spec.status === 'cancelled';

  const statusLog: { at: number; status: OrderStatus }[] = [{ at: createdAt, status: 'new' }];
  if (spec.status !== 'new') {
    statusLog.push({ at: createdAt + 90_000, status: spec.status });
  }

  return {
    id: uid(),
    number: `M-${spec.number}`,
    createdAt,
    updatedAt: createdAt + 90_000,
    status: spec.status,
    type: spec.type,
    customer: { name: spec.name, phone: spec.phone, address: spec.type === 'delivery' ? spec.address : undefined },
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    payment: spec.payment,
    prepMinutes,
    etaAt,
    preorder: false,
    completedAt: finished ? createdAt + prepMinutes * 60_000 : undefined,
    statusLog,
  };
}

function seedDb(): DemoDb {
  const settings = { ...DEFAULT_SETTINGS };
  const now = Date.now();
  const orders = SEED.map((spec) => buildOrder(spec, settings, now));
  return { orders, settings, seq: 1001 };
}

/* ── Чтение и запись ─────────────────────────────────────────────────────── */

function emit() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribe(listener: () => void): () => void {
  if (!isBrowser()) return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === DB_KEY || event.key === AUTH_KEY) listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function readDb(): DemoDb {
  if (!isBrowser()) return seedDb();
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) {
      const seeded = seedDb();
      window.localStorage.setItem(DB_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Partial<DemoDb>;
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      seq: typeof parsed.seq === 'number' ? parsed.seq : 1000,
    };
  } catch {
    return emptyDb();
  }
}

function saveDb(db: DemoDb) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* приватный режим — данные не сохранятся, но интерфейс продолжит работать */
  }
  emit();
}

/* ── Авторизация (только для демо) ───────────────────────────────────────── */

export function isAuthed(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem(AUTH_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAuthed(value: boolean) {
  if (!isBrowser()) return;
  try {
    if (value) window.localStorage.setItem(AUTH_KEY, '1');
    else window.localStorage.removeItem(AUTH_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

/* ── Публичное состояние кафе ────────────────────────────────────────────── */

export function publicState() {
  const db = readDb();
  const open = getOpenState(
    db.settings.openHour,
    db.settings.closeHour,
    new Date(),
    db.settings.acceptingOrders,
  );
  return {
    settings: {
      acceptingOrders: db.settings.acceptingOrders,
      openHour: db.settings.openHour,
      closeHour: db.settings.closeHour,
      prepPickup: db.settings.prepPickup,
      prepDelivery: db.settings.prepDelivery,
      deliveryFee: db.settings.deliveryFee,
      freeDeliveryFrom: db.settings.freeDeliveryFrom,
      minOrder: db.settings.minOrder,
      stopList: db.settings.stopList,
    },
    open,
  };
}

/* ── Заказы ──────────────────────────────────────────────────────────────── */

export function listOrders(): Order[] {
  return [...readDb().orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 300);
}

export function settings(): Settings {
  return { ...readDb().settings };
}

export type IncomingOrder = {
  type: OrderType;
  customer: { name: string; phone: string; address?: string; comment?: string };
  items: { id: string; qty: number }[];
  payment: PaymentMethod;
};

export type CreateResult =
  | { ok: true; order: Order }
  | { ok: false; error: string };

export function createOrder(input: IncomingOrder): CreateResult {
  const db = readDb();
  const config = db.settings;

  if (!config.acceptingOrders) {
    return {
      ok: false,
      error: 'Приём заказов временно приостановлен. Позвоните нам — примем заказ по телефону.',
    };
  }

  const name = (input.customer?.name ?? '').trim();
  const phone = (input.customer?.phone ?? '').trim();
  const address = (input.customer?.address ?? '').trim();
  const comment = (input.customer?.comment ?? '').trim().slice(0, 400);
  const type: OrderType = input.type === 'pickup' ? 'pickup' : 'delivery';

  if (name.length < 2) return { ok: false, error: 'Укажите, как к вам обращаться' };
  if (!isValidPhone(phone)) return { ok: false, error: 'Проверьте номер телефона' };
  if (type === 'delivery' && address.length < 5) {
    return { ok: false, error: 'Укажите адрес доставки: улица, дом, квартира' };
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, error: 'Корзина пуста' };
  }

  const items: OrderItem[] = [];
  for (const raw of input.items.slice(0, 60)) {
    const resolved = resolveItem(String(raw.id));
    const qty = Math.max(1, Math.min(30, Math.floor(Number(raw.qty) || 1)));
    if (!resolved) continue;
    if (config.stopList.includes(resolved.id)) {
      return { ok: false, error: `Блюдо «${resolved.name}» временно недоступно. Уберите его из заказа.` };
    }
    items.push({ ...resolved, qty });
  }
  if (items.length === 0) return { ok: false, error: 'Не удалось распознать блюда в заказе' };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (type === 'delivery' && subtotal < config.minOrder) {
    return {
      ok: false,
      error: `Минимальная сумма доставки — ${config.minOrder} ₽. Добавьте что-нибудь ещё или выберите самовывоз.`,
    };
  }

  const deliveryFee =
    type === 'delivery' && subtotal < config.freeDeliveryFrom ? config.deliveryFee : 0;
  const prepMinutes = type === 'delivery' ? config.prepDelivery : config.prepPickup;
  const now = Date.now();
  const openState = getOpenState(config.openHour, config.closeHour, new Date(now), true);
  const preorder = !openState.isOpen;
  const etaBase = preorder ? nextOpeningTs(config.openHour, new Date(now)).getTime() : now;

  const order: Order = {
    id: uid(),
    number: `M-${db.seq + 1}`,
    createdAt: now,
    updatedAt: now,
    status: 'new',
    type,
    customer: {
      name,
      phone,
      address: type === 'delivery' ? address : undefined,
      comment: comment || undefined,
    },
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    payment: input.payment === 'card' || input.payment === 'online' ? input.payment : 'cash',
    prepMinutes,
    etaAt: etaBase + prepMinutes * 60_000,
    preorder,
    statusLog: [{ at: now, status: 'new' }],
  };

  db.seq += 1;
  db.orders.push(order);
  saveDb(db);
  return { ok: true, order };
}

export function setStatus(id: string, status: OrderStatus): Order | null {
  const allowed: OrderStatus[] = ['new', 'accepted', 'cooking', 'ready', 'delivering', 'done', 'cancelled'];
  if (!allowed.includes(status)) return null;
  const db = readDb();
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
    order.etaAt = now + order.prepMinutes * 60_000;
  }
  saveDb(db);
  return { ...order };
}

export function adjustEta(id: string, deltaMinutes: number): Order | null {
  const db = readDb();
  const order = db.orders.find((item) => item.id === id);
  if (!order) return null;
  const base = order.etaAt ?? Date.now();
  const next = base + deltaMinutes * 60_000;
  if (next < Date.now()) return { ...order };
  order.etaAt = next;
  order.prepMinutes = Math.max(1, order.prepMinutes + deltaMinutes);
  order.updatedAt = Date.now();
  saveDb(db);
  return { ...order };
}

export function patchOrder(id: string, body: { status?: OrderStatus; etaDeltaMinutes?: number }): boolean {
  let ok = false;
  if (body.status) ok = setStatus(id, body.status) !== null || ok;
  if (typeof body.etaDeltaMinutes === 'number') {
    ok = adjustEta(id, body.etaDeltaMinutes) !== null || ok;
  }
  return ok;
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const db = readDb();
  db.settings = { ...db.settings, ...patch };
  saveDb(db);
  return { ...db.settings };
}

export function setStopList(id: string, stopped: boolean): Settings {
  const db = readDb();
  const list = new Set(db.settings.stopList);
  if (stopped) list.add(id);
  else list.delete(id);
  db.settings = { ...db.settings, stopList: [...list] };
  saveDb(db);
  return { ...db.settings };
}

/** Кнопка «+ Демо-заказ» в панели: случайный заказ, чтобы показать доску в действии. */
export function randomOrder(): Order | null {
  const names = ['Алексей', 'Ксения', 'Павел', 'Юлия', 'Сергей', 'Екатерина'];
  const addresses = ['ул. Ленина, 12, кв. 3', 'ул. Мира, 8, кв. 21', 'пер. Садовый, 4', 'ул. Гагарина, 17, кв. 55'];
  const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

  const pool = MENU.filter((item) => item.price >= 180);
  const chosen: { id: string; qty: number }[] = [];
  const count = 2 + Math.floor(Math.random() * 2);
  for (let index = 0; index < count; index += 1) {
    const item = pick(pool);
    if (!chosen.some((entry) => entry.id === item.id)) {
      chosen.push({ id: item.id, qty: 1 + (Math.random() > 0.7 ? 1 : 0) });
    }
  }

  const type: OrderType = Math.random() > 0.4 ? 'delivery' : 'pickup';
  const result = createOrder({
    type,
    customer: {
      name: pick(names),
      phone: `+7 (9${Math.floor(10 + Math.random() * 89)}) ${Math.floor(100 + Math.random() * 899)}-${Math.floor(10 + Math.random() * 89)}-${Math.floor(10 + Math.random() * 89)}`,
      address: type === 'delivery' ? pick(addresses) : '',
      comment: '',
    },
    items: chosen,
    payment: pick<PaymentMethod>(['cash', 'card', 'online']),
  });

  return result.ok ? result.order : null;
}

/** Публичная карточка заказа — та же, что отдаёт /api/track/[number]. */
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

export function findOrderByNumber(number: string): Order | null {
  const target = number.trim().toLowerCase();
  return readDb().orders.find((order) => order.number.toLowerCase() === target) ?? null;
}

/** Сброс демо-данных к исходному состоянию (для показа владельцу «с нуля»). */
export function resetDemo() {
  if (!isBrowser()) return;
  saveDb(seedDb());
}
