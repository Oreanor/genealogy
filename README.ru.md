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

- **Фамилия и бренд** — в `src/lib/data/owner.ts` (и данные в `data.json`) задаётся заголовок книги и описание во всех локалях.
- **Данные** — в одном файле `src/data/data.json` хранятся секции `persons`, `photos`, `history`, `rootPersonId`; имена и тексты — ваши, без привязки к конкретной фамилии в коде.
- **Корень древа** — в `data.json` поле `rootPersonId` или первая персона; в админке можно задать корень (колонка root).

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
│       ├── page.tsx            # Главная (книга)
│       ├── admin/               # Админ-панель
│       └── chapter/[slug]/     # Редирект на ?section=
├── components/
│   ├── book/                   # BookLayout, BookSpread, SectionBookmarks, …
│   ├── content/                # RichText, ContentBlocks, ImageWithHotspots, PersonCard
│   ├── tree/                   # FamilyTree, TreeNode
│   └── ui/                     # NavButton, PageColorPicker, LocaleSwitcher
├── data/
│   └── data.json               # Единый файл: persons, photos, history, rootPersonId
├── lib/
│   ├── constants/              # chapters, routes, sections, storage
│   ├── data/                   # persons, photos, history, root, spreads, owner
│   ├── i18n/                   # локали, сообщения, useLocaleRoutes
│   ├── types/
│   └── utils/
├── hooks/
│   ├── useSpreadState.ts
│   └── useClickOutside.ts
└── middleware.ts               # Редирект / и /chapter/* на /{locale}/...
```

## Данные

Все данные приложения лежат в **одном** файле **`src/data/data.json`** (секции: `persons`, `photos`, `history`, `rootPersonId`). В админке можно скопировать или скачать один JSON — у него та же структура. Чтобы обновить данные в проекте, сохраните скачанный файл как `src/data/data.json` (заменить один файл). Читать данные только через модули `@/lib/data/*`; см. `src/data/README.md`.

### Персоны (`data.json` → `persons`)

Ваши персоны: id, firstName, patronymic, lastName, birthDate, deathDate, birthPlace, residenceCity, occupation, comment, avatarPhotoSrc, fatherId, motherId, gender. Фамилия в заголовке книги берётся из слоя data/owner, а не из одной константы.

### Развороты

Глава «История» — один разворот с записями; «Персоны» — по развороту на персону. Древо и Фото — отдельные секции.

### Фото (`public/photos/` и `data.json` → `photos`)

Создайте папку `public/photos/` и любую структуру подпапок (например по категориям). Заливайте туда фото (jpg, png, gif, webp). В админке (вкладка Photos) их можно сканировать и редактировать. Подписи и люди на фото сохраняются в секции `photos` в `data.json`.

## Деплой

### Vercel

Подключите репозиторий к [vercel.com](https://vercel.com). Деплой выполняется автоматически при push.

### Standalone / Docker

См. [DEPLOY.md](DEPLOY.md) (если есть в репозитории).

## Спецификация

Подробное описание: [SPEC.md](SPEC.md) (если есть в репозитории).

---

**English:** [README.md](README.md)
