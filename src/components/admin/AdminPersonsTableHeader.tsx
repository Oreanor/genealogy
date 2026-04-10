'use client';

import type { Person } from '@/lib/types/person';
import type { TranslationFn } from '@/lib/i18n/types';
import {
  COLUMNS,
  COLUMN_LABELS,
  type SortDirection,
  type SortKey,
} from './adminPersonsTableUtils';

type Props = {
  persons: Person[];
  selectedIds: Set<string>;
  setSelectedIds: (value: Set<string>) => void;
  columnWidths: Record<string, number>;
  sortConfig: { key: SortKey; direction: SortDirection } | null;
  cycleSort: (key: SortKey) => void;
  renderResizeHandle: (id: string) => React.ReactNode;
  t: TranslationFn;
};

export function AdminPersonsTableHeader({
  persons,
  selectedIds,
  setSelectedIds,
  columnWidths,
  sortConfig,
  cycleSort,
  renderResizeHandle,
  t,
}: Props) {
  return (
    <thead className="sticky top-0 z-10 bg-(--book-bg) shadow-[0_1px_0_0_var(--border-subtle)]">
      <tr className="border-b border-(--border)">
        <th className="w-14 p-2 text-center" title={t('adminRemove')}>
          <input
            type="checkbox"
            checked={persons.length > 0 && selectedIds.size === persons.length}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIds(new Set(persons.map((p) => p.id)));
              } else {
                setSelectedIds(new Set());
              }
            }}
            aria-label={t('adminSelectAllRows')}
          />
        </th>
        <th
          style={{ width: 56, minWidth: 56, maxWidth: 56 }}
          className="border-l border-(--border-subtle) p-2 text-center font-medium text-(--ink) whitespace-nowrap"
          title={t('adminRootColumn')}
        >
          {t('adminRootColumn')}
        </th>
        {COLUMNS.map((col) => (
          <th
            key={col}
            style={{ width: columnWidths[col], minWidth: columnWidths[col] }}
            className="group relative cursor-pointer select-none border-l border-(--border-subtle) p-2 pr-3 text-left font-medium text-(--ink)"
            onClick={() => cycleSort(col)}
          >
            <span className="inline-flex items-center gap-1">
              {COLUMN_LABELS[col] ? t(COLUMN_LABELS[col]!) : col}
              <span className="text-[10px] font-normal leading-none opacity-70">
                {sortConfig?.key === col
                  ? sortConfig.direction === 'asc'
                    ? '▲'
                    : '▼'
                  : ''}
              </span>
            </span>
            {renderResizeHandle(col)}
          </th>
        ))}
        <th
          style={{ width: columnWidths.avatar, minWidth: columnWidths.avatar }}
          className="group relative border-l border-(--border-subtle) p-1 pr-3 text-center font-medium text-(--ink)"
        >
          {t('adminPortraitColumn')}
          {renderResizeHandle('avatar')}
        </th>
        <th
          style={{ width: columnWidths.father, minWidth: columnWidths.father }}
          className="group relative border-l border-(--border-subtle) p-2 pr-3 text-left font-medium text-(--ink)"
        >
          {t('adminFatherColumn')}
          {renderResizeHandle('father')}
        </th>
        <th
          style={{ width: columnWidths.mother, minWidth: columnWidths.mother }}
          className="group relative border-l border-(--border-subtle) p-2 text-left font-medium text-(--ink)"
        >
          {t('adminMotherColumn')}
        </th>
      </tr>
    </thead>
  );
}
