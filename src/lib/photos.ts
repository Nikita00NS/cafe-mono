import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Фотографии кафе.
 *
 * Достаточно положить файлы в `public/photos/` с нужными именами — сайт подхватит их
 * автоматически, без правки кода:
 *
 *   hero.jpg            — главный экран «Три кухни. Одно меню»
 *   japan.jpg           — карточка «Япония» (направления)
 *   italy.jpg           — карточка «Италия»
 *   europe.jpg          — карточка «Европа»
 *   breakfast.jpg       — баннер «Завтраки»
 *   coffee.jpg          — баннер «Кофе и десерты»
 *   <id блюда>.jpg      — фото конкретного блюда в меню, например jp-ramen.jpg,
 *                         cf-cappuccino.jpg, it-carbonara.jpg, lunch-1.jpg
 *
 * Полный список id — в `src/lib/menu.ts` (поле id) или в PHOTOS.md.
 * Поддерживаются .jpg, .jpeg, .png, .webp, .avif.
 */

const PHOTOS_DIR = path.join(process.cwd(), 'public', 'photos');
const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;

export type PhotoMap = Record<string, string>;

export async function getPhotos(): Promise<PhotoMap> {
  try {
    const files = await fs.readdir(PHOTOS_DIR);
    const map: PhotoMap = {};
    for (const file of files.sort()) {
      if (!IMAGE_EXT.test(file)) continue;
      const key = file.replace(IMAGE_EXT, '').toLowerCase().replace(/[\s_]+/g, '-');
      if (!map[key]) map[key] = `/photos/${encodeURIComponent(file)}`;
    }
    return map;
  } catch {
    return {};
  }
}

export function photoOr(photos: PhotoMap, key: string, fallback: string) {
  return photos[key] ?? fallback;
}

export function withPhotos<T extends { id: string; image?: string }>(items: T[], photos: PhotoMap): T[] {
  return items.map((item) => (photos[item.id] ? { ...item, image: photos[item.id] } : item));
}
