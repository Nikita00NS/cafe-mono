import type { OrderStatus } from './types';

export const STATUS_META: Record<
  OrderStatus,
  { label: string; adminLabel: string; tone: 'new' | 'active' | 'ready' | 'done' | 'muted'; step: number }
> = {
  new: { label: 'Принят', adminLabel: 'Новый', tone: 'new', step: 0 },
  accepted: { label: 'Принят', adminLabel: 'Принят', tone: 'active', step: 1 },
  cooking: { label: 'Готовится', adminLabel: 'Готовится', tone: 'active', step: 2 },
  ready: { label: 'Готов', adminLabel: 'Готов', tone: 'ready', step: 3 },
  delivering: { label: 'В доставке', adminLabel: 'В доставке', tone: 'ready', step: 4 },
  done: { label: 'Выполнен', adminLabel: 'Выполнен', tone: 'done', step: 5 },
  cancelled: { label: 'Отменён', adminLabel: 'Отменён', tone: 'muted', step: -1 },
};

export const ORDER_TYPE_LABEL = {
  delivery: 'Доставка',
  pickup: 'Самовывоз',
} as const;

export const PAYMENT_LABEL = {
  cash: 'Наличными',
  card: 'Картой курьеру',
  online: 'Онлайн',
} as const;

export const ACTIVE_STATUSES: OrderStatus[] = ['new', 'accepted', 'cooking', 'ready', 'delivering'];

export function nextStatus(order: { status: OrderStatus; type: 'delivery' | 'pickup' }): OrderStatus | null {
  switch (order.status) {
    case 'new':
      return 'accepted';
    case 'accepted':
      return 'cooking';
    case 'cooking':
      return 'ready';
    case 'ready':
      return order.type === 'delivery' ? 'delivering' : 'done';
    case 'delivering':
      return 'done';
    default:
      return null;
  }
}

export function nextActionLabel(order: { status: OrderStatus; type: 'delivery' | 'pickup' }): string {
  switch (order.status) {
    case 'new':
      return 'Принять заказ';
    case 'accepted':
      return 'Начать готовить';
    case 'cooking':
      return 'Готово';
    case 'ready':
      return order.type === 'delivery' ? 'Передать курьеру' : 'Выдан гостю';
    case 'delivering':
      return 'Доставлен';
    default:
      return '';
  }
}
