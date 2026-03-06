# Your Family Genealogy

An interactive album-book about **your family's** genealogy built with Next.js. Not tied to a single surname: you configure the album "owner's" surname in one place — the title and description are generated in all languages. Users browse spreads, navigate chapters, and open person cards from the family tree or interactive photos.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)
![Vitest](https://img.shields.io/badge/Vitest-4-yellow)

## Features

- **Title spread** — family name, cover, chapter table of contents
- **Family tree** — up to 6 levels (from "me" to great-great-great-grandparents)
- **Persons** — one spread per person, navigation between them
- **History, Photos, Other materials** — chapters with hypertext and spreads
- **Interactive photos** — clickable areas (rect/polygon) → navigate to a person
- **Multilingual** — Russian, English, German, French, Spanish, Italian, Portuguese, Dutch, Ukrainian, Polish; language choice is persisted
- **Settings** — page color and language in localStorage (one "settings" object for all)
- **Responsive UI** — comfortable on tablets and desktops

## Customizing for Your Family

- **Surname and branding** — in `src/lib/constants/owner.ts` set `FAMILY_SURNAME`. The book title ("Genealogy of the … family") and description are built from it in all locales.
- **Data** — a single file `src/data/data.json` holds sections `persons`, `pages`, `photos`, `history`; names and texts are yours, with no hardcoded surname in the code.
- **Tree root** — in `src/lib/constants/chapters.ts` set `ROOT_PERSON_ID` (the "me" person).

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the main page opens in the selected locale (by default redirects to `/ru`). Switch language with the button in the top-right corner (next to the page color picker).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Code coverage (thresholds 90% / branches 79%) |
| `npm run type-check` | TypeScript type checking |
| `npm run lint` | ESLint check |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   └── [locale]/               # Locales: /ru, /en, ...
│       ├── layout.tsx          # I18nProvider, SetDocumentLang
│       ├── page.tsx            # Home (title spread)
│       └── chapter/[slug]/     # Chapters: /ru/chapter/family-tree, ...
├── components/
│   ├── book/                   # BookLayout, BookSpread, SpreadNavigation, TitleSpread, TocBookmark
│   ├── content/                # RichText, ContentBlocks, ImageWithHotspots, PersonCard
│   ├── tree/                   # FamilyTree, TreeNode
│   └── ui/                     # NavButton, PageColorPicker, LocaleSwitcher
├── data/
│   └── data.json               # Single data file: persons, pages, photos, history
├── lib/
│   ├── constants/              # chapters, routes, owner, storage
│   ├── i18n/                   # locales, messages, useLocaleRoutes
│   ├── data/                   # persons, pages, spreads
│   ├── types/
│   └── utils/
├── hooks/
│   ├── useSpreadState.ts
│   └── useClickOutside.ts
└── middleware.ts               # Redirect / and /chapter/* to /{locale}/...
```

## Data

All application data lives in **one** file: **`src/data/data.json`** (sections: `persons`, `pages`, `photos`, `history`). In the admin panel you can copy or download a single JSON — it uses the same structure. To update data in the project, save the downloaded file as `src/data/data.json` (replace the existing file).

### Persons (`data.json` → `persons`)

Your persons: id, name, years, birth place, occupation, `parentIds` for building the tree. The surname in the book title comes from the config, not from these records.

```json
{
  "id": "person-1",
  "name": "Ivan Petrovich Nikonets",
  "birthYears": "1925–1998",
  "birthPlace": "village of Zaozerye",
  "occupation": "teacher",
  "parentIds": ["person-2", "person-3"],
  "gender": "m"
}
```

### Spreads (`data.json` → `pages`)

Left and right page of a spread with content blocks (paragraph, heading, list), images, and hotspots. The "Persons" chapter is built from the person list: one spread = one person.

### Photos (`public/photos/` and `data.json` → `photos`)

Create the `public/photos/` folder and any subfolder structure (e.g. `2020/`, `family/`). Add photos there (jpg, png, gif, webp). In the admin panel (Photos tab) they appear automatically after scanning. Captions and people on photos are stored in the `photos` section in `data.json`.

## Deploy

### Vercel

Connect the repository to [vercel.com](https://vercel.com). Deploy runs automatically on push.

### Standalone / Docker

See [DEPLOY.md](DEPLOY.md) (if present in the repository).

## Specification

Detailed description: [SPEC.md](SPEC.md) (if present in the repository).
