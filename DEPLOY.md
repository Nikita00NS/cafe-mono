# Как выпустить сайт кафе «МОНО»

В проекте две сборки:

| Сборка | Где живёт | Что работает |
| --- | --- | --- |
| **Статическая** — `npm run build:static` → папка `docs/` | GitHub Pages (бесплатно) | Главная, меню, обеды, сеты, контакты, корзина-«список», звонок в кафе |
| **Полная** — `npm run build` + `npm start` | VPS / Docker | Всё выше + онлайн-заказ, трекинг, админка, стоп-лист, таймеры |

Главная и меню в статической версии выглядят и работают точно так же, как на сервере. Отличается только оформление заказа: на Pages нет бэкенда, поэтому корзина превращается в список блюд с кнопками «Позвонить» — гость называет состав по телефону.

---

## 1. GitHub Pages: исправляем ошибку с доменом

> **The custom domain `cafe-mono` is not properly formatted**

Причина: в **Settings → Pages → Custom domain** вписано имя репозитория (`cafe-mono`). GitHub ждёт в этом поле **доменное имя с точкой**, которое вам принадлежит, — например `cafe-mono.ru`. Слово без домена он считает ошибкой.

**Что сделать (30 секунд):**

1. Откройте репозиторий → **Settings** (вкладка сверху) → **Pages**.
2. В блоке **Custom domain** удалите текст `cafe-mono`, оставьте поле **пустым**.
3. Нажмите **Save**. Ошибка исчезнет.
4. Если ниже есть кнопка **Unpublish site** или переключатель источника — ничего не трогайте, переходите к шагу 2.

Поле Custom domain нужно только если у вас есть свой домен (раздел 2). Для бесплатного адреса `https://<логин>.github.io/cafe-mono/` оно должно быть пустым.

> **Важно:** источник сайта — папка `docs/` в ветке, а не «GitHub Actions». Если выбрать Actions, GitHub будет искать workflow, которого нет, и сайт не соберётся.

---

## 2. Публикация на GitHub Pages (пошагово)

Статическая сборка уже лежит в репозитории в папке `docs/`, поэтому публиковать можно сразу.

1. **Settings → Pages**.
2. **Build and deployment → Source**: `Deploy from a branch`.
3. **Branch**: выберите ветку с сайтом — `arena/94f631fc-cafe-mono` (или `main`, если ветка уже смержена), **Folder**: `/docs`.
4. **Save**.
5. Подождите 1–3 минуты и обновите страницу — сверху появится ссылка:
   **`https://nikita00ns.github.io/cafe-mono/`**

Если открывается 404:

- проверьте, что выбрана именно папка `/docs`, а не `/ (root)`;
- откройте `https://nikita00ns.github.io/cafe-mono/index.html` — если так работает, значит Pages ещё не догнал сборку, подождите пару минут;
- убедитесь, что в репозитории есть файл `docs/.nojekyll` (он там есть — он отключает обработку Jekyll и сохраняет папку `_next`).

### Как обновлять сайт на Pages

```bash
# правите меню/цены/тексты в src/lib/menu.ts или src/app/(site)/page.tsx
npm run build:static      # пересобирает папку docs/
git add docs && git commit -m "Обновил меню" && git push
```

Через минуту изменения появятся на сайте.

### Чего на GitHub Pages не будет

| Возможность | Pages | Полная версия (VPS) |
| --- | --- | --- |
| Главная, меню, обеды, контакты | ✅ | ✅ |
| Корзина с суммой заказа | ✅ (как список) | ✅ |
| Оформление заказа на сайте | ❌ только звонок | ✅ |
| Страница отслеживания `/order/…` | ❌ | ✅ |
| Админка `/admin`, таймеры, стоп-лист | ❌ | ✅ |

Это ограничение самого GitHub Pages: он отдаёт только файлы, без сервера и базы данных. Полная версия — в разделе 4.

---

## 3. Свой домен на GitHub Pages

1. Купите домен (`cafe-mono.ru`) у регистратора.
2. В DNS-панели домена:

   ```
   A      @      185.199.108.153
   A      @      185.199.109.153
   A      @      185.199.110.153
   A      @      185.199.111.153
   CNAME  www    nikita00ns.github.io
   ```

3. Пересоберите статическую версию **без префикса пути** (свой домен отдаёт сайт из корня):

   ```bash
   NEXT_PUBLIC_BASE_PATH= npm run build:static
   git add docs && git commit -m "Сборка под свой домен" && git push
   ```

4. **Settings → Pages → Custom domain** → впишите `cafe-mono.ru` → **Save** (галочка DNS-check может занять до часа).
5. Дождитесь сертификата и включите **Enforce HTTPS**.

---

## 4. Полная версия: VPS (заказы + админка)

Нужна, если хотите принимать заказы на сайте. Требования: VPS 1–2 vCPU, 2 ГБ RAM, Ubuntu 22.04/24.04 (~250–700 ₽/мес) и домен.

