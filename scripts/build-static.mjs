#!/usr/bin/env node
/**
 * Сборка статической версии сайта для GitHub Pages.
 *
 * Что делает:
 *  1. копирует исходники в служебный каталог .static-app;
 *  2. убирает серверные части (API заказов, админку, страницу трекинга) —
 *     GitHub Pages умеет отдавать только статические файлы;
 *  3. собирает Next.js с output: 'export' и нужным basePath;
 *  4. кладёт готовые файлы в docs/ — именно эту папку отдаёт GitHub Pages.
 *
 * Запуск:
 *   npm run build:static                      → https://<user>.github.io/cafe-mono/
 *   NEXT_PUBLIC_BASE_PATH= npm run build:static → для своего домена (корень)
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const appDir = path.join(root, '.static-app');
const outDir = path.join(root, 'docs');
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/cafe-mono';

const SERVER_ONLY = [
  'src/app/api',
  'src/app/(site)/order',
];

async function rm(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function patchFile(rel, transform) {
  const file = path.join(appDir, rel);
  const before = await fs.readFile(file, 'utf8');
  const after = transform(before);
  if (after === before) {
    throw new Error(`Не удалось преобразовать ${rel} — изменился формат файла`);
  }
  await fs.writeFile(file, after);
}

console.log('▸ Готовлю статическую сборку…');
await rm(appDir);
await rm(outDir);
await fs.mkdir(appDir, { recursive: true });

await fs.cp(path.join(root, 'src'), path.join(appDir, 'src'), { recursive: true });
await fs.cp(path.join(root, 'public'), path.join(appDir, 'public'), { recursive: true });
await fs.copyFile(path.join(root, 'tsconfig.json'), path.join(appDir, 'tsconfig.json'));

for (const rel of SERVER_ONLY) {
  await rm(path.join(appDir, rel));
  console.log(`  · убрано: ${rel}`);
}

// Админка в статике работает в демо-режиме: без cookies и серверных API,
// заказы и настройки хранятся в localStorage браузера.
await fs.writeFile(
  path.join(appDir, 'src/app/admin/page.tsx'),
  `import type { Metadata } from 'next';
import { AdminApp } from '@/components/AdminApp';

export const metadata: Metadata = {
  title: 'Панель заказов · демо',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}
`,
);
await fs.writeFile(
  path.join(appDir, 'src/app/admin/login/page.tsx'),
  `import type { Metadata } from 'next';
import { AdminLoginForm } from '@/components/AdminLoginForm';

export const metadata: Metadata = {
  title: 'Вход в панель · демо',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
`,
);
console.log('  · админка: демо-режим (localStorage)');

for (const rel of ['src/app/(site)/page.tsx', 'src/app/(site)/menu/page.tsx']) {
  await patchFile(rel, (source) =>
    source.replace(/\nexport const dynamic = 'force-dynamic';/g, ''),
  );
  console.log(`  · статический рендер: ${rel}`);
}

await fs.writeFile(
  path.join(appDir, 'next.config.mjs'),
  `/** Сгенерировано scripts/build-static.mjs */
const nextConfig = {
  output: 'export',
  basePath: ${JSON.stringify(basePath)},
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};
export default nextConfig;
`,
);

console.log(`▸ Сборка (basePath: ${basePath || 'корень'})…`);
execFileSync(process.execPath, [nextBin, 'build'], {
  cwd: appDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    NEXT_PUBLIC_STATIC_SITE: '1',
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
});

console.log('▸ Копирую результат в docs/…');
await fs.cp(path.join(appDir, 'out'), outDir, { recursive: true });
await fs.writeFile(path.join(outDir, '.nojekyll'), '');
await rm(appDir);

console.log(`
✓ Готово. Статический сайт лежит в docs/

  GitHub Pages: Settings → Pages → Source: Deploy from a branch
                Branch: main (или текущая ветка) · Folder: /docs

  Адрес: https://<username>.github.io/<repo>/
  Свой домен: пересоберите с NEXT_PUBLIC_BASE_PATH= (пустое значение).
`);
