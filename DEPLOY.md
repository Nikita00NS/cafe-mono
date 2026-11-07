# Деплой сайта кафе «МОНО»

## 0. Сначала про ошибку GitHub Pages

> **The custom domain `pagesmono` is not properly formatted**

Эта ошибка не связана с сайтом. GitHub просит в поле **Settings → Pages → Custom domain** настоящее доменное имя, а `pagesmono` — просто слово. Домен должен содержать точку и принадлежать вам, например `cafe-mono.ru` или `www.cafe-mono.ru`.

**Что сделать прямо сейчас:**

1. Откройте репозиторий → **Settings → Pages**.
2. В поле **Custom domain** удалите `pagesmono` и нажмите **Save** (если поле пустое — Pages будет отдавать сайт по адресу `https://nikita00ns.github.io/cafe-mono/`). Либо впишите реальный домен, который вы купили, — но только после настройки DNS (шаг 2 ниже).
3. Если домен уже куплен — в панели регистратора добавьте:
   - `A` записи для `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` для `www` → `nikita00ns.github.io`
   Через 15–60 минут нажмите **Check again** и включите **Enforce HTTPS**.

### ⚠️ Важно: этот сайт нельзя разместить на GitHub Pages

GitHub Pages умеет отдавать **только статические файлы**. Нашему сайту нужен Node.js-сервер, потому что в нём есть:

- API-маршруты (`/api/orders`, `/api/admin/...`) — приём и обработка заказов;
- серверный рендеринг и чтение/запись базы заказов (`data/db.json`);
- авторизация администратора и панель `/admin`.

Если выложить сайт на GitHub Pages, откроется вёрстка, но кнопка «Оформить заказ» и админка работать не будут. Поэтому ниже — два рабочих варианта: **VPS (рекомендуется)** и **Vercel/Render**.

GitHub Pages можно оставить только как заглушку или витрину, но лучше просто выключить.

---

## 1. Что понадобится

| Что | Зачем | Порядок цен |
| --- | --- | --- |
| Домен (`cafe-mono.ru`) | Адрес сайта, визитки, реклама | ~200–900 ₽/год |
| VPS: 1–2 vCPU, 2 ГБ RAM, 20 ГБ SSD, Ubuntu 22.04/24.04 | Сервер под сайт и админку | ~250–700 ₽/мес |
| Доступ по SSH | Настройка | — |

Подойдут любые VPS-провайдеры, работающие в РФ (Timeweb Cloud, Beget, reg.ru, Selectel, Aeza и т. п.). Регион сервера — Россия, чтобы сайт открывался быстро.

---

## 2. Настройка домена (DNS)

В панели регистратора домена:

```
A      @      <IP вашего сервера>
A      www    <IP вашего сервера>
```

Проверка (с вашего компьютера):

```bash
nslookup cafe-mono.ru
```

DNS обновляется от 5 минут до нескольких часов.

---

## 3. Установка сервера (Ubuntu 22.04 / 24.04)

```bash
ssh root@<IP_сервера>

apt update && apt upgrade -y
apt install -y curl git nginx ufw

# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm i -g pm2

# отдельный пользователь для сайта (не работаем под root)
adduser --disabled-password --gecos "" mono
usermod -aG www-data mono
```

### Код и сборка

```bash
su - mono
git clone https://github.com/Nikita00NS/cafe-mono.git
cd cafe-mono
npm ci

cp .env.example .env.local
nano .env.local
```

Заполните `.env.local`:

```env
ADMIN_PASSWORD=ваш-надёжный-пароль
ADMIN_SECRET=длинная-случайная-строка-минимум-32-символа
NEXT_PUBLIC_SITE_URL=https://cafe-mono.ru
```

Секрет можно сгенерировать так: `openssl rand -hex 32`.

Сборка и запуск:

```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
exit
```

Автозапуск после перезагрузки сервера (от root):

```bash
pm2 startup systemd -u mono --hp /home/mono
```

Команда выведет строку — выполните её, затем `pm2 save` от пользователя `mono`.

Проверка, что приложение поднялось:

```bash
curl -I http://127.0.0.1:3000        # ожидаем 200
curl http://127.0.0.1:3000/api/state # ожидаем JSON
```

---

## 4. Nginx + HTTPS

