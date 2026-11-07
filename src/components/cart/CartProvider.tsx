'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  notify: (message: string) => void;
  toast: string | null;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'mono-cart-v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          setItems(
            parsed
              .filter((item) => item && typeof item.id === 'string' && Number(item.qty) > 0)
              .map((item) => ({
                id: item.id,
                name: String(item.name),
                price: Number(item.price) || 0,
                qty: Math.max(1, Math.min(30, Number(item.qty) || 1)),
                image: item.image,
              })),
          );
        }
      }
    } catch {
      /* игнорируем битые данные */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* приватный режим */
    }
  }, [items, ready]);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', isOpen);
    return () => document.body.classList.remove('no-scroll');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const add = useCallback<CartContextValue['add']>((item, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, qty: Math.min(30, entry.qty + qty) }
            : entry,
        );
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const setQty = useCallback<CartContextValue['setQty']>((id, qty) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((item) => item.id !== id)
        : prev.map((item) => (item.id === id ? { ...item, qty: Math.min(30, qty) } : item)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.qty, 0),
      subtotal: items.reduce((sum, item) => sum + item.price * item.qty, 0),
      add,
      setQty,
      remove,
      clear,
      isOpen,
      openCart,
      closeCart,
      notify,
      toast,
    }),
    [items, add, setQty, remove, clear, isOpen, openCart, closeCart, notify, toast],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart должен использоваться внутри CartProvider');
  return context;
}
