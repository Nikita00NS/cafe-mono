'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CATEGORIES } from '@/lib/menu';
import type { CategoryId, MenuItem } from '@/lib/types';
import { AddToCartButton } from './AddToCartButton';
import { DishModal, type ModalDish } from './DishModal';
import { formatPrice } from '@/lib/format';
import { asset } from '@/lib/asset';

export function MenuPreview({ items, stopList }: { items: MenuItem[]; stopList: string[] }) {
  const [active, setActive] = useState<CategoryId>('japanese');
  const [selected, setSelected] = useState<ModalDish | null>(null);
  const dishes = items.filter((item) => item.category === active).slice(0, 6);

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
      <div className="tabs" role="tablist" aria-label="Категории меню">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={active === category.id}
            className={`tab${active === category.id ? ' is-active' : ''}`}
            onClick={() => setActive(category.id)}
          >
            {category.title}
          </button>
        ))}
      </div>

      <div className="dish-grid">
        {dishes.map((dish) => {
          const stopped = stopList.includes(dish.id);
          return (
            <article
              className={`dish dish--clickable${stopped ? ' is-stopped' : ''}`}
              key={dish.id}
              role="button"
              tabIndex={0}
              aria-label={`${dish.name} — подробнее`}
              onClick={() => openDish(dish)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openDish(dish);
                }
              }}
            >
              <div className={`dish__media${dish.image ? '' : ' dish__media--typographic'}`}>
                {dish.image ? (
                  <img src={asset(dish.image)} alt={dish.name} loading="lazy" />
                ) : (
                  <>
                    <span>{dish.name.slice(0, 1)}</span>
                    <small>МОНО</small>
                  </>
                )}
                {dish.badge && <span className="badge badge--shu">{dish.badge}</span>}
                <span className="dish__more">Фото и описание</span>
              </div>
              <div className="dish__body">
                <h3 className="dish__name">{dish.name}</h3>
                <p className="dish__desc">{dish.description}</p>
                <div className="dish__meta">
                  {dish.weight && <span className="tag">{dish.weight}</span>}
                  {dish.tags?.map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="dish__foot">
                  <span className="dish__price">{formatPrice(dish.price)}</span>
                  <AddToCartButton
                    id={dish.id}
                    name={dish.name}
                    price={dish.price}
                    image={dish.image}
                    disabled={stopped}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="menu-more">
        <Link href="/menu" className="btn btn--outline">
          Всё меню — {items.length} позиций
        </Link>
      </div>

      <DishModal dish={selected} onClose={() => setSelected(null)} />
    </>
  );
}
