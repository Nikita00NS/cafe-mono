import type { Metadata } from 'next';
import { getSettings } from '@/lib/db';
import { MENU } from '@/lib/menu';
import { getPhotos, withPhotos } from '@/lib/photos';
import { MenuBrowser } from '@/components/MenuBrowser';
import { CAFE } from '@/lib/cafe';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Меню кафе — японская, итальянская и европейская кухня',
  description:
    'Полное меню кафе МОНО: завтраки, роллы и сеты, паста и пицца, блюда на гриле, комплексные обеды за 550 ₽, кофе и десерты. Заказ с доставкой по Молодогвардейску.',
};

export default async function MenuPage() {
  const settings = await getSettings();
  const photos = await getPhotos();
  const menu = withPhotos(MENU, photos);

  return (
    <>
      <section className="page-head">
        <div className="container page-head__inner">
          <span className="eyebrow" style={{ color: 'rgba(247,243,234,.6)' }}>
            Меню · обновляется ежедневно
          </span>
          <h1 className="h1">
            Всё, что мы <em>готовим</em>
          </h1>
          <p className="page-head__lede">
            Три направления в одном меню: Япония, Италия и Европа. Завтраки — до 12:00, комплексные
            обеды — с 12:00 до 16:00 за 550 ₽, кофе — весь день. Добавляйте блюда в заказ: доставка
            или самовывоз из кафе на {CAFE.address}.
          </p>
        </div>
      </section>

      <MenuBrowser items={menu} stopList={settings.stopList} />
    </>
  );
}
