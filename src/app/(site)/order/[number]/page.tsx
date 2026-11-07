import type { Metadata } from 'next';
import Link from 'next/link';
import { findOrderByNumber } from '@/lib/db';
import { publicOrder } from '@/lib/orders';
import { OrderTracker } from '@/components/OrderTracker';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Статус заказа',
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const order = await findOrderByNumber(decodeURIComponent(number));

  if (!order) {
    return (
      <section className="track">
        <div className="container">
          <div className="track__inner">
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
          </div>
        </div>
      </section>
    );
  }

  return <OrderTracker initial={publicOrder(order)} />;
}
