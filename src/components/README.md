# Component structure (Atomic Design)

UI components are grouped by complexity: **atoms** → **molecules** → **modules** → **organisms**.

## Atoms
Smallest building blocks: single-purpose, no composition of other UI components.

| Component | Path | Notes |
|-----------|------|--------|
| **Button** | `ui/atoms/Button.tsx` | Variants: primary, secondary, ghost, danger, icon |
| **Input** | `ui/atoms/Input.tsx` | Text input; export `controlClass` for shared styling |
| **Select** | `ui/atoms/Select.tsx` | Dropdown using same `controlClass` as Input |

## Molecules
Combinations of atoms or simple compounds: one concept, small API.

| Component | Path | Notes |
|-----------|------|--------|
| **Dialog** | `ui/molecules/Dialog.tsx` | Modal: overlay + panel, title, content, alert/confirm buttons |
| **SearchField** | `ui/molecules/SearchField.tsx` | Search input with magnifier icon (uses Input) |

## Modules
Reusable composite UI: several elements, one feature (tooltip, nav button, picker).

| Component | Path | Notes |
|-----------|------|--------|
| **Tooltip** | `ui/Tooltip.tsx` | Wrapper: hover/focus → label |
| **NavButton** | `ui/NavButton.tsx` | Navigation button (prev/next) |
| **PageColorPicker** | `ui/PageColorPicker.tsx` | Color picker + trigger |
| **LocaleSwitcher** | `ui/LocaleSwitcher.tsx` | Language dropdown |
| **AdminButton** | `ui/AdminButton.tsx` | Link to admin |
| **BookLinkButton** | `book/BookToolbar.tsx` (inline) | Link to book view |
| **ImageLightbox** | `ui/ImageLightbox.tsx` | Fullscreen image + caption |

## Organisms
Full sections or complex blocks: layout + multiple modules/molecules.

| Component | Path | Notes |
|-----------|------|--------|
| **BookLayout** | `book/BookLayout.tsx` | Shell: book container, toolbar, bookmarks |
| **BookSpread** | `book/BookSpread.tsx` | Two-page spread or wide layout |
| **BookPage** | `book/BookPage.tsx` | Single page in spread |
| **SectionBookmarks** | `book/SectionBookmarks.tsx` | Section tabs (Истории, Фото, Персоны) |
| **BookToolbar** | `book/BookToolbar.tsx` | Right toolbar: book link, admin, color, locale, copy, download |
| **BookView** | `book/BookView.tsx` | Main book content router (tree / history / photos / persons) |
| **TitleSpread** | `book/TitleSpread.tsx` | Title spread content |
| **SpreadNavigation** | `book/SpreadNavigation.tsx` | Prev/next spread nav |
| **FamilyTree** | `tree/FamilyTree.tsx` | Tree canvas + nodes |
| **TreeNode** | `tree/TreeNode.tsx` | One node (oval + name + role) |
| **PersonCard** | `content/PersonCard.tsx` | Person details + photos |
| **HistoryContentRenderer** | `content/HistoryContentRenderer.tsx` | Story title + rich text |
| **AdminTabs** | `admin/AdminTabs.tsx` | Admin tab bar + panels |
| **AdminPersonsTable** | `admin/AdminPersonsTable.tsx` | Persons table + root column + Dialog |
| **AdminTextsTab** | `admin/AdminTextsTab.tsx` | History list + editor |
| **AdminPhotosTab** | `admin/AdminPhotosTab.tsx` | Photo grid + edit lightbox |
| **RichTextEditor** | `admin/RichTextEditor.tsx` | Rich text editing |
| **ContentBlocks** | `content/ContentBlocks.tsx` | Block list renderer |
| **ImageWithHotspots** | `content/ImageWithHotspots.tsx` | Image + hotspot overlays |

## Imports

- Molecules: `@/components/ui/molecules` or `@/components/ui/molecules/Dialog`
- Atoms: `@/components/ui/atoms` (when added)
- Modules/organisms: by path, e.g. `@/components/ui/Tooltip`, `@/components/book/BookLayout`
