'use client';

import { useCart } from './cart/CartProvider';

export function Toast() {
  const { toast } = useCart();
  return (
    <div className={`toast${toast ? ' is-visible' : ''}`} role="status" aria-live="polite">
      <span className="toast__dot" aria-hidden="true" />
      {toast}
    </div>
  );
}
