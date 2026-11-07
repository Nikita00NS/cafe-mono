'use client';

import { useEffect, useRef, useState } from 'react';
import { useCart } from './cart/CartProvider';

type Props = {
  id: string;
  name: string;
  price: number;
  image?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
};

export function AddToCartButton({
  id,
  name,
  price,
  image,
  label = 'В заказ',
  className = 'add-btn',
  disabled = false,
}: Props) {
  const { add, notify } = useCart();
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <button
      type="button"
      className={`${className}${done ? ' is-added' : ''}`}
      aria-label={`Добавить «${name}» в заказ`}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        if (disabled) return;
        add({ id, name, price, image });
        notify(`«${name}» в заказе`);
        setDone(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setDone(false), 1400);
      }}
    >
      {done ? '✓' : className.includes('add-btn') ? '+' : label}
    </button>
  );
}
