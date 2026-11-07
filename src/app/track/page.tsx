'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { OrderTracker, type PublicOrder } from '@/components/OrderTracker';
import { STATIC_SITE } from '@/lib/asset';
import { findOrderByNumber, publicOrder } from '@/lib/demo';

type State = { status: 'loading' } | { status: 'found'; order: PublicOrder } | { status: 'missing' };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="track">
      <div className="container">
        <div className="track__inner">{children}</div>
      </div>
    </div>
  );
}

function TrackInner() {
  const params = useSearchParams();
  const number = (params.get('n') ?? '').trim();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    if (!number) {
      setState({ status: 'missing' });
      return;
    }

    if (STATIC_SITE) {
      const local = findOrderByNumber(number);
      setState(local ? { status: 'found', order: publicOrder(local) } : { status: 'missing' });
      return;
    }

    fetch(`/api/track/${encodeURIComponent(number)}`, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active) return;
        setState(
          data?.order ? { status: 'found', order: data.order as PublicOrder } : { status: 'missing' },
        );
      })
      .catch(() => {
        if (active) setState({ status: 'missing' });
      });

    return () => {
      active = false;
    };
  }, [number]);

  if (state.status === 'found') return <OrderTracker initial={state.order} />;

  if (state.status === 'loading') {
    return (
      <Shell>
        <div className="track-card" style={{ textAlign: 'center' }}>
          <h1 className="track-card__title">Загружаем заказ…</h1>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="track-card" style={{ textAlign: 'center', justifyItems: 'center' }}>
        <div className="empty__mark" style={{ color: 'var(--gold)' }}>
          ?
        </div>
        <h1 className="track-card__title">Заказ не найден</h1>
        <p style={{ color: 'var(--muted-light)', fontSize: 14, lineHeight: 1.7 }}>
          Проверьте номер заказа — он указан в подтверждении. Или позвоните нам, и мы подскажем.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/menu" className="btn btn--light btn--sm">
            Перейти в меню
          </Link>
          <Link href="/" className="btn btn--ghost btn--sm">
            На главную
          </Link>
        </div>
      </div>
    </Shell>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <div className="track-card" style={{ textAlign: 'center' }}>
            <h1 className="track-card__title">Загружаем заказ…</h1>
          </div>
        </Shell>
      }
    >
      <TrackInner />
    </Suspense>
  );
}