```bash
cp /home/mono/cafe-mono/deploy/nginx.conf.example /etc/nginx/sites-available/cafe-mono
nano /etc/nginx/sites-available/cafe-mono   # замените cafe-mono.ru на ваш домен
ln -s /etc/nginx/sites-available/cafe-mono /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

Сертификат Let's Encrypt:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d cafe-mono.ru -d www.cafe-mono.ru
```

Certbot сам настроит редирект на HTTPS и продление.

Файрвол:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

Откройте `https://cafe-mono.ru` — сайт должен работать. Админка: `https://cafe-mono.ru/admin`.

---

## 5. Обновление сайта после правок

```bash
su - mono
cd ~/cafe-mono
git pull
npm ci
npm run build
pm2 restart mono
```

Проверьте `/admin` и сделайте тестовый заказ.

---

## 6. Резервные копии заказов

Все заказы и настройки хранятся в `data/db.json`. Копия раз в сутки:

```bash
mkdir -p /var/backups/mono
crontab -e
```

Добавьте строку (от пользователя `mono`):

```
15 3 * * * cp /home/mono/cafe-mono/data/db.json /var/backups/mono/db-$(date +\%F).json
```

Раз в неделю скачивайте копии к себе:

```bash
scp mono@<IP>:/var/backups/mono/*.json ./
```

---

## 7. Вариант без VPS: Vercel / Render / Railway

Быстро и бесплатно на старте, но есть нюанс: **файловая система там только для чтения**, поэтому заказы не сохранятся.

1. Загрузите код в GitHub (уже сделано).
2. На [vercel.com](https://vercel.com) → **Add New → Project** → выберите репозиторий `cafe-mono`.
3. Framework: Next.js (определится сам). Добавьте переменные окружения `ADMIN_PASSWORD`, `ADMIN_SECRET`, `NEXT_PUBLIC_SITE_URL`.
4. Deploy.
5. Чтобы заработала админка с заказами, нужно заменить хранилище:
   - подключить Postgres (Supabase/Neon) и переписать `src/lib/db.ts` под него — интерфейс уже изолирован, страницы менять не нужно;
   - либо взять хостинг с постоянным диском (Render/Railway) и смонтировать том в `/app/data`.

До этого шага сайт будет работать в демо-режиме: заказы принимаются, но после перезапуска контейнера могут исчезнуть.

---

## 8. Docker (если удобнее)

```bash
cp .env.example .env.local      # заполните пароль и домен
docker compose up -d --build
```

Заказы сохраняются в каталоге `./data` на хосте (том в `docker-compose.yml`). Перед этим установите Docker и Nginx по шагам 3–4 (только без pm2).

---

## 9. Чек-лист перед запуском

- [ ] `ADMIN_PASSWORD` изменён с `mono2026` на свой
- [ ] `ADMIN_SECRET` — случайная строка ≥ 32 символов
- [ ] `NEXT_PUBLIC_SITE_URL` = ваш домен с `https://`
- [ ] HTTPS работает, `http://` перенаправляется на `https://`
- [ ] Цены, состав и фото заменены на реальные (`src/lib/menu.ts`, `public/images/`)
- [ ] Сделан тестовый заказ с телефона, проверили админку и звук
- [ ] Настроены резервные копии `data/db.json`
- [ ] Часы работы и условия доставки проверены в `/admin → Настройки`
- [ ] Ссылка на сайт добавлена во ВКонтакте и в карточки Яндекс.Карт / 2ГИС

---

## 10. Если что-то не работает

| Симптом | Причина / решение |
| --- | --- |
| `502 Bad Gateway` | Приложение не запущено: `pm2 status`, `pm2 logs mono` |
| `EADDRINUSE :3000` | Порт занят: `lsof -i :3000`, завершите старый процесс или `pm2 restart mono` |
| Сайт открывается, заказ не оформляется | Проверьте `pm2 logs mono` и права на каталог `data/`: `chown -R mono:mono /home/mono/cafe-mono/data` |
| Не пускает в `/admin` | Неверный пароль или не задан `ADMIN_PASSWORD` в `.env.local`; после правки — `pm2 restart mono --update-env` |
| Сборка падает с `JavaScript heap out of memory` | Добавьте swap: `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile` |
| Ссылки и OG-картинки ведут на localhost | В `.env.local` укажите `NEXT_PUBLIC_SITE_URL=https://ваш-домен` и пересоберите |
