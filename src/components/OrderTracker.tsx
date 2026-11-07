'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { formatCountdown, formatPrice, formatTime } from '@/lib/format';
import { CAFE } from '@/lib/cafe';
import type { OrderStatus, OrderType } from '@/lib/types';

export type PublicOrder = {
  number: string;
  createdAt: number;
  status: OrderStatus;
  type: OrderType;
  items: { id: string; name: string; price: number; qty: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  etaAt?: number;
  preorder: boolean;
  name: string;
  address?: string;
};

const STEPS = [
  { key: 'accepted', title: 'Заказ принят', hint: 'Мы получили заказ и передали его на кухню' },
  { key: 'cooking', title: 'Готовится', hint: 'Повара уже работают над вашим заказом' },
  { key: 'ready', title: 'Собран', hint: 'Заказ упакован и ждёт выдачи' },
  { key: 'done', title: 'Выполнен', hint: 'Приятного аппетита!' },
];

function stepIndex(status: OrderStatus, type: OrderType) {
  switch (status) {
    case 'new':
      return 0;
    case 'accepted':
      return 0;
    case 'cooking':
      return 1;
    case 'ready':
      return 2;
    case 'delivering':
      return 2;
    case 'done':
      return 3;
    default:
      return 0;
  }
}

export function OrderTracker({ initial }: { initial: PublicOrder }) {
  const [order, setOrder] = useState(initial);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    let active = true;
    const load = () =>
      fetch(`/api/track/${encodeURIComponent(initial.number)}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (active && data?.order) setOrder(data.order as PublicOrder);
        })
        .catch(() => undefined);

    load();
    const interval = setInterval(load, 8000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [initial.number]);

  const status = order.status;
  const isDone = status === 'done';
  const isCancelled = status === 'cancelled';
  const etaAt = order.etaAt;
  const remaining = etaAt ? etaAt - now : 0;
  const isLate = remaining < 0 && !isDone && !isCancelled;
  const totalWindow = etaAt ? Math.max(etaAt - order.createdAt, 1) : 1;
  const progress = etaAt ? Math.min(100, Math.max(4, ((totalWindow - Math.max(remaining, 0)) / totalWindow) * 100)) : 0;
  const current = stepIndex(status, order.type);

  const timerLabel = useMemo(() => {
    if (isCancelled) return 'Заказ отменён';
    if (isDone) return 'Готово';
    if (!etaAt) return '—';
    if (isLate) return `+${formatCountdown(Math.abs(remaining))}`;
    return formatCountdown(remaining);
  }, [etaAt, isDone, isCancelled, isLate, remaining]);

  const title = isCancelled
    ? 'Заказ отменён'
    : isDone
      ? 'Заказ выполнен'
      : order.preorder
        ? 'Предзаказ принят'
        : order.type === 'delivery'
          ? 'Готовим и везём'
          : 'Готовим к выдаче';

  return (
    <div className="track">
      <div className="container">
        <div className="track__inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
            <Link href="/" className="brand">
              <span className="brand__mark" style={{ fontSize: 24 }}>
                МОНО
              </span>
              <span className="brand__sub">cafe · kitchen</span>
            </Link>
            <Link href="/menu" className="btn btn--ghost btn--sm">
              В меню
            </Link>
          </div>

          <div className="track-card">
            <div className="track-card__top">
              <div>
                <span className="track-card__num">ЗАКАЗ № {order.number}</span>
                <h1 className="track-card__title">{title}</h1>
                <p style={{ color: 'var(--muted-light)', fontSize: 13, marginTop: 8 }}>
                  {order.preorder
                    ? 'Кафе закрыто — примем заказ к открытию и позвоним вам.'
                    : order.type === 'delivery'
                      ? 'Доставка по Молодогвардейску'
                      : `Самовывоз · ${CAFE.addressFull}`}
                </p>
              </div>
              <span className={`chip chip--${order.type}`}>
                {order.type === 'delivery' ? 'Доставка' : 'Самовывоз'}
              </span>
            </div>

            {!isCancelled && (
              <div className="track-timer">
                <span className="track-timer__label">
                  {isDone ? 'Заказ выполнен' : isLate ? 'Немного задерживаемся' : 'Осталось до готовности'}
                </span>
                <span className={`track-timer__value${isLate ? ' is-late' : ''}`}>{timerLabel}</span>
                <span className="track-timer__hint">
                  {etaAt && !isDone
                    ? `Ориентировочно к ${formatTime(etaAt)}${isLate ? ' · уже упаковываем' : ''}`
                    : isDone
                      ? 'Спасибо, что выбрали МОНО'
                      : 'Уточним время по телефону'}
                </span>
                <div className="track-timer__bar" aria-hidden="true">
                  <span style={{ width: `${isDone ? 100 : progress}%` }} />
                </div>
              </div>
            )}

            {isCancelled ? (
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted-light)' }}>
                Заказ отменён. Если это ошибка — позвоните нам, и мы всё восстановим.
              </p>
            ) : (
              <div className="timeline">
                {STEPS.map((step, index) => {
                  const isComplete = index < current || isDone;
                  const isCurrent = index === current && !isDone;
                  return (
                    <div
                      className={`timeline__step${isComplete ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}`}
                      key={step.key}
                    >
                      <span className="timeline__dot">{isComplete ? '✓' : index + 1}</span>
                      <div>
                        <div className="timeline__title">{step.title}</div>
                        <div className="timeline__time">
                          {isCurrent ? step.hint : isComplete ? 'Выполнено' : 'Ожидает'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="track-summary">
              {order.items.map((item) => (
                <div className="track-summary__row" key={item.id}>
                  <span>
                    {item.name} × {item.qty}
                  </span>
                  <strong>{formatPrice(item.price * item.qty)}</strong>
                </div>
              ))}
              {order.deliveryFee > 0 && (
                <div className="track-summary__row">
                  <span>Доставка</span>
                  <strong>{formatPrice(order.deliveryFee)}</strong>
                </div>
              )}
              <div className="track-summary__row track-summary__row--total">
                <span>Итого</span>
                <strong>{formatPrice(order.total)}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 4 }}>
              <a href={`tel:${CAFE.phones[1].tel}`} className="btn btn--light btn--sm">
                Позвонить в кафе
              </a>
              <Link href="/menu" className="btn btn--ghost btn--sm">
                Заказать ещё
              </Link>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--muted-light)', marginTop: 18 }}>
            Статус обновляется автоматически · {CAFE.hours.label}
          </p>
        </div>
      </div>
    </div>
  );
}
