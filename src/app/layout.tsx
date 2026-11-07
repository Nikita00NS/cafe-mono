import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/manrope';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource/cormorant-garamond/cyrillic-400.css';
import '@fontsource/cormorant-garamond/cyrillic-500.css';
import '@fontsource/cormorant-garamond/cyrillic-600.css';
import '@fontsource/cormorant-garamond/cyrillic-400-italic.css';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cafe-mono.ru';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Кафе МОНО — японская, итальянская и европейская кухня в Молодогвардейске',
    template: '%s · Кафе МОНО',
  },
  description:
    'Кафе «МОНО» в Молодогвардейске: японская, итальянская и европейская кухня в одном меню, сытные завтраки, комплексные обеды за 550 ₽, кофе и доставка. ул. Ленина, 18 · +7 (959) 279-98-99',
  keywords: [
    'кафе Молодогвардейск',
    'МОНО кафе',
    'суши Молодогвардейск',
    'пицца Молодогвардейск',
    'бизнес-ланч 550',
    'доставка еды Молодогвардейск',
    'кофе Молодогвардейск',
  ],
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'Кафе МОНО',
    title: 'Кафе МОНО — три кухни, одно меню',
    description:
      'Япония, Италия и Европа в одном меню. Завтраки, комплексные обеды за 550 ₽, кофе и доставка по Молодогвардейску.',
    images: [{ url: '/images/hero-interior.jpg', width: 1200, height: 630, alt: 'Кафе МОНО' }],
  },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  category: 'restaurant',
};

export const viewport: Viewport = {
  themeColor: '#0f0f0d',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
