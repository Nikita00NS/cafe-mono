'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, LUNCHES } from '@/lib/menu';
import type { CategoryId, MenuItem } from '@/lib/types';
import { AddToCartButton } from './AddToCartButton';
import { DishModal, type ModalDish } from './DishModal';
import { formatPrice } from '@/lib/format';

export function MenuBrowser({ items, stopList }: { items: MenuItem[]; stopList: string[] }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<CategoryId | null>(CATEGORIES[0].id);
  const [selected, setSelected] = useState<ModalDish | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [items, query]);

  useEffect(() => {
    if (query.trim()) return;
    const sections = CATEGORIES.map((category) => sectionRefs.current[category.id]).filter(
      Boolean,
    ) as HTMLElement[];
    if (!sections.length || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target instanceof HTMLElement) {
          const id = visible.target.dataset.category as CategoryId | undefined;
          if (id) setActive(id);
        }
      },
      { rootMargin: '-170px 0px -55% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [query]);

  const searching = query.trim().length > 0;

  const openDish = (dish: MenuItem) =>
    setSelected({
      id: dish.id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      image: dish.image,
      weight: dish.weight,
      tags: dish.tags,
      badge: dish.badge,
      stopped: stopList.includes(dish.id),
    });

  return (
    <>
      <div className="menu-nav">
        <div className="container menu-nav__inner">
          {CATEGORIES.map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className={!searching && active === category.id ? 'is-active' : ''}
              onClick={() => setActive(category.id)}
            >
              {category.title}
            </a>
          ))}
          <label className="menu-search">
            <span aria-hidden="true" style={{ color: 'var(--muted)' }}>
              ⌕
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти блюдо"
              aria-label="Поиск по меню"
            />
          </label>
        </div>
      </div>

      <div className="container">
        {!searching && (
          <section className="menu-category" id="lunches-menu">
            <div className="menu-category__head">
              <h2 className="menu-category__title">
                Комплексные обеды <span>550 ₽ · 12:00–16:00</span>
              </h2>
            </div>
            <div className="menu-list">
              {LUNCHES.map((lunch) => (
                <div
                  className="menu-row menu-row--clickable"
                  key={lunch.id}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setSelected({
                      id: lunch.id,
                      name: `Обед «${lunch.title}»`,
                      description: 'Комплексный обед: суп, горячее и салат. Хлеб входит в стоимость.',
                      price: lunch.price,
                      details: lunch.composition,
                      tags: lunch.note ? [lunch.note] : undefined,
                      stopped: stopList.includes(lunch.id),
                    })
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      (event.currentTarget as HTMLElement).click();
                    }
                  }}
                >
                  <div>
                    <div className="menu-row__name">
                      Обед «{lunch.title}»
                      {lunch.note && <span className="tag">{lunch.note}</span>}
                      <span className="menu-row__peek">состав</span>
                    </div>
                    <p className="menu-row__desc">{lunch.composition.join(' · ')}</p>
                  </div>
                  <div className="menu-row__right">
                    <span className="menu-row__price">{formatPrice(lunch.price)}</span>
                    <AddToCartButton
                      id={lunch.id}
                      name={`Обед «${lunch.title}»`}
                      price={lunch.price}
                      disabled={stopList.includes(lunch.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {CATEGORIES.map((category) => {
          const dishes = filtered.filter((item) => item.category === category.id);
          if (!dishes.length) return null;
          return (
            <section
              className="menu-category"
              id={category.id}
              key={category.id}
              data-category={category.id}
              ref={(node) => {
                sectionRefs.current[category.id] = node;
              }}
            >
              <div className="menu-category__head">
                <h2 className="menu-category__title">
                  {category.title} <span>{category.subtitle}</span>
                </h2>
                <span className="pill">{dishes.length} позиций</span>
              </div>
              <div className="menu-list">
                {dishes.map((dish) => {
                  const stopped = stopList.includes(dish.id);
                  return (
                    <div
                      className={`menu-row menu-row--clickable${stopped ? ' is-stopped' : ''}`}
                      key={dish.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${dish.name} — фото и описание`}
                      onClick={() => openDish(dish)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openDish(dish);
                        }
                      }}
                    >
                      <div>
                        <div className="menu-row__name">
                          {dish.name}
                          {dish.badge && <span className="tag">{dish.badge}</span>}
                          {dish.tags?.map((tag) => (
                            <span className="tag" key={tag}>
                              {tag}
                            </span>
                          ))}
                          <span className="menu-row__peek">фото</span>
                        </div>
                        <p className="menu-row__desc">{dish.description}</p>
                      </div>
                      <div className="menu-row__right">
                        {dish.weight && <span className="menu-row__weight">{dish.weight}</span>}
                        <span className="menu-row__price">{formatPrice(dish.price)}</span>
                        <AddToCartButton
                          id={dish.id}
                          name={dish.name}
                          price={dish.price}
                          image={dish.image}
                          disabled={stopped}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {searching && filtered.length === 0 && (
          <div className="empty" style={{ padding: '80px 0' }}>
            <div className="empty__mark">?</div>
            <p className="empty__text">
              По запросу «{query}» ничего не нашлось. Попробуйте другое слово или посмотрите всё меню.
            </p>
          </div>
        )}
      </div>

      <DishModal dish={selected} onClose={() => setSelected(null)} />
    </>
  );
}
