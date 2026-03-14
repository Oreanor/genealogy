# Data source

- **`data.json`** — единственный источник контента (персоны, фото, истории, rootPersonId). Редактируется вручную или через админку.
- Читать данные **только** через модули в `@/lib/data/`: `persons`, `photos`, `history`, `root`, `spreads`, `owner`, `familyRelations`. Не импортировать `@/data/data.json` из компонентов или утилит вне `lib/data`.
