'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from './cart/CartProvider';
import { formatPrice, formatTime, isValidPhone } from '@/lib/format';
import { CAFE } from '@/lib/cafe';
import type { OrderType, PaymentMethod } from '@/lib/types';
import { asset, STATIC_SITE } from '@/lib/asset';

type View = 'cart' | 'checkout' | 'success';

type SuccessInfo = {
  number: string;
  total: number;
  etaAt?: number;
  preorder: boolean;
};

export function CartDrawer() {
  const { items, subtotal, count, isOpen, closeCart, setQty, remove, clear } = useCart();
  const [view, setView] = useState<View>('cart');
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(CAFE.delivery.fee);
  const [freeFrom, setFreeFrom] = useState<number>(CAFE.delivery.freeFrom);
  const [minOrder, setMinOrder] = useState<number>(CAFE.delivery.minOrder);
  const [accepting, setAccepting] = useState(true);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (STATIC_SITE || !isOpen || view !== 'checkout') return;
    let active = true;
    fetch('/api/state', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data?.settings) return;
        setDeliveryFee(Number(data.settings.deliveryFee ?? CAFE.delivery.fee));
        setFreeFrom(Number(data.settings.freeDeliveryFrom ?? CAFE.delivery.freeFrom));
        setMinOrder(Number(data.settings.minOrder ?? CAFE.delivery.minOrder));
        setAccepting(Boolean(data.settings.acceptingOrders));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isOpen, view]);

  useEffect(() => {
    if (isOpen) return;
    const timer = setTimeout(() => {
      setView('cart');
      setError(null);
    }, 400);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const fee = orderType === 'delivery' && subtotal < freeFrom ? deliveryFee : 0;
  const total = subtotal + fee;

  const belowMin = orderType === 'delivery' && subtotal < minOrder;
  const freeLeft = Math.max(0, freeFrom - subtotal);

  const canSubmit = useMemo(
    () => items.length > 0 && name.trim().length > 1 && isValidPhone(phone) && (orderType === 'pickup' || address.trim().length > 4),
    [items.length, name, phone, orderType, address],
  );

  async function submit() {
    setError(null);
    if (name.trim().length < 2) {
      setError('Укажите, как к вам обращаться');
      return;
    }
    if (!isValidPhone(phone)) {
      setError('Проверьте номер телефона — нужно не меньше 10 цифр');
      return;
    }
    if (orderType === 'delivery' && address.trim().length < 5) {
      setError('Укажите адрес доставки: улица, дом, квартира');
      return;
    }
    if (belowMin) {
      setError(`Минимальная сумма доставки — ${formatPrice(minOrder)}. Добавьте блюда или выберите самовывоз.`);
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: orderType,
          customer: { name, phone, address, comment },
          payment,
          items: items.map((item) => ({ id: item.id, qty: item.qty })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'Не удалось оформить заказ');
        return;
      }
      setSuccess({
        number: data.order.number,
        total: data.order.total,
        etaAt: data.order.etaAt,
        preorder: Boolean(data.order.preorder),
      });
      setView('success');
      clear();
      setComment('');
    } catch {
      setError('Сеть недоступна. Позвоните нам — примем заказ по телефону.');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div
        className={`drawer-overlay${isOpen ? ' is-open' : ''}`}
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        className={`drawer${isOpen ? ' is-open' : ''}`}
        aria-hidden={!isOpen}
        aria-label="Корзина и оформление заказа"
      >
        <div className="drawer__head">
          <div>
            <div className="eyebrow eyebrow--plain">
              {view === 'checkout' ? 'Оформление' : view === 'success' ? 'Заказ принят' : 'Ваш заказ'}
            </div>
            <h2 className="drawer__title">
              {view === 'checkout' ? 'Данные заказа' : view === 'success' ? 'Спасибо!' : 'Корзина'}
            </h2>
          </div>
          <button ref={closeRef} type="button" className="drawer__close" onClick={closeCart} aria-label="Закрыть">
            ✕
          </button>
        </div>

        {view === 'cart' && (
          <>
            <div className="drawer__body">
              {items.length === 0 ? (
                <div className="empty">
                  <div className="empty__mark">М</div>
                  <p className="empty__text">
                    Пока пусто. Добавьте блюда из меню — завтраки, обеды, роллы или кофе.
                  </p>
                  <Link href="/menu" className="btn btn--outline btn--sm" onClick={closeCart}>
                    Перейти в меню
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div className="cart-line" key={item.id}>
                    <div className="cart-line__media">
                      {item.image ? <img src={asset(item.image)} alt="" loading="lazy" /> : <span>М</span>}
                    </div>
                    <div>
                      <div className="cart-line__name">{item.name}</div>
                      <div className="cart-line__price">{formatPrice(item.price)}</div>
                    </div>
                    <div className="cart-line__controls">
                      <div className="qty">
                        <button type="button" onClick={() => setQty(item.id, item.qty - 1)} aria-label="Меньше">
                          −
                        </button>
                        <span>{item.qty}</span>
                        <button type="button" onClick={() => setQty(item.id, item.qty + 1)} aria-label="Больше">
                          +
                        </button>
                      </div>
                      <div className="cart-line__sum">{formatPrice(item.price * item.qty)}</div>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase' }}
                      >
                        удалить
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {items.length > 0 && (
              <div className="drawer__foot">
                <div className="total-row">
                  <span className="total-row__label">{count} шт · сумма</span>
                  <span className="total-row__value">{formatPrice(subtotal)}</span>
                </div>
                <p className="form-hint">
                  {freeLeft > 0
                    ? `До бесплатной доставки — ${formatPrice(freeLeft)}. Или заберите заказ сами.`
                    : 'Доставка по городу — бесплатно.'}
                </p>
                {STATIC_SITE ? (
                  <div className="cart-call">
                    <p className="form-hint">
                      Это статическая версия сайта: заказ принимаем по телефону. Назовите состав корзины —
                      приготовим и привезём.
                    </p>
                    {CAFE.phones.map((phone) => (
                      <a key={phone.tel} href={`tel:${phone.tel}`} className="btn btn--primary btn--block">
                        Позвонить · {phone.display}
                      </a>
                    ))}
                  </div>
                ) : (
                  <button type="button" className="btn btn--primary btn--block" onClick={() => setView('checkout')}>
                    Оформить заказ
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {view === 'checkout' && (
          <>
            <div className="drawer__body">
              <button type="button" className="checkout-back" onClick={() => setView('cart')}>
                ← вернуться к корзине
              </button>

              <div className="segmented" role="group" aria-label="Способ получения">
                <button
                  type="button"
                  className={orderType === 'delivery' ? 'is-active' : ''}
                  onClick={() => setOrderType('delivery')}
                >
                  Доставка
                </button>
                <button
                  type="button"
                  className={orderType === 'pickup' ? 'is-active' : ''}
                  onClick={() => setOrderType('pickup')}
                >
                  Самовывоз
                </button>
              </div>

              {!accepting && (
                <p className="form-hint">
                  Сейчас приём заказов на паузе — но вы можете позвонить нам:{' '}
                  <a href={`tel:${CAFE.phones[0].tel}`} style={{ color: 'var(--ink)' }}>
                    {CAFE.phones[0].display}
                  </a>
                </p>
              )}

              <div className="field">
                <label className="label" htmlFor="ck-name">
                  Как к вам обращаться
                </label>
                <input
                  id="ck-name"
                  className="input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Имя"
                  autoComplete="name"
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="ck-phone">
                  Телефон
                </label>
                <input
                  id="ck-phone"
                  className="input"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>

              {orderType === 'delivery' ? (
                <div className="field">
                  <label className="label" htmlFor="ck-address">
                    Адрес доставки
                  </label>
                  <input
                    id="ck-address"
                    className="input"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="улица, дом, квартира"
                    autoComplete="street-address"
                  />
                </div>
              ) : (
                <p className="form-hint">
                  Забрать: {CAFE.addressFull}. Готовность — примерно{' '}
                  {CAFE.delivery.pickup}.
                </p>
              )}

              <div className="field">
                <label className="label" htmlFor="ck-comment">
                  Комментарий
                </label>
                <textarea
                  id="ck-comment"
                  className="textarea"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Пожелания к блюдам, домофон, этаж, время"
                />
              </div>

              <div className="field">
                <span className="label">Оплата</span>
                <div className="radio-row">
                  <label>
                    <input
                      type="radio"
                      name="payment"
                      checked={payment === 'cash'}
                      onChange={() => setPayment('cash')}
                    />
                    Наличными
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="payment"
                      checked={payment === 'card'}
                      onChange={() => setPayment('card')}
                    />
                    Картой
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="payment"
                      checked={payment === 'online'}
                      onChange={() => setPayment('online')}
                    />
                    Переводом
                  </label>
                </div>
              </div>

              {error && <div className="form-error">{error}</div>}
            </div>

            <div className="drawer__foot">
              <div className="total-row total-row--muted">
                <span className="total-row__label">Блюда</span>
                <span className="total-row__value">{formatPrice(subtotal)}</span>
              </div>
              <div className="total-row total-row--muted">
                <span className="total-row__label">{orderType === 'delivery' ? 'Доставка' : 'Самовывоз'}</span>
                <span className="total-row__value">{fee === 0 ? 'бесплатно' : formatPrice(fee)}</span>
              </div>
              <div className="total-row">
                <span className="total-row__label">Итого</span>
                <span className="total-row__value">{formatPrice(total)}</span>
              </div>
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={submit}
                disabled={sending || !canSubmit || !accepting}
              >
                {sending ? 'Отправляем…' : 'Подтвердить заказ'}
              </button>
              <p className="form-hint">
                Нажимая кнопку, вы соглашаетесь на обработку персональных данных для выполнения заказа.
              </p>
            </div>
          </>
        )}

        {view === 'success' && success && (
          <div className="drawer__body">
            <div className="success">
              <div className="success__mark">✓</div>
              <h3 className="success__title">Заказ принят</h3>
              <div className="success__num">№ {success.number}</div>
              <p className="success__text">
                {success.preorder
                  ? 'Кафе сейчас закрыто — заказ примем к открытию и свяжемся с вами.'
                  : `Мы уже готовим. Ожидаемое время — ${success.etaAt ? formatTime(success.etaAt) : 'уточним по телефону'}.`}
              </p>
              <p className="success__text">Сумма заказа: {formatPrice(success.total)}</p>
              <Link
                href={`/order/${success.number}`}
                className="btn btn--primary btn--block"
                onClick={closeCart}
              >
                Отслеживать заказ
              </Link>
              <Link href="/menu" className="btn btn--outline btn--block" onClick={closeCart}>
                Вернуться в меню
              </Link>
              <p className="form-hint">
                Если нужно что-то изменить — позвоните:{' '}
                <a href={`tel:${CAFE.phones[0].tel}`}>{CAFE.phones[0].display}</a>
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
