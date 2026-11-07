'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from './cart/CartProvider';
import { CAFE } from '@/lib/cafe';

const LINKS = [
  { href: '/#lunches', label: 'Обеды' },
  { href: '/menu', label: 'Меню' },
  { href: '/#delivery', label: 'Доставка' },
  { href: '/#contacts', label: 'Контакты' },
];

export function SiteHeader() {
  const { count, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className={`header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="container header__inner">
          <Link href="/" className="brand" aria-label="Кафе МОНО — на главную">
            <span className="brand__mark">МОНО</span>
            <span className="brand__sub">cafe · kitchen</span>
          </Link>

          <nav className="nav" aria-label="Основная навигация">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="header__actions">
            <a className="header__phone" href={`tel:${CAFE.phones[0].tel}`}>
              {CAFE.phones[0].display}
            </a>
            <button type="button" className="cart-btn" onClick={openCart} aria-label="Открыть корзину">
              <span className="cart-btn__label">Заказ</span>
              <span className="cart-btn__count">{count}</span>
            </button>
            <button
              type="button"
              className="burger"
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
                <path d="M0 1h18M0 6h18M0 11h18" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-menu${menuOpen ? ' is-open' : ''}`}>
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
            {link.label}
          </Link>
        ))}
        <div className="mobile-menu__phones">
          {CAFE.phones.map((phone) => (
            <a key={phone.tel} href={`tel:${phone.tel}`}>
              {phone.display}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
