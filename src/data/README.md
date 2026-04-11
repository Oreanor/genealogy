# Data source

- **`data.json`** — единственный источник контента (персоны, фото, истории, rootPersonId). Редактируется вручную или через админку.
- Оценка числа активных линий по декадам (для будущих графиков): ключ **`lineDynamics`** в этом же файле; доступ через `getLineDynamics()` из `@/lib/data/lineDynamics`.
- **`data.template.json`** — пустой шаблон (одна корневая персона, пустые `photos`/`history`). Можно скопировать содержимое в `data.json` для сброса к стартовому состоянию.
- Читать данные **только** через модули в `@/lib/data/`: `persons`, `photos`, `history`, `root`, `spreads`, `owner`, `familyRelations`. Не импортировать `@/data/data.json` из компонентов или утилит вне `lib/data`.

## История: адаптивная HTML-таблица в `richText`

Если в админ-редакторе блок заменили целиком, таблица снова станет «символьной» (строки с `|`). Ниже — **контракт разметки** для сайта и PDF (`htmlToPdf` понимает `div`, `table`, `thead`, `tbody`, `tr`, `th`, `td`).

**Общее для любой такой таблицы**

- Заголовок секции — `<h3 class="mt-6 mb-3 text-base font-semibold text-(--ink)">…</h3>` (не `<p>#### …</p>`).
- Обёртка: `<div class="not-prose my-4 w-full max-w-full min-w-0 overflow-x-auto">` … `</div>`
- Таблица: `class="table-fixed w-full max-w-full border-collapse border border-(--ink-muted)/35 text-[0.62rem] leading-snug text-(--ink) sm:text-xs md:text-sm"`
- После `<table>` — `<colgroup>` с долями колонок, **в сумме 100%** (подобрать под число и ширину колонок).

**Шапка**

- Каждый `<th>`: `class="min-w-0 break-words border-b border-(--ink-muted)/35 px-1 py-1.5 text-left align-bottom font-semibold sm:px-2 sm:py-2"`
- Длинные подписи можно разбить `<br/>` внутри `<th>`.

**Строки**

- 1-я колонка (декада / годы): заголовок вроде `Декада` + подпись «годы»; в ячейках диапазон не в одну строку — `1750–<br/>1769`, выравнивание `text-center`, без `whitespace-nowrap`.
- Промежуточные: `class="min-w-0 break-words px-1 py-1 align-top sm:px-2 sm:py-1.5 "`
- Последняя текстовая (комментарий / тренд): `class="min-w-0 break-words px-1 py-1 align-top text-(--ink-muted) sm:px-2 sm:py-1.5 "`
- Зебра: чётные строки добавить `bg-(--paper)/35` к `class` у `<tr>` вместе с `border-b border-(--ink-muted)/20`.

**Пример: «Таблица 1» в материале «Генеалогический анализ численности…» — 7 колонок**

`<colgroup>`: `10%` + `13%` + `10%` + `13%` + `10%` + `14%` + `30%` (десятилетие; рождения/линии Умань; рождения/линии Сумы; итого; основной тренд).

Цвета: `text-(--ink)`, `text-(--ink-muted)`, `border-(--ink-muted)/…`, `bg-(--paper-light)` в шапке, `bg-(--paper)/35` в зебре.
