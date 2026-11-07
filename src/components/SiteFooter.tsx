import Link from 'next/link';
import { CAFE } from '@/lib/cafe';
import { STATIC_SITE } from '@/lib/asset';

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="brand__mark">МОНО</div>
            <p className="footer__tagline">
              Японская, итальянская и европейская кухня в одном меню. Завтраки, обеды, кофе и доставка
              по Молодогвардейску.
            </p>
          </div>

          <div>
            <div className="footer__col-title">Меню</div>
            <div className="footer__links">
              <Link href="/menu#breakfast">Завтраки</Link>
              <Link href="/menu#japanese">Япония</Link>
              <Link href="/menu#italian">Италия</Link>
              <Link href="/menu#european">Европа</Link>
              <Link href="/menu#coffee">Кофе</Link>
            </div>
          </div>

          <div>
            <div className="footer__col-title">Кафе</div>
            <div className="footer__links">
              <Link href="/#lunches">Комплексные обеды</Link>
              <Link href="/#delivery">Доставка</Link>
              <Link href="/#contacts">Контакты</Link>
              <a href={CAFE.vk} target="_blank" rel="noreferrer">
                Мы во ВКонтакте
              </a>
              <a href={CAFE.max} target="_blank" rel="noreferrer">
                Мы в MAX
              </a>
            </div>
          </div>

          <div>
            <div className="footer__col-title">Связаться</div>
            <div className="footer__links">
              {CAFE.phones.map((phone) => (
                <a key={phone.tel} href={`tel:${phone.tel}`}>
                  {phone.display}
                </a>
              ))}
              <span>{CAFE.addressFull}</span>
              <span>{CAFE.hours.label}</span>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} кафе «Моно». Все права защищены.</span>
          <span>
            Сделано с любовью к еде
            {!STATIC_SITE && (
              <>
                {' · '}
                <Link href="/admin" className="footer__admin">
                  Панель управления
                </Link>
              </>
            )}
          </span>
        </div>
      </div>
    </footer>
  );
}
