# Родословная вашей семьи

Интерактивный альбом-книга о генеалогии **вашей семьи** на Next.js. Не привязан к одной фамилии: в одном конфиге задаёте фамилию «хозяина» альбома — заголовок и описание подставляются во всех языках. Пользователь листает развороты, переходит по главам и на карточки персон из древа или с интерактивных фото.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)
![Vitest](https://img.shields.io/badge/Vitest-4-yellow)

## Возможности

- **Титульный разворот** — название семьи, обложка, оглавление глав
- **Семейное древо** — до 6 уровней (от «я» до прапрапрадедов)
- **Персоны** — разворот на одну персону, навигация между ними
- **История, Фото, Другие материалы** — главы с гипертекстом и разворотами
- **Интерактивные фото** — кликабельные зоны (rect/polygon) → переход к персоне
- **Мультиязычность** — русский, английский, немецкий, французский, испанский, итальянский, португальский, нидерландский, украинский, польский; выбор языка сохраняется
- **Настройки** — цвет страниц и язык в localStorage (одна «настройка» на всё)
- **Адаптивный интерфейс** — удобно на планшетах и десктопах

## Настройка под свою семью

- **Фамилия и бренд** — в `src/lib/constants/owner.ts` задаёте `FAMILY_SURNAME`. Заголовок книги («Родословная семьи …») и описание строятся из неё во всех локалях.
- **Данные** — в одном файле `src/data/data.json` хранятся секции `persons`, `pages`, `photos`, `history`; имена и тексты — ваши, без привязки к конкретной фамилии в коде.
- **Корень древа** — в `src/lib/constants/chapters.ts` задаётся `ROOT_PERSON_ID` (персона «я»).

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) — откроется главная в выбранной локали (по умолчанию редирект на `/ru`). Язык переключается кнопкой в правом верхнем углу (рядом с выбором цвета страниц).

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск в режиме разработки |
| `npm run build` | Сборка для production |
| `npm run start` | Запуск production-сборки |
| `npm run test` | Запуск тестов |
| `npm run test:watch` | Тесты в watch-режиме |
| `npm run test:coverage` | Покрытие кода тестами (пороги 90% / branches 79%) |
| `npm run type-check` | Проверка типов TypeScript |
| `npm run lint` | Проверка ESLint |

## Структура проекта

```
src/
├── app/
│   ├── layout.tsx              # Корневой layout
│   └── [locale]/               # Локали: /ru, /en, ...
│       ├── layout.tsx          # I18nProvider, SetDocumentLang
│       ├── page.tsx            # Главная (титульный разворот)
│       └── chapter/[slug]/     # Chapters: /ru/chapter/family-tree, ...
├── components/
│   ├── book/                   # BookLayout, BookSpread, SpreadNavigation, TitleSpread, TocBookmark
│   ├── content/                # RichText, ContentBlocks, ImageWithHotspots, PersonCard
│   ├── tree/                   # FamilyTree, TreeNode
│   └── ui/                     # NavButton, PageColorPicker, LocaleSwitcher
├── data/
│   └── data.json               # Единый файл: persons, pages, photos, history
├── lib/
│   ├── constants/              # chapters, routes, owner, storage
│   ├── i18n/                   # локали, сообщения, useLocaleRoutes
│   ├── data/                   # persons, pages, spreads
│   ├── types/
│   └── utils/
├── hooks/
│   ├── useSpreadState.ts
│   └── useClickOutside.ts
└── middleware.ts               # Redirect / and /chapter/* to /{locale}/...
```

## Данные

Все данные приложения лежат в **одном** файле **`src/data/data.json`** (секции: `persons`, `pages`, `photos`, `history`). В админке можно скопировать или скачать один JSON — у него та же структура. Чтобы обновить данные в проекте, сохраните скачанный файл как `src/data/data.json` (заменить один файл).

### Персоны (`data.json` → `persons`)

Ваши персоны: id, имя, годы, место рождения, род занятий, `parentIds` для построения древа. Фамилия в заголовке книги берётся из конфига, а не из этих записей.

```json
{
  "id": "person-1",
  "name": "Иван Петрович Никонец",
  "birthYears": "1925–1998",
  "birthPlace": "д. Заозерье",
  "occupation": "учитель",
  "parentIds": ["person-2", "person-3"],
  "gender": "m"
}
```

### Развороты (`data.json` → `pages`)

Левая и правая страница разворота с блоками контента (paragraph, heading, list), изображениями и hotspots. Глава «Персоны» собирается из списка персон: один разворот = одна персона.

### Фото (`public/photos/` и `data.json` → `photos`)

Создайте папку `public/photos/` и любую структуру подпапок (например `2020/`, `family/`). Заливайте туда фото (jpg, png, gif, webp). В админке (вкладка Photos) они появятся автоматически после сканирования. Подписи и люди на фото сохраняются в секции `photos` в `data.json`.

## Деплой

### Vercel

Подключите репозиторий к [vercel.com](https://vercel.com). Деплой выполняется автоматически при push.

### Standalone / Docker

См. [DEPLOY.md](DEPLOY.md) (если есть в репозитории).

## Спецификация

Подробное описание: [SPEC.md](SPEC.md) (если есть в репозитории).
