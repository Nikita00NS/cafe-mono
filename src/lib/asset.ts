/**
 * Префикс для статических файлов.
 *
 * На обычном сервере (VPS/Docker/локально) BASE_PATH пустой и пути остаются «/images/...».
 * Для GitHub Pages проект живёт по адресу https://<user>.github.io/<repo>/,
 * поэтому при сборке статической версии задаётся NEXT_PUBLIC_BASE_PATH=/cafe-mono.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function asset(path: string) {
  if (!path) return path;
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
  return `${BASE_PATH}${path}`;
}

export const STATIC_SITE = process.env.NEXT_PUBLIC_STATIC_SITE === '1';
