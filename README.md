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
- **History, Photos, Map, Other materials** — chapters with hypertext, spreads, and geodata
- **Interactive photos** — clickable areas (rect/polygon) → navigate to a person
- **Multilingual** — Russian, English, German, French, Spanish, Italian, Portuguese, Dutch, Ukrainian, Polish; language choice is persisted
- **Settings** — page color and language in localStorage (one "settings" object for all)
- **Responsive UI** — comfortable on tablets and desktops

## Customizing for Your Family

- **Surname and branding** — in `src/lib/data/owner.ts` (e.g. from `data.json` root) the book title and description are built in all locales.
- **Data** — a single file `src/data/data.json` holds sections `persons`, `photos`, `history`, and `rootPersonId`; names and texts are yours, with no hardcoded surname in the code.
- **Tree root** — `rootPersonId` in `data.json` or first person; override in admin (root column).

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the main page opens in the selected locale (by default redirects to `/en`). Switch language with the button in the top-right corner (next to the page color picker).

## Navigation and State

- All public routes are locale-prefixed; `src/proxy.ts` redirects `/`, `/admin`, and legacy chapter paths to `/{locale}/...`.
- Reader state is deep-linkable through query params: section, selected person, selected photo, selected history entry, and selected tree person stay in the URL.
- The admin screen remembers the last active tab and opens it by default on the next visit.
- The map chapter supports filtering by a selected person from the top-right dropdown, with a one-click reset back to all markers.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Code coverage (thresholds 90% / branches 74%) |
| `npm run type-check` | TypeScript type checking |
| `npm run lint` | ESLint check |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   └── [locale]/               # Locales: /ru, /en, ...
│       ├── layout.tsx          # I18nProvider, SetDocumentLang
│       ├── page.tsx            # Home (book view)
│       ├── admin/              # Admin panel
│       └── chapter/[slug]/     # Legacy redirect to ?section=
├── components/
│   ├── book/                   # BookLayout, BookSpread, SectionBookmarks, …
│   ├── content/                # RichText, ContentBlocks, ImageWithHotspots, PersonCard
│   ├── tree/                   # FamilyTree, TreeNode
│   └── ui/                     # NavButton, PageColorPicker, LocaleSwitcher
├── data/
│   └── data.json               # Single data file: persons, photos, history, rootPersonId
├── lib/
│   ├── constants/              # chapters, routes, sections, storage
│   ├── data/                   # persons, photos, history, root, spreads, owner
│   ├── i18n/                   # locales, messages, useLocaleRoutes
│   ├── types/
│   └── utils/
├── hooks/
│   ├── useSpreadState.ts
│   └── useClickOutside.ts
└── proxy.ts                    # Redirect / and /chapter/* to /{locale}/...
```

## Data

All application data lives in **one** file: **`src/data/data.json`** (sections: `persons`, `photos`, `history`, `rootPersonId`). In the admin panel you can copy or download a single JSON — it uses the same structure. To update data in the project, save the downloaded file as `src/data/data.json` (replace the existing file). Read data only via `@/lib/data/*` modules; see `src/data/README.md`.

### Persons (`data.json` → `persons`)

Your persons: id, firstName, patronymic, lastName, birthDate, deathDate, birthPlace, residenceCity, occupation, comment, avatarPhotoSrc, fatherId, motherId, gender. The surname in the book title comes from the data/owner layer, not from a single constant.

### Spreads

History section uses one spread with entries; Persons section builds one spread per person. Tree and Photos are single-section views.

### Photos (`public/photos/` and `data.json` → `photos`)

Create the `public/photos/` folder and any subfolder structure (e.g. by category). Add photos there (jpg, png, gif, webp). In the admin panel (Photos tab) they can be scanned and managed. Captions and people on photos are stored in the `photos` section in `data.json`.

## Deploy

### Vercel

Connect the repository to [vercel.com](https://vercel.com). Deploy runs automatically on push.

### Standalone / Docker

See [DEPLOY.md](DEPLOY.md) (if present in the repository).

## Specification

Detailed description: [SPEC.md](SPEC.md) (if present in the repository).

---

**Russian:** [README.ru.md](README.ru.md)
