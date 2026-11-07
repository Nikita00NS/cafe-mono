'use client';

import { useEffect } from 'react';
import { AddToCartButton } from './AddToCartButton';
import { asset } from '@/lib/asset';
import { formatPrice } from '@/lib/format';

export type ModalDish = {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  weight?: string;
  tags?: string[];
  badge?: string;
  details?: string[];
  stopped?: boolean;
};

export function DishModal({ dish, onClose }: { dish: ModalDish | null; onClose: () => void }) {
  useEffect(() => {
    if (!dish) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, [dish, onClose]);

  if (!dish) return null;

  return (
    <div
      className="dish-modal"
      role="dialog"
      aria-modal="true"
      aria-label={dish.name}
      onClick={onClose}
    >
      <div className="dish-modal__card" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="dish-modal__close" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>

        <div className="dish-modal__media">
          {dish.image ? (
            <img src={asset(dish.image)} alt={dish.name} />
          ) : (
            <div className="dish-modal__placeholder">
              <span>МОНО</span>
              <small>{dish.name}</small>
            </div>
          )}
          {dish.badge && <span className="badge badge--shu">{dish.badge}</span>}
        </div>

        <div className="dish-modal__body">
          <div className="dish-modal__meta">
            {dish.weight && <span className="tag">{dish.weight}</span>}
            {dish.tags?.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
            {dish.stopped && <span className="tag" style={{ color: 'var(--shu)', borderColor: 'rgba(184,69,47,.4)' }}>нет в наличии</span>}
          </div>

          <h3 className="dish-modal__title">{dish.name}</h3>
          <p className="dish-modal__desc">{dish.description}</p>

          {dish.details && dish.details.length > 0 && (
            <ul className="dish-modal__list">
              {dish.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}

          <div className="dish-modal__foot">
            <span className="dish-modal__price">{formatPrice(dish.price)}</span>
            <AddToCartButton
              id={dish.id}
              name={dish.name}
              price={dish.price}
              image={dish.image}
              label="В заказ"
              className="btn btn--primary btn--sm"
              disabled={dish.stopped}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
