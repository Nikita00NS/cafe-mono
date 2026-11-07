# Фотографии кафе

Все фотографии сайта лежат в двух папках:

- `public/images/` — текущие изображения (часть сгенерирована, часть — ваши);
- `public/photos/` — **ваши фотографии из VK и MAX**. Это папка с приоритетом: если в ней
  есть файл с нужным именем, он автоматически заменяет картинку на сайте.

## Как поставить свои фото за 2 минуты

1. Скопируйте файлы в `public/photos/`.
2. Назовите их по таблице ниже (латиницей, маленькими буквами, через дефис).
3. Пересоберите сайт:
   - для GitHub Pages: `npm run build:static`;
   - для VPS/локально: `npm run build`.
4. Готово — код менять не нужно.

## Имена файлов

| Файл | Где появится |
| --- | --- |
| `hero.jpg` | Главный экран «Три кухни. Одно меню» |
| `japan.jpg` | Карточка «Япония» в разделе «Направления» |
| `italy.jpg` | Карточка «Италия» |
| `europe.jpg` | Карточка «Европа» |
| `breakfast.jpg` | Баннер «Завтраки» |
| `coffee.jpg` | Баннер «Кофе и десерты» |
| `lunch-1.jpg … lunch-5.jpg` | Комплексные обеды и их карточки |
| `jp-spicy-tuna.jpg` | Ролл «Острый с тунцом» |
| `jp-baked-set.jpg` | Сет «Запечённый» |
| `jp-spicy-tuna-set.jpg` | Сет «Острый с тунцом» |
| `jp-philadelphia.jpg`, `jp-california.jpg`, `jp-baked-shrimp.jpg`, `jp-ramen.jpg`, `jp-poke.jpg`, `jp-gedza.jpg`, `jp-miso.jpg` | Японская кухня |
| `it-carbonara.jpg`, `it-salmon-pasta.jpg`, `it-mushroom-tagliatelle.jpg`, `it-margherita.jpg`, `it-pepperoni.jpg`, `it-prosciutto.jpg`, `it-risotto.jpg`, `it-caprese.jpg`, `it-lasagna.jpg` | Итальянская кухня |
| `eu-chicken-grill.jpg`, `eu-turkey.jpg`, `eu-potato.jpg`, `eu-caesar.jpg`, `eu-pumpkin.jpg`, `eu-burger.jpg`, `eu-dorado.jpg` | Европейская кухня |
| `bf-syrniki.jpg`, `bf-omelette.jpg`, `bf-avocado.jpg`, `bf-salmon-sandwich.jpg`, `bf-porridge.jpg`, `bf-pancakes.jpg`, `bf-english.jpg`, `bf-croissant.jpg` | Завтраки |
| `cf-espresso.jpg`, `cf-americano.jpg`, `cf-cappuccino.jpg`, `cf-latte.jpg`, `cf-flatwhite.jpg`, `cf-raf.jpg`, `cf-matcha.jpg`, `cf-cocoa.jpg`, `cf-tea.jpg` | Кофе |
| `ds-cheesecake.jpg`, `ds-tiramisu.jpg`, `ds-honey.jpg`, `ds-mochi.jpg`, `ds-croissant.jpg` | Десерты |

## Требования к фото

- Формат JPEG/PNG/WebP/AVIF, размер по длинной стороне — от 1200 px.
- Горизонтальные фото — для главного экрана и направлений; для блюд подойдут и квадратные.
- Вес одного файла — до 400 КБ (сжать можно на [squoosh.app](https://squoosh.app)).
- Не используйте фото с чужими водяными знаками.

## Как проверить

Откройте сайт: если фото появилось на главной и при клике на блюдо в меню — всё подхватилось.
Плитки без фото показывают фирменную заглушку — это нормально.

> Прямая загрузка с VK/MAX в этом рабочем окружении недоступна (сеть закрыта). Проще всего
> прикрепить фотографии в чат — я разложу их по нужным именам и пересоберу сайт.
