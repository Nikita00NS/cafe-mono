import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="track">
      <div className="container">
        <div className="track__inner">
          <div className="track-card" style={{ textAlign: 'center', justifyItems: 'center' }}>
            <span className="track-card__num">ОШИБКА 404</span>
            <h1 className="track-card__title">Такой страницы нет</h1>
            <p style={{ color: 'var(--muted-light)', fontSize: 14, lineHeight: 1.7 }}>
              Возможно, ссылка устарела. Загляните в меню — там всегда что-то вкусное.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/" className="btn btn--light btn--sm">
                На главную
              </Link>
              <Link href="/menu" className="btn btn--ghost btn--sm">
                В меню
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
