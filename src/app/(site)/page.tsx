import Link from 'next/link';
import { getSettings } from '@/lib/db';
import { getOpenState } from '@/lib/hours';
import { CAFE, LUNCH_HOURS } from '@/lib/cafe';
import { LUNCHES, MENU, MENU_BY_ID } from '@/lib/menu';
import { formatPrice } from '@/lib/format';
import { OpenStatus } from '@/components/OpenStatus';
import { MenuPreview } from '@/components/MenuPreview';
import { AddToCartButton } from '@/components/AddToCartButton';

export const dynamic = 'force-dynamic';

const MARQUEE = [
  'Японская кухня',
  'Итальянская кухня',
  'Европейская кухня',
  'Сытные завтраки',
  'Обеды за 550 ₽',
  'Кофе',
  'Доставка по городу',
];

export default async function HomePage() {
  const settings = await getSettings();
  const open = getOpenState(settings.openHour, settings.closeHour, new Date(), settings.acceptingOrders);
  const spicySet = MENU_BY_ID['jp-spicy-tuna-set'];
  const bakedSet = MENU_BY_ID['jp-baked-set'];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Кафе МОНО',
    servesCuisine: ['Japanese', 'Italian', 'European'],
    priceRange: '₽₽',
    telephone: CAFE.phones.map((phone) => phone.display),
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'ул. Ленина, 18',
      addressLocality: 'Молодогвардейск',
      addressCountry: 'RU',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: `${String(settings.openHour).padStart(2, '0')}:00`,
        closes: `${String(settings.closeHour).padStart(2, '0')}:00`,
      },
    ],
    sameAs: [CAFE.vk],
    image: '/images/hero-interior.jpg',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__media">
          <img src="/images/hero-interior.jpg" alt="Интерьер кафе МОНО вечером" fetchPriority="high" />
        </div>
        <div className="hero__overlay" />
        <div className="container hero__content">
          <div className="reveal">
            <span className="eyebrow" style={{ color: 'rgba(247,243,234,.72)' }}>
              Молодогвардейск · ул. Ленина, 18
            </span>
            <h1 className="hero__title">
              Три кухни.
              <em>Одно меню.</em>
            </h1>
            <p className="hero__lede">
              Японская, итальянская и европейская кухня, сытные завтраки, комплексные обеды за 550 ₽ и
              тот самый кофе, ради которого хочется задержаться.
            </p>
            <div className="hero__actions">
              <Link href="/menu" className="btn btn--light">
                Смотреть меню
              </Link>
              <Link href="#lunches" className="btn btn--ghost">
                Обеды за 550 ₽
              </Link>
            </div>
          </div>

          <div className="hero__meta reveal">
            <div className="hero__meta-block">
              <span className="hero__meta-label">Сегодня</span>
              <OpenStatus initialOpen={open.isOpen} initialLabel={open.label} />
              <span className="hero__meta-value">
                <small>{open.hint}</small>
              </span>
            </div>
            <div className="hero__meta-block">
              <span className="hero__meta-label">Заказ и доставка</span>
              <span className="hero__meta-value">
                {CAFE.phones[0].display}
                <small>{CAFE.phones[1].display}</small>
              </span>
            </div>
            <div className="hero__meta-block">
              <span className="hero__meta-label">Кухня</span>
              <span className="hero__meta-value">
                Япония · Италия · Европа
                <small>Завтраки с 09:00, обеды с 12:00</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee ──────────────────────────────────────── */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          {[0, 1, 2, 3].map((copy) =>
            MARQUEE.map((word) => (
              <span className="marquee__item" key={`${copy}-${word}`}>
                {word}
              </span>
            )),
          )}
        </div>
      </div>

      {/* ── About ────────────────────────────────────────── */}
      <section className="section" id="about">
        <div className="container">
          <div className="intro__grid">
            <div className="reveal">
              <span className="eyebrow">О кафе</span>
              <h2 className="h2">
                Лучшее <em>из трёх миров</em> — на одном столе
              </h2>
              <p className="intro__statement" style={{ marginTop: 26 }}>
                Хотите начать день правильно? У нас — сытные и красивые завтраки, с которых хочется
                начинать утро каждый день.
              </p>
            </div>
            <div className="intro__text reveal">
              <p>
                Мы собрали для вас японскую, итальянскую и европейскую кухню — в одном меню. В обед
                предлагаем комплексные обеды: вкусно, сбалансированно и без лишних хлопот.
              </p>
              <p>
                А ещё у нас отличный кофе — тот самый, который делает паузу по-настоящему приятной.
                Приходите пробовать, отдыхать и делиться впечатлениями — мы всегда рады гостям.
              </p>
              <div className="pill" style={{ justifySelf: 'start' }}>
                ☕ кофе · 🍣 суши · 🥗 европейская классика
              </div>
            </div>
          </div>

          <div className="stat-row">
            <div className="stat reveal">
              <div className="stat__value">3</div>
              <div className="stat__label">кухни в меню</div>
            </div>
            <div className="stat reveal">
              <div className="stat__value">5</div>
              <div className="stat__label">вариантов обеда</div>
            </div>
            <div className="stat reveal">
              <div className="stat__value">
                550<span>₽</span>
              </div>
              <div className="stat__label">комплексный обед</div>
            </div>
            <div className="stat reveal">
              <div className="stat__value">
                {String(settings.closeHour).padStart(2, '0')}
                <span>:00</span>
              </div>
              <div className="stat__label">работаем до</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Worlds ───────────────────────────────────────── */}
      <section className="section section--paper2" id="worlds">
        <div className="container">
          <div className="section-head">
            <div className="section-head__text reveal">
              <span className="eyebrow">Направления</span>
              <h2 className="h2">
                Три мира. <em>Одна кухня.</em>
              </h2>
            </div>
            <p className="lede reveal" style={{ maxWidth: '36ch' }}>
              Роллы и рамен, паста и пицца, гриль и салаты. Каждое направление — на своём месте, без
              компромиссов.
            </p>
          </div>

          <div className="worlds">
            <Link href="/menu#japanese" className="world-card reveal">
              <div className="world-card__media">
                <img src="/images/sushi-set.jpg" alt="Роллы японской кухни" loading="lazy" />
              </div>
              <div className="world-card__body">
                <span className="world-card__index">01 / JAPAN</span>
                <h3 className="world-card__title">Япония</h3>
                <p className="world-card__text">Роллы, запечённые сеты, рамен и поке — свежесть и точность.</p>
                <span className="world-card__link">
                  Смотреть блюда <span>→</span>
                </span>
              </div>
            </Link>

            <Link href="/menu#italian" className="world-card reveal">
              <div className="world-card__media">
                <img src="/images/pizza.jpg" alt="Пицца и паста итальянской кухни" loading="lazy" />
              </div>
              <div className="world-card__body">
                <span className="world-card__index">02 / ITALY</span>
                <h3 className="world-card__title">Италия</h3>
                <p className="world-card__text">Паста, пицца на тонком тесте, ризотто и лазанья.</p>
                <span className="world-card__link">
                  Смотреть блюда <span>→</span>
                </span>
              </div>
            </Link>

            <Link href="/menu#european" className="world-card reveal">
              <div className="world-card__media">
                <img src="/images/europe-dish.jpg" alt="Европейские блюда на гриле" loading="lazy" />
              </div>
              <div className="world-card__body">
                <span className="world-card__index">03 / EUROPE</span>
                <h3 className="world-card__title">Европа</h3>
                <p className="world-card__text">Гриль, крем-супы, салаты и домашние обеды.</p>
                <span className="world-card__link">
                  Смотреть блюда <span>→</span>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Lunches ──────────────────────────────────────── */}
      <section className="section" id="lunches">
        <div className="container">
          <div className="lunch-head">
            <div className="reveal">
              <span className="eyebrow">Комплексные обеды</span>
              <h2 className="h2">
                Обед, который <em>решает всё</em>
              </h2>
              <p className="lede" style={{ marginTop: 18 }}>
                Пять вариантов на выбор: суп, горячее и салат. Подаём {LUNCH_HOURS} — заходите в зал
                или заказывайте доставку.
              </p>
            </div>
            <div className="price-big reveal">
              550<span>₽</span>
            </div>
          </div>

          <div className="lunch-grid">
            {LUNCHES.map((lunch, index) => (
              <article className="lunch-card reveal" key={lunch.id}>
                <span className="lunch-card__num">0{index + 1}</span>
                <div>
                  <h3 className="lunch-card__title">{lunch.title}</h3>
                  {lunch.note && (
                    <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--shu)', marginTop: 6 }}>
                      {lunch.note}
                    </p>
                  )}
                </div>
                <ul className="lunch-card__list">
                  {lunch.composition.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="lunch-card__foot">
                  <span className="lunch-card__price">{formatPrice(lunch.price)}</span>
                  <AddToCartButton
                    id={lunch.id}
                    name={`Обед «${lunch.title}»`}
                    price={lunch.price}
                    disabled={settings.stopList.includes(lunch.id)}
                  />
                </div>
              </article>
            ))}
          </div>

          <div className="lunch-note">
            <span>· Хлеб входит в стоимость</span>
            <span>· Можно забрать с собой</span>
            <span>· Для больших компаний — позвоните заранее</span>
          </div>
        </div>
      </section>

      {/* ── Sets ─────────────────────────────────────────── */}
      <section className="section section--dark" id="sets">
        <div className="container">
          <div className="section-head">
            <div className="section-head__text reveal">
              <span className="eyebrow">Сеты и отдельные блюда</span>
              <h2 className="h2">
                Созданы, чтобы <em>делиться</em>
              </h2>
            </div>
            <Link href="/menu#sets" className="btn btn--ghost reveal">
              Все сеты
            </Link>
          </div>

          <div className="sets">
            {[spicySet, bakedSet].filter(Boolean).map((set) => (
              <article className="set-card reveal" key={set.id}>
                <div className="set-card__body">
                  <span className="world-card__index">SET / {set.weight}</span>
                  <h3 className="set-card__title">{set.name}</h3>
                  <p className="set-card__text">{set.description}</p>
                  <div className="set-card__foot">
                    <span className="set-card__price">{formatPrice(set.price)}</span>
                    <AddToCartButton
                      id={set.id}
                      name={set.name}
                      price={set.price}
                      image={set.image}
                      label="В заказ"
                      className="btn btn--light btn--sm"
                      disabled={settings.stopList.includes(set.id)}
                    />
                  </div>
                </div>
                <div className="set-card__media">
                  {set.image && <img src={set.image} alt={set.name} loading="lazy" />}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Menu preview ─────────────────────────────────── */}
      <section className="section" id="menu">
        <div className="container">
          <div className="section-head">
            <div className="section-head__text reveal">
              <span className="eyebrow">Меню</span>
              <h2 className="h2">
                Выбирайте <em>настроение</em>
              </h2>
            </div>
            <p className="lede reveal" style={{ maxWidth: '34ch' }}>
              Всё меню — {MENU.length} позиций: от сырников и роллов до пасты, гриля и десертов.
            </p>
          </div>

          <MenuPreview items={MENU} stopList={settings.stopList} />
        </div>
      </section>

      {/* ── Breakfast & coffee ───────────────────────────── */}
      <section className="section section--paper2">
        <div className="container">
          <div className="duo">
            <Link href="/menu#breakfast" className="duo-card reveal">
              <img src="/images/breakfast.jpg" alt="Завтраки в кафе МОНО" loading="lazy" />
              <div className="duo-card__body">
                <span className="eyebrow" style={{ color: 'rgba(247,243,234,.7)' }}>
                  С 09:00 до 12:00
                </span>
                <h3 className="duo-card__title">Завтраки, с которых хочется начинать утро</h3>
                <p className="duo-card__text">Сырники, омлеты, тосты с авокадо, каши и круассаны.</p>
                <span className="world-card__link">
                  Смотреть завтраки <span>→</span>
                </span>
              </div>
            </Link>

            <Link href="/menu#coffee" className="duo-card reveal">
              <img src="/images/coffee.jpg" alt="Кофе в кафе МОНО" loading="lazy" />
              <div className="duo-card__body">
                <span className="eyebrow" style={{ color: 'rgba(247,243,234,.7)' }}>
                  Кофе и десерты
                </span>
                <h3 className="duo-card__title">Тот самый кофе, ради которого делают паузу</h3>
                <p className="duo-card__text">Капучино, флэт уайт, раф и матча-латте — с десертом.</p>
                <span className="world-card__link">
                  Смотреть кофе <span>→</span>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Delivery ─────────────────────────────────────── */}
      <section className="section section--dark" id="delivery">
        <div className="container">
          <div className="delivery__grid">
            <div className="reveal">
              <span className="eyebrow">Доставка и самовывоз</span>
              <h2 className="h2">
                Горячий обед — <em>у вашей двери</em>
              </h2>
              <p className="lede" style={{ marginTop: 18 }}>
                Доставляем по Молодогвардейску и ближайшим районам. Заказ можно оформить на сайте или
                по телефону — примем, приготовим и привезём.
              </p>

              <div className="steps">
                <div className="step">
                  <span className="step__num">01</span>
                  <div>
                    <div className="step__title">Выбираете блюда</div>
                    <p className="step__text">Добавляйте в корзину всё меню — от роллов до десертов.</p>
                  </div>
                </div>
                <div className="step">
                  <span className="step__num">02</span>
                  <div>
                    <div className="step__title">Подтверждаете заказ</div>
                    <p className="step__text">
                      Оставляете имя, телефон и адрес. Мы сразу видим заказ на кухне.
                    </p>
                  </div>
                </div>
                <div className="step">
                  <span className="step__num">03</span>
                  <div>
                    <div className="step__title">Готовим и привозим</div>
                    <p className="step__text">
                      Примерно {settings.prepDelivery} минут — и вы следите за статусом в реальном
                      времени.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="delivery-card reveal">
              <div style={{ display: 'grid', gap: 6 }}>
                <span className="eyebrow" style={{ color: 'var(--muted-light)' }}>
                  Условия
                </span>
                <span className="h2" style={{ fontSize: 'clamp(26px,3vw,36px)', marginTop: 0 }}>
                  Доставка по городу
                </span>
              </div>
              <div className="delivery-card__row">
                <span className="delivery-card__label">Бесплатно от</span>
                <span className="delivery-card__value">{formatPrice(settings.freeDeliveryFrom)}</span>
              </div>
              <div className="delivery-card__row">
                <span className="delivery-card__label">Доставка</span>
                <span className="delivery-card__value">{formatPrice(settings.deliveryFee)}</span>
              </div>
              <div className="delivery-card__row">
                <span className="delivery-card__label">Минимальный заказ</span>
                <span className="delivery-card__value">{formatPrice(settings.minOrder)}</span>
              </div>
              <div className="delivery-card__row">
                <span className="delivery-card__label">Время доставки</span>
                <span className="delivery-card__value">{CAFE.delivery.time}</span>
              </div>
              <div className="delivery-card__row">
                <span className="delivery-card__label">Самовывоз</span>
                <span className="delivery-card__value">через {settings.prepPickup} мин · бесплатно</span>
              </div>
              <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
                <span className="delivery-card__label" style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
                  Заказ по телефону
                </span>
                {CAFE.phones.map((phone) => (
                  <a key={phone.tel} className="phone-link" href={`tel:${phone.tel}`}>
                    {phone.display}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contacts ─────────────────────────────────────── */}
      <section className="section contacts" id="contacts">
        <div className="container">
          <div className="contacts__grid">
            <div className="reveal">
              <span className="eyebrow">Контакты</span>
              <h2 className="h2">
                Заходите <em>в гости</em>
              </h2>
              <div className="contact-list">
                <div className="contact-item">
                  <span className="contact-item__label">Адрес</span>
                  <div className="contact-item__value">
                    {CAFE.addressFull}
                    <small>Центр города, рядом с площадью</small>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-item__label">Часы работы</span>
                  <div className="contact-item__value">
                    {CAFE.hours.label}
                    <small>Кухня принимает заказы до {String(settings.closeHour).padStart(2, '0')}:00</small>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-item__label">Телефоны</span>
                  <div className="contact-item__value">
                    {CAFE.phones.map((phone) => (
                      <a key={phone.tel} href={`tel:${phone.tel}`} style={{ display: 'block' }}>
                        {phone.display}
                      </a>
                    ))}
                    <small>Заказ, доставка и бронирование столов</small>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-item__label">Соцсети</span>
                  <div className="contact-item__value">
                    <a href={CAFE.vk} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', textUnderlineOffset: 4 }}>
                      Мы во ВКонтакте
                    </a>
                    <small>Новинки меню, акции и фотографии блюд</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="map-card reveal">
              <div className="map-card__grid" />
              <div className="map-card__pin">
                <span className="map-card__dot" />
                <span className="map-card__label">МОНО</span>
              </div>
              <div className="map-card__body">
                <h3 className="map-card__title">ул. Ленина, 18</h3>
                <p className="map-card__text">Молодогвардейск · 1 этаж · вход с улицы</p>
                <a href={CAFE.mapUrl} target="_blank" rel="noreferrer" className="btn btn--light btn--sm" style={{ justifySelf: 'start' }}>
                  Построить маршрут
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="section--tight section--paper2">
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between', paddingTop: 40, paddingBottom: 40 }}>
          <div className="reveal">
            <span className="eyebrow">Готовы попробовать?</span>
            <h2 className="h2" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
              Мы всегда <em>рады гостям</em>
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} className="reveal">
            <Link href="/menu" className="btn btn--primary">
              Сделать заказ
            </Link>
            <a href={`tel:${CAFE.phones[0].tel}`} className="btn btn--outline">
              {CAFE.phones[0].display}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
