# Родословная семьи Никонец

Интерактивный альбом-книга о семье на Next.js. Пользователь листает развороты книги, переходит по главам и на карточки персон из древа или с интерактивных фото.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)
![Vitest](https://img.shields.io/badge/Vitest-4-yellow)

## Возможности

- **Титульный разворот** — название, обложка, оглавление глав
- **Семейное древо** — до 6 уровней (от «я» до прапрапрадедов)
- **Персоны** — разворот на одну персону, навигация между ними
- **История, Фото, Другие материалы** — главы с гипертекстом и разворотами
- **Интерактивные фото** — кликабельные зоны (rect/polygon) → переход к персоне
- **Адаптивный интерфейс** — удобно на планшетах и десктопах

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск в режиме разработки |
| `npm run build` | Сборка для production |
| `npm run start` | Запуск production-сборки |
| `npm run test` | Запуск тестов |
| `npm run test:watch` | Тесты в watch-режиме |
| `npm run test:coverage` | Покрытие кода тестами (~91%) |
| `npm run type-check` | Проверка типов TypeScript |
| `npm run lint` | Проверка ESLint |

## Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Главная (титульный разворот)
│   └── glava/[slug]/       # Главы: /glava/semejnoe-drevo, /glava/persony, ...
├── components/
│   ├── book/               # BookLayout, BookSpread, SpreadNavigation, TitleSpread
│   ├── content/            # RichText, ContentBlocks, ImageWithHotspots, PersonCard
│   ├── tree/               # FamilyTree, TreeNode
│   └── ui/                 # NavButton
├── data/
│   ├── pages.json          # Развороты по главам
│   └── persons.json        # Персоны и древо
├── lib/
│   ├── constants/          # chapters, routes
│   ├── data/               # persons, pages, spreads
│   ├── types/              # Person, Spread, PageContent
│   └── utils/              # tree, svg, chapter, pageContent
└── hooks/
    └── useSpreadState.ts   # Текущий разворот
```

## Данные

### Персоны (`src/data/persons.json`)

```json
{
  "id": "person-1",
  "name": "Иван Петрович Никонец",
  "birthYears": "1925–1998",
  "birthPlace": "д. Заозерье",
  "occupation": "учитель",
  "parentIds": ["person-2", "person-3"]
}
```

### Развороты (`src/data/pages.json`)

Каждая запись — левая и правая страница разворота с блоками контента (paragraph, heading, list), изображениями и hotspots. Глава «Персоны» собирается из списка персон: один разворот = одна персона.

## Деплой

### Vercel

Подключите репозиторий к [vercel.com](https://vercel.com). Деплой выполняется автоматически при push.

### Standalone / Docker

См. [DEPLOY.md](DEPLOY.md).

## Спецификация

Подробное описание: [SPEC.md](SPEC.md).