### 4.1 Установка

```bash
ssh root@<IP_сервера>

apt update && apt upgrade -y
apt install -y curl git nginx ufw

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm i -g pm2

adduser --disabled-password --gecos "" mono
usermod -aG www-data mono
su - mono

git clone https://github.com/Nikita00NS/cafe-mono.git
cd cafe-mono && npm ci

cp .env.example .env.local
nano .env.local
```

Содержимое `.env.local`:

```env
ADMIN_PASSWORD=ваш-надёжный-пароль
ADMIN_SECRET=длинная-случайная-строка-минимум-32-символа
NEXT_PUBLIC_SITE_URL=https://cafe-mono.ru
```

Секрет: `openssl rand -hex 32`.

```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
exit
```

Автозапуск после перезагрузки (от root):

```bash
pm2 startup systemd -u mono --hp /home/mono   # выполните выведенную команду
```

### 4.2 Nginx и HTTPS

```bash
cp /home/mono/cafe-mono/deploy/nginx.conf.example /etc/nginx/sites-available/cafe-mono
nano /etc/nginx/sites-available/cafe-mono    # замените cafe-mono.ru на свой домен
ln -s /etc/nginx/sites-available/cafe-mono /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

apt install -y certbot python3-certbot-nginx
certbot --nginx -d cafe-mono.ru -d www.cafe-mono.ru

ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable
```

DNS для VPS: `A @ → IP сервера` и `A www → IP сервера`.

Проверка: `https://cafe-mono.ru` — сайт, `https://cafe-mono.ru/admin` — панель (пароль из `ADMIN_PASSWORD`).

### 4.3 Обновление

```bash
su - mono && cd ~/cafe-mono
git pull && npm ci && npm run build && pm2 restart mono
```

### 4.4 Резервные копии заказов

Заказы хранятся в `data/db.json`. Ежедневная копия:

```bash
mkdir -p /var/backups/mono
crontab -e
# добавить строку:
15 3 * * * cp /home/mono/cafe-mono/data/db.json /var/backups/mono/db-$(date +\%F).json
```

---

## 5. Docker (альтернатива pm2)

```bash
cp .env.example .env.local     # заполните пароль и домен
docker compose up -d --build
```

Заказы сохраняются в `./data` на хосте. Nginx и HTTPS — как в разделе 4.2, только без pm2.

---

## 6. Vercel / Render / Railway

Сайт задеплоится из GitHub в пару кликов, но файловая система там только для чтения — заказы не сохранятся. Варианты:

- подключить Postgres (Supabase/Neon) и переписать `src/lib/db.ts` — интерфейс изолирован, страницы менять не нужно;
- либо взять хостинг с постоянным диском (Render Disk, Railway Volume) и смонтировать том в `/app/data`.

До этого сайт работает как демо: заказы принимаются, но после перезапуска контейнера могут исчезнуть.

---

## 7. Чек-лист перед запуском

- [ ] `ADMIN_PASSWORD` изменён с `mono2026` на свой
- [ ] `ADMIN_SECRET` — случайная строка ≥ 32 символов
- [ ] `NEXT_PUBLIC_SITE_URL` = ваш домен с `https://`
- [ ] HTTPS работает, `http://` перенаправляется на `https://`
- [ ] Цены, состав и фото заменены на реальные (`src/lib/menu.ts`, `public/images/`)
- [ ] Тестовый заказ с телефона + проверка админки и звука
- [ ] Настроены резервные копии `data/db.json`
- [ ] Часы работы и условия доставки проверены в `/admin → Настройки`
- [ ] Ссылка на сайт добавлена во ВКонтакте, Яндекс.Карты и 2ГИС

---

## 8. Если что-то не работает

| Симптом | Решение |
| --- | --- |
| `The custom domain ... is not properly formatted` | Очистить поле Custom domain в Settings → Pages (раздел 1) |
| Pages отдаёт 404 | Source = `Deploy from a branch`, Folder = `/docs`; проверить наличие `docs/index.html` |
| На Pages нет стилей / битые ссылки на картинки | Сборка сделана с неверным `NEXT_PUBLIC_BASE_PATH`: для `github.io/<repo>/` он должен быть `/<repo>`, для своего домена — пустым |
| `502 Bad Gateway` на VPS | Приложение не запущено: `pm2 status`, `pm2 logs mono` |
| `EADDRINUSE :3000` | `lsof -i :3000` и завершить старый процесс либо `pm2 restart mono` |
| Заказ не оформляется на VPS | `pm2 logs mono`; права на `data/`: `chown -R mono:mono ~/cafe-mono/data` |
| Не пускает в `/admin` | Неверный пароль / не задан `ADMIN_PASSWORD`; после правки: `pm2 restart mono --update-env` |
| Сборка падает с `heap out of memory` | Добавить swap: `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile` |
| Ссылки и OG-картинки ведут на localhost | Указать `NEXT_PUBLIC_SITE_URL=https://ваш-домен` и пересобрать |
