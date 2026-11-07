'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LUNCHES, MENU } from '@/lib/menu';
import type { Order, OrderStatus, Settings } from '@/lib/types';
import { nextActionLabel, nextStatus, ORDER_TYPE_LABEL } from '@/lib/order-status';
import { formatCountdown, formatPrice, formatTime } from '@/lib/format';
import { getOpenState } from '@/lib/hours';

const COLUMNS: { id: string; title: string; statuses: OrderStatus[]; hot?: boolean }[] = [
  { id: 'new', title: 'Новые', statuses: ['new'], hot: true },
  { id: 'cooking', title: 'Готовятся', statuses: ['accepted', 'cooking'] },
  { id: 'ready', title: 'Готовы / в пути', statuses: ['ready', 'delivering'] },
  { id: 'done', title: 'Завершены', statuses: ['done', 'cancelled'] },
];

function sameMoscowDay(timestamp: number, reference: number) {
  const fmt = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', dateStyle: 'short' });
  return fmt.format(new Date(timestamp)) === fmt.format(new Date(reference));
}

export function AdminApp() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [form, setForm] = useState<Partial<Settings>>({});
  const [dirty, setDirty] = useState(false);
  const knownNew = useRef<Set<string> | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('mono-admin-sound');
    setSoundOn(stored === '1');
  }, []);

  const beep = useCallback(() => {
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = audioCtx.current ?? new Ctor();
      audioCtx.current = ctx;
      if (ctx.state === 'suspended') void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1180, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      /* звук недоступен */
    }
  }, []);

  const load = useCallback(
    async (silent = false) => {
      try {
        const response = await fetch('/api/orders', { cache: 'no-store' });
        if (response.status === 401) {
          router.replace('/admin/login');
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || 'Ошибка загрузки');
        const nextOrders = (data.orders ?? []) as Order[];
        const freshNew = nextOrders.filter((order) => order.status === 'new');

        if (knownNew.current === null) {
          knownNew.current = new Set(freshNew.map((order) => order.id));
        } else {
          const hasNew = freshNew.some((order) => !knownNew.current?.has(order.id));
          if (hasNew && soundOn) beep();
          knownNew.current = new Set(freshNew.map((order) => order.id));
        }

        setOrders(nextOrders);
        setSettings(data.settings as Settings);
        setError(null);
      } catch (err) {
        if (!silent) setError(err instanceof Error ? err.message : 'Не удалось загрузить заказы');
      } finally {
        setLoading(false);
      }
    },
    [beep, router, soundOn],
  );

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(true), 4000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!settings || dirty) return;
    setForm({
      openHour: settings.openHour,
      closeHour: settings.closeHour,
      prepPickup: settings.prepPickup,
      prepDelivery: settings.prepDelivery,
      deliveryFee: settings.deliveryFee,
      freeDeliveryFrom: settings.freeDeliveryFrom,
      minOrder: settings.minOrder,
    });
  }, [settings, dirty]);

  const updateForm = useCallback((patch: Partial<Settings>) => {
    setDirty(true);
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const patchOrder = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === id
            ? {
                ...order,
                ...(typeof body.status === 'string' ? { status: body.status as OrderStatus } : {}),
                ...(typeof body.etaDeltaMinutes === 'number' && order.etaAt
                  ? { etaAt: order.etaAt + body.etaDeltaMinutes * 60000 }
                  : {}),
              }
            : order,
        ),
      );
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data?.error || 'Не удалось обновить заказ');
        void load(true);
      }
    },
    [load],
  );

  const toggleStop = useCallback(async (id: string, stopped: boolean) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            stopList: stopped ? [...prev.stopList, id] : prev.stopList.filter((item) => item !== id),
          }
        : prev,
    );
    const response = await fetch('/api/admin/stoplist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, stopped }),
    });
    if (!response.ok) setError('Не удалось обновить стоп-лист');
  }, []);

  const saveSettings = useCallback(async () => {
    setSavingSettings(true);
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, acceptingOrders: settings?.acceptingOrders }),
    });
    const data = await response.json().catch(() => ({}));
    setSavingSettings(false);
    if (!response.ok) {
      setError(data?.error || 'Не удалось сохранить настройки');
      return;
    }
    setSettings(data.settings as Settings);
    setDirty(false);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }, [form, settings?.acceptingOrders]);

  const toggleAccepting = useCallback(async () => {
    if (!settings) return;
    const next = !settings.acceptingOrders;
    setSettings({ ...settings, acceptingOrders: next });
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ acceptingOrders: next }),
    });
  }, [settings]);

  const createDemo = useCallback(async () => {
    await fetch('/api/admin/demo', { method: 'POST' });
    void load(true);
  }, [load]);

  const logout = useCallback(async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
  }, [router]);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem('mono-admin-sound', next ? '1' : '0');
    if (next) beep();
  }, [beep, soundOn]);

  const todayStats = useMemo(() => {
    const todays = orders.filter((order) => sameMoscowDay(order.createdAt, now));
    const done = todays.filter((order) => order.status === 'done');
    const revenue = done.reduce((sum, order) => sum + order.total, 0);
    return {
      count: todays.length,
      revenue,
      average: done.length ? Math.round(revenue / done.length) : 0,
      active: orders.filter((order) =>
        ['new', 'accepted', 'cooking', 'ready', 'delivering'].includes(order.status),
      ).length,
      fresh: orders.filter((order) => order.status === 'new').length,
    };
  }, [orders, now]);

  const open = settings
    ? getOpenState(settings.openHour, settings.closeHour, new Date(now), settings.acceptingOrders)
    : null;

  return (
    <div className="admin">
      <header className="admin-top">
        <div className="container admin-top__inner">
          <div className="admin-brand">
            <span className="admin-brand__mark">МОНО</span>
            <span className="admin-brand__tag">панель заказов</span>
          </div>
          <div className="admin-top__actions">
            <span className="admin-clock">
              {new Intl.DateTimeFormat('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'Europe/Moscow',
              }).format(new Date(now))}{' '}
              МСК
            </span>
            {open && (
              <span className={`chip ${open.isOpen ? '' : 'chip--pickup'}`}>
                {open.isOpen ? '● открыто' : '○ закрыто'}
              </span>
            )}
            <button type="button" className="btn-admin btn-admin--ghost" onClick={toggleSound}>
              {soundOn ? '🔔 звук вкл' : '🔕 звук выкл'}
            </button>
            <button type="button" className="btn-admin btn-admin--ghost" onClick={() => void load()}>
              Обновить
            </button>
            <button type="button" className="btn-admin btn-admin--ghost" onClick={logout}>
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="container admin-body">
        {error && (
          <div className="form-error" style={{ marginBottom: 16, background: 'rgba(184,69,47,.14)' }}>
            {error}
          </div>
        )}

        <div className="kpi-grid">
          <div className="kpi">
            <span className="kpi__label">Новые заказы</span>
            <span className="kpi__value" style={{ color: todayStats.fresh ? 'var(--shu-soft)' : undefined }}>
              {todayStats.fresh}
            </span>
          </div>
          <div className="kpi">
            <span className="kpi__label">В работе</span>
            <span className="kpi__value">{todayStats.active}</span>
          </div>
          <div className="kpi">
            <span className="kpi__label">Выручка сегодня</span>
            <span className="kpi__value">
              {formatPrice(todayStats.revenue)}
              <small>· {todayStats.count} зак.</small>
            </span>
          </div>
          <div className="kpi">
            <span className="kpi__label">Средний чек</span>
            <span className="kpi__value">{formatPrice(todayStats.average)}</span>
          </div>
        </div>

        <div className="admin-toolbar">
          <div>
            <div className="admin-toolbar__title">Доска заказов</div>
            <p className="admin-card__hint" style={{ marginBottom: 0 }}>
              Обновляется автоматически каждые 4 секунды · таймер до готовности
            </p>
          </div>
          <div className="admin-toolbar__group">
            <label className="switch">
              <input
                type="checkbox"
                checked={Boolean(settings?.acceptingOrders)}
                onChange={toggleAccepting}
              />
              {settings?.acceptingOrders ? 'Приём заказов открыт' : 'Приём заказов на паузе'}
            </label>
            <button type="button" className="btn-admin btn-admin--ghost" onClick={createDemo}>
              + Демо-заказ
            </button>
          </div>
        </div>

        {loading && !orders.length ? (
          <div className="admin-panel" style={{ textAlign: 'center', color: 'var(--muted-light)' }}>
            Загружаем заказы…
          </div>
        ) : (
          <div className="board">
            {COLUMNS.map((column) => {
              const list = orders
                .filter((order) => column.statuses.includes(order.status))
                .slice(0, column.id === 'done' ? 16 : 40);
              return (
                <div className="board__col" key={column.id}>
                  <div className="col-head">
                    <span className="col-head__title">{column.title}</span>
                    <span
                      className={`col-head__count${column.hot && list.length ? ' col-head__count--hot' : ''}`}
                    >
                      {list.length}
                    </span>
                  </div>
                  <div className="col-body">
                    {list.length === 0 && <div className="col-empty">Пока пусто</div>}
                    {list.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        now={now}
                        onStatus={(status) => patchOrder(order.id, { status })}
                        onEta={(delta) => patchOrder(order.id, { etaDeltaMinutes: delta })}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="admin-grid">
          <div className="admin-panel">
            <div className="admin-card__title">Стоп-лист</div>
            <p className="admin-card__hint">
              Нажмите на блюдо, чтобы скрыть его из заказа. Гости сразу увидят, что позиции нет.
            </p>
            <div className="stoplist">
              {[
                ...LUNCHES.map((lunch) => ({ id: lunch.id, name: `Обед «${lunch.title}»` })),
                ...MENU.map((item) => ({ id: item.id, name: item.name })),
              ].map((item) => {
                const stopped = settings?.stopList.includes(item.id) ?? false;
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`stoplist__item${stopped ? ' is-stopped' : ''}`}
                    onClick={() => toggleStop(item.id, !stopped)}
                  >
                    <span>{item.name}</span>
                    <span className="stoplist__dot" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-card__title">Настройки кафе</div>
            <p className="admin-card__hint">
              Часы работы, время приготовления и условия доставки. Изменения сразу видны на сайте.
            </p>
            <div className="admin-form">
              <div className="field">
                <span className="admin-label">Открытие, час</span>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  max={23}
                  value={form.openHour ?? ''}
                  onChange={(event) => updateForm({ openHour: Number(event.target.value) })}
                />
              </div>
              <div className="field">
                <span className="admin-label">Закрытие, час</span>
                <input
                  className="admin-input"
                  type="number"
                  min={1}
                  max={24}
                  value={form.closeHour ?? ''}
                  onChange={(event) => updateForm({ closeHour: Number(event.target.value) })}
                />
              </div>
              <div className="field">
                <span className="admin-label">Готовность, самовывоз (мин)</span>
                <input
                  className="admin-input"
                  type="number"
                  min={5}
                  max={180}
                  value={form.prepPickup ?? ''}
                  onChange={(event) => updateForm({ prepPickup: Number(event.target.value) })}
                />
              </div>
              <div className="field">
                <span className="admin-label">Готовность, доставка (мин)</span>
                <input
                  className="admin-input"
                  type="number"
                  min={5}
                  max={240}
                  value={form.prepDelivery ?? ''}
                  onChange={(event) => updateForm({ prepDelivery: Number(event.target.value) })}
                />
              </div>
              <div className="field">
                <span className="admin-label">Стоимость доставки, ₽</span>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  value={form.deliveryFee ?? ''}
                  onChange={(event) => updateForm({ deliveryFee: Number(event.target.value) })}
                />
              </div>
              <div className="field">
                <span className="admin-label">Бесплатно от, ₽</span>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  value={form.freeDeliveryFrom ?? ''}
                  onChange={(event) =>
                    updateForm({ freeDeliveryFrom: Number(event.target.value) })
                  }
                />
              </div>
              <div className="field">
                <span className="admin-label">Минимальный заказ, ₽</span>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  value={form.minOrder ?? ''}
                  onChange={(event) => updateForm({ minOrder: Number(event.target.value) })}
                />
              </div>
            </div>
            <div className="admin-actions">
              <button
                type="button"
                className="btn-admin btn-admin--primary"
                style={{ flex: 'none', padding: '10px 18px' }}
                onClick={saveSettings}
                disabled={savingSettings}
              >
                {savingSettings ? 'Сохраняем…' : 'Сохранить'}
              </button>
              {savedAt && <span className="admin-save">Сохранено ✓</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  now,
  onStatus,
  onEta,
}: {
  order: Order;
  now: number;
  onStatus: (status: OrderStatus) => void;
  onEta: (delta: number) => void;
}) {
  const next = nextStatus(order);
  const isClosed = order.status === 'done' || order.status === 'cancelled';
  const remaining = order.etaAt ? order.etaAt - now : 0;
  const total = order.etaAt ? Math.max(order.etaAt - order.createdAt, 1) : 1;
  const progress = Math.min(100, Math.max(0, ((total - Math.max(remaining, 0)) / total) * 100));
  const late = remaining < 0 && !isClosed;

  return (
    <article
      className={`order-card${order.status === 'new' ? ' order-card--new' : ''}${late ? ' order-card--late' : ''}`}
    >
      <div className="order-card__top">
        <div>
          <div className="order-card__num">{order.number}</div>
          <div className="order-card__time">
            {formatTime(order.createdAt)} · {formatPrice(order.total)}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 4, justifyItems: 'end' }}>
          <span className={`chip chip--${order.type}`}>{ORDER_TYPE_LABEL[order.type]}</span>
          {order.preorder && <span className="chip chip--preorder">предзаказ</span>}
        </div>
      </div>

      {!isClosed && order.etaAt && (
        <div className={`timer${late ? ' timer--late' : ''}`}>
          <div className="timer__row">
            <span className="timer__value">
              {late ? `+${formatCountdown(Math.abs(remaining))}` : formatCountdown(remaining)}
            </span>
            <span className="timer__label">{late ? 'опоздание' : `к ${formatTime(order.etaAt)}`}</span>
          </div>
          <div className="timer__bar">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="order-card__customer">
        <span className="order-card__name">{order.customer.name}</span>
        <a className="order-card__phone" href={`tel:${order.customer.phone.replace(/[^\d+]/g, '')}`}>
          {order.customer.phone}
        </a>
        {order.customer.address && (
          <span className="order-card__address">{order.customer.address}</span>
        )}
      </div>

      {order.customer.comment && (
        <p className="order-card__comment">{order.customer.comment}</p>
      )}

      <div className="order-card__items">
        {order.items.map((item) => (
          <div className="order-card__item" key={item.id}>
            <span>
              {item.name} <em>× {item.qty}</em>
            </span>
            <em>{formatPrice(item.price * item.qty)}</em>
          </div>
        ))}
      </div>

      <div className="order-card__total">
        <span>
          {order.status === 'done'
            ? 'выполнен'
            : order.status === 'cancelled'
              ? 'отменён'
              : 'к оплате'}
        </span>
        <strong>{formatPrice(order.total)}</strong>
      </div>

      {!isClosed && (
        <>
          <div className="order-card__actions">
            {next && (
              <button
                type="button"
                className="btn-admin btn-admin--primary"
                onClick={() => onStatus(next)}
              >
                {nextActionLabel(order)}
              </button>
            )}
            <button
              type="button"
              className="btn-admin btn-admin--ghost"
              title="Отменить заказ"
              onClick={() => onStatus('cancelled')}
            >
              ✕
            </button>
          </div>
          <div className="order-card__actions">
            <button type="button" className="btn-admin btn-admin--sm" onClick={() => onEta(-5)}>
              −5 мин
            </button>
            <button type="button" className="btn-admin btn-admin--sm" onClick={() => onEta(5)}>
              +5 мин
            </button>
          </div>
        </>
      )}

      {isClosed && order.status === 'done' && (
        <button
          type="button"
          className="btn-admin btn-admin--sm"
          onClick={() => onStatus('new')}
          title="Вернуть в новые"
        >
          Вернуть в работу
        </button>
      )}
    </article>
  );
}
