export const CAFE_TZ = 'Europe/Moscow';

function partsInTz(date: Date, timeZone = CAFE_TZ) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) map[part.type] = part.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour === '24' ? '0' : map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

export function minutesNow(date = new Date()) {
  const p = partsInTz(date);
  return p.hour * 60 + p.minute;
}

function offsetMs(date: Date, timeZone = CAFE_TZ) {
  const p = partsInTz(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - date.getTime();
}

export type OpenState = {
  isOpen: boolean;
  label: string;
  hint: string;
  minutesUntilClose: number;
  nextOpeningAt: number;
};

export function getOpenState(
  openHour: number,
  closeHour: number,
  date = new Date(),
  acceptingOrders = true,
): OpenState {
  const now = date.getTime();
  const minutes = minutesNow(date);
  const openMin = openHour * 60;
  const closeMin = closeHour * 60;
  const isOpen = minutes >= openMin && minutes < closeMin;
  const hoursLabel = `${String(openHour).padStart(2, '0')}:00–${String(closeHour).padStart(2, '0')}:00`;

  if (isOpen && acceptingOrders) {
    const left = closeMin - minutes;
    return {
      isOpen: true,
      label: `Открыто до ${String(closeHour).padStart(2, '0')}:00`,
      hint:
        left <= 60
          ? `До закрытия ${left} мин — успевайте`
          : `Принимаем заказы · кухня до ${String(closeHour).padStart(2, '0')}:00`,
      minutesUntilClose: left,
      nextOpeningAt: nextOpeningTs(openHour, date).getTime(),
    };
  }

  if (isOpen && !acceptingOrders) {
    return {
      isOpen: true,
      label: 'Открыто · приём заказов на паузе',
      hint: 'Мы скоро вернёмся — позвоните нам, чтобы заказать',
      minutesUntilClose: closeMin - minutes,
      nextOpeningAt: nextOpeningTs(openHour, date).getTime(),
    };
  }

  return {
    isOpen: false,
    label: `Закрыто · откроемся в ${String(openHour).padStart(2, '0')}:00`,
    hint: `Работаем ежедневно ${hoursLabel}. Заказ можно оформить заранее`,
    minutesUntilClose: 0,
    nextOpeningAt: nextOpeningTs(openHour, date).getTime(),
  };
}

export function nextOpeningTs(openHour: number, date = new Date()): Date {
  const p = partsInTz(date);
  const offset = offsetMs(date);
  let ts = Date.UTC(p.year, p.month - 1, p.day, openHour, 0, 0) - offset;
  if (ts <= date.getTime()) ts += 24 * 60 * 60 * 1000;
  return new Date(ts);
}
