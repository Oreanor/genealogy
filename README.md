# Your Family Genealogy

An interactive album-book about **your family's** genealogy built with Next.js. Not tied to a single surname: you configure the album "owner's" surname in one place — the title and description are generated in all languages. Users browse spreads, navigate chapters, and open person cards from the family tree or interactive photos.

[![CI](https://github.com/Oreanor/genealogy/actions/workflows/ci.yml/badge.svg)](https://github.com/Oreanor/genealogy/actions/workflows/ci.yml)
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
- The admin helper APIs (photo folder scan, geocoding proxy) run only in development; see [DEPLOY.md](DEPLOY.md#environment-variables).
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
| `npm run test:coverage` | Code coverage (thresholds: lines 79%, statements 76%, functions 75%, branches 64%) |
| `npm run check` | Lint + type-check + tests (same as CI, without build) |
| `npm run type-check` | TypeScript type checking |
| `npm run lint` | ESLint check |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout, fonts, pre-paint theme script
│   ├── robots.ts               # robots.txt (admin and API excluded)
│   ├── api/                    # Dev-only admin helpers (photo scan, geocoding proxy)
│   └── [locale]/               # Locales: /ru, /en, ...
│       ├── layout.tsx          # I18nProvider, SetDocumentLang
│       ├── page.tsx            # Home (book view)
│       ├── admin/              # Admin panel (client-side editor, exports data.json)
│       └── chapter/[slug]/     # Legacy redirect to ?section=
├── components/
│   ├── admin/                  # Persons table, photo hotspot editor, rich text, import/merge
│   ├── book/                   # Book layout, sections, Leaflet maps, archive timelines
│   ├── content/                # RichText, ContentBlocks, ImageWithHotspots, PersonCard
│   ├── pdf/                    # @react-pdf export of the whole book
│   ├── tree/                   # FamilyTree, TreeNode, pan/zoom, connector lines
│   └── ui/                     # Atoms / molecules, dialogs, pickers
├── data/                       # data.json — the single content source
├── hooks/                      # usePersons, useSpreadState, useClickOutside, …
├── lib/
│   ├── constants/              # chapters, routes, sections, storage keys, theme
│   ├── data/                   # Read-only data access layer (+ generated JSON bundles)
│   ├── i18n/                   # 10 locales, typed messages, context
│   ├── server/                 # Server-only helpers
│   ├── types/
│   └── utils/                  # Pure logic: kinship, tree layout, merge, transliteration
└── proxy.ts                    # Locale redirects for /, /admin, legacy paths
scripts/                        # Build-time data pipelines (avatar crops, archive imports)
```

## Engineering Notes

- **Performance** — PageSpeed Insights 100 on mobile and desktop: the page chrome is server-rendered and only client-only parts are gated, book sections and the PDF preview are code-split, face avatars are pre-cropped to small WebP strips at build time (`scripts/build-avatar-crops.mjs`), global CSS is inlined.
- **Data layer** — components never import `data.json` directly; `@/lib/data/*` exposes typed accessors. Admin edits live in an in-memory overlay that React subscribes to via `useSyncExternalStore` (`usePersons`), with a memoized snapshot.
- **Accessibility** — landmarks, labelled controls, archive name search implements the WAI-ARIA combobox pattern (arrow keys, Enter, Escape, `aria-activedescendant`).
- **Quality gates** — strict TypeScript, ESLint (Next + React Hooks rules) with zero warnings, ~400 Vitest + Testing Library tests with coverage thresholds; all run in GitHub Actions on every push and PR.
- **Security** — dev-only API routes are disabled in production, conservative security headers, path-traversal guard on the photo scanner, admin excluded from indexing.

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

See [DEPLOY.md](DEPLOY.md).

## Specification

Detailed description: [SPEC.md](SPEC.md).

---

**Other languages:** [Русский](README.ru.md) · [Português](README.pt.md)
