/**
 * Единая точка доступа к заказам для клиентских компонентов.
 *
 * Обычная версия сайта (VPS, Docker, локально) ходит в /api/*.
 * Статическая версия на GitHub Pages работает в демо-режиме: те же операции,
 * но данные хранятся в localStorage браузера (см. lib/demo.ts).
 */

import { STATIC_SITE } from './asset';
import * as demo from './demo';
import type { Order, OrderStatus, OrderType, PaymentMethod, Settings } from './types';

export type PublicSettings = {
  acceptingOrders: boolean;
  openHour: number;
  closeHour: number;
  prepPickup: number;
  prepDelivery: number;
  deliveryFee: number;
  freeDeliveryFrom: number;
  minOrder: number;
  stopList: string[];
};

export type OpenInfo = { isOpen: boolean; label: string; hint: string };

export type OrderPayload = {
  type: OrderType;
  customer: { name: string; phone: string; address?: string; comment?: string };
  items: { id: string; qty: number }[];
  payment: PaymentMethod;
};

export type CreatedOrder = { number: string; total: number; etaAt?: number; preorder: boolean };

export type CreateOrderResult =
  | { ok: true; order: CreatedOrder }
  | { ok: false; error: string };

export async function createOrder(payload: OrderPayload): Promise<CreateOrderResult> {
  if (STATIC_SITE) {
    const result = demo.createOrder(payload);
    if (!result.ok) return { ok: false, error: result.error };
    return {
      ok: true,
      order: {
        number: result.order.number,
        total: result.order.total,
        etaAt: result.order.etaAt,
        preorder: Boolean(result.order.preorder),
      },
    };
  }

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data?.error || 'Не удалось оформить заказ' };
    return { ok: true, order: data.order as CreatedOrder };
  } catch {
    return { ok: false, error: 'Сеть недоступна. Позвоните нам — примем заказ по телефону.' };
  }
}

export async function fetchPublicState(): Promise<{ settings: PublicSettings; open: OpenInfo } | null> {
  if (STATIC_SITE) {
    const state = demo.publicState();
    return state as { settings: PublicSettings; open: OpenInfo };
  }
  try {
    const response = await fetch('/api/state', { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as { settings: PublicSettings; open: OpenInfo };
  } catch {
    return null;
  }
}

export type AdminOrdersResult =
  | { ok: true; orders: Order[]; settings: Settings }
  | { ok: false; unauthorized?: boolean; error?: string };

export async function fetchAdminOrders(): Promise<AdminOrdersResult> {
  if (STATIC_SITE) {
    if (!demo.isAuthed()) return { ok: false, unauthorized: true };
    return { ok: true, orders: demo.listOrders(), settings: demo.settings() };
  }
  try {
    const response = await fetch('/api/orders', { cache: 'no-store' });
    if (response.status === 401) return { ok: false, unauthorized: true };
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data?.error || 'Ошибка загрузки' };
    return { ok: true, orders: (data.orders ?? []) as Order[], settings: data.settings as Settings };
  } catch {
    return { ok: false, error: 'Сеть недоступна' };
  }
}

export async function patchOrder(
  id: string,
  body: { status?: OrderStatus; etaDeltaMinutes?: number },
): Promise<boolean> {
  if (STATIC_SITE) return demo.patchOrder(id, body);
  try {
    const response = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function setStopItem(id: string, stopped: boolean): Promise<boolean> {
  if (STATIC_SITE) {
    demo.setStopList(id, stopped);
    return true;
  }
  try {
    const response = await fetch('/api/admin/stoplist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, stopped }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export type SaveSettingsResult =
  | { ok: true; settings: Settings }
  | { ok: false; error: string };

export async function persistSettings(patch: Partial<Settings>): Promise<SaveSettingsResult> {
  if (STATIC_SITE) return { ok: true, settings: demo.saveSettings(patch) };
  try {
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data?.error || 'Не удалось сохранить настройки' };
    return { ok: true, settings: data.settings as Settings };
  } catch {
    return { ok: false, error: 'Сеть недоступна' };
  }
}

export async function makeDemoOrder(): Promise<boolean> {
  if (STATIC_SITE) return demo.randomOrder() !== null;
  try {
    const response = await fetch('/api/admin/demo', { method: 'POST' });
    return response.ok;
  } catch {
    return false;
  }
}

export async function login(password: string): Promise<{ ok: boolean; error?: string }> {
  if (STATIC_SITE) {
    if (password.trim() !== demo.DEMO_PASSWORD) return { ok: false, error: 'Неверный пароль' };
    demo.setAuthed(true);
    return { ok: true };
  }
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data?.error || 'Не удалось войти' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Сеть недоступна, попробуйте ещё раз' };
  }
}

export async function logout(): Promise<void> {
  if (STATIC_SITE) {
    demo.setAuthed(false);
    return;
  }
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
  } catch {
    /* ignore */
  }
}

export const IS_DEMO = STATIC_SITE;
