import type { ReactNode } from 'react';
import { CartProvider } from '@/components/cart/CartProvider';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CartDrawer } from '@/components/CartDrawer';
import { Toast } from '@/components/Toast';
import { RevealObserver } from '@/components/RevealObserver';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <a className="skip-link" href="#content">
        Перейти к содержимому
      </a>
      <SiteHeader />
      <main id="content">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <Toast />
      <RevealObserver />
    </CartProvider>
  );
}
