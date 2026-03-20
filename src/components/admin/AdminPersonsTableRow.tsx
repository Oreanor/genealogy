'use client';

import { ImageIcon } from 'lucide-react';
import { Button, Input } from '@/components/ui/atoms';
import type { AvatarSource } from '@/lib/data/photos';
import type { Person } from '@/lib/types/person';
import { getFullName } from '@/lib/utils/person';
import { COLUMNS, type TranslationFn } from './adminPersonsTableUtils';
import { ParentPickerPopover } from './ParentPickerPopover';

type Props = {
  person: Person;
  actualIdx: number;
  rootPersonId: string;
  persons: Person[];
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  columnWidths: Record<string, number>;
  handleSetRootClick: (personId: string) => void;
  updatePerson: (index: number, field: keyof Person, value: Person[keyof Person]) => void;
  handleCityBlur: (index: number, field: 'birthPlace' | 'residenceCity', rawValue: string) => Promise<void>;
  avatar: AvatarSource | null;
  onOpenAvatarPicker: () => void;
  renderFaceThumbnail: (source: AvatarSource, size?: number) => React.ReactNode;
  parentPicker: { rowIdx: number; type: 'father' | 'mother' } | null;
  parentPickerQuery: string;
  setParentPickerQuery: (value: string) => void;
  filteredPickerPersons: Person[];
  parentPickerRef: React.RefObject<HTMLDivElement | null>;
  setParent: (index: number, type: 'father' | 'mother', personId: string) => void;
  openParentPicker: (rowIdx: number, type: 'father' | 'mother') => void;
  closeParentPicker: () => void;
  t: TranslationFn;
};

export function AdminPersonsTableRow({
  person,
  actualIdx,
  rootPersonId,
  persons,
  selectedIds,
  setSelectedIds,
  columnWidths,
  handleSetRootClick,
  updatePerson,
  handleCityBlur,
  avatar,
  onOpenAvatarPicker,
  renderFaceThumbnail,
  parentPicker,
  parentPickerQuery,
  setParentPickerQuery,
  filteredPickerPersons,
  parentPickerRef,
  setParent,
  openParentPicker,
  closeParentPicker,
  t,
}: Props) {
  const isRoot = person.id === rootPersonId;

  return (
    <tr className="border-b border-(--border-subtle) hover:bg-(--paper-light)/50">
      <td className="p-1 text-center">
        <input
          type="checkbox"
          checked={selectedIds.has(person.id)}
          onChange={(e) => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              if (e.target.checked) next.add(person.id);
              else next.delete(person.id);
              return next;
            });
          }}
          aria-label={t('adminSelectRowAria', { name: getFullName(person) || person.id })}
        />
      </td>
      <td
        style={{ width: 56, minWidth: 56, maxWidth: 56 }}
        className="border-l border-(--border-subtle) p-1 text-center"
      >
        {isRoot ? (
          <span className="text-(--accent)" title={t('adminRootColumn')}>
            ★
          </span>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSetRootClick(person.id)}
            className="mx-auto block w-8 rounded py-1"
            title={t('adminRootColumn')}
            aria-label={t('adminRootChangeConfirm')}
          >
            —
          </Button>
        )}
      </td>
      {COLUMNS.map((col) => (
        <td
          key={col}
          style={{ width: columnWidths[col], minWidth: columnWidths[col] }}
          className="border-l border-(--border-subtle) p-1"
        >
          {col === 'gender' ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                updatePerson(actualIdx, 'gender', (person.gender === 'f' ? 'm' : 'f') as 'm' | 'f')
              }
              className="min-w-[2rem] font-medium"
              title={t('adminGender')}
            >
              {(person.gender ?? 'm') === 'f' ? t('adminGenderF') : t('adminGenderM')}
            </Button>
          ) : (
            <Input
              value={String((person as unknown as Record<string, unknown>)[col] ?? '')}
              onChange={(e) => updatePerson(actualIdx, col, e.target.value)}
              onBlur={(e) => {
                if (col === 'birthPlace' || col === 'residenceCity') {
                  void handleCityBlur(actualIdx, col, e.target.value);
                }
              }}
              className="min-w-[80px]"
            />
          )}
        </td>
      ))}
      <td
        style={{ width: columnWidths.avatar, minWidth: columnWidths.avatar }}
        className="border-l border-(--border-subtle) p-0.5 align-middle text-center"
      >
        <button
          type="button"
          onClick={onOpenAvatarPicker}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-(--border-subtle) bg-(--paper-light) hover:border-(--accent) focus:outline-none"
          title={t('adminSelectAvatar')}
          aria-label={t('adminSelectAvatar')}
        >
          {avatar ? (
            renderFaceThumbnail(avatar, 28)
          ) : (
            <ImageIcon className="size-3.5 text-(--ink-muted)" aria-hidden />
          )}
        </button>
      </td>
      {(['father', 'mother'] as const).map((type) => (
        <ParentPickerPopover
          key={type}
          person={person}
          persons={persons}
          type={type}
          isOpen={parentPicker?.rowIdx === actualIdx && parentPicker?.type === type}
          parentPickerQuery={parentPickerQuery}
          setParentPickerQuery={setParentPickerQuery}
          filteredPickerPersons={filteredPickerPersons}
          parentPickerRef={parentPickerRef}
          openPicker={() => openParentPicker(actualIdx, type)}
          setParent={(parentId) => setParent(actualIdx, type, parentId)}
          closePicker={closeParentPicker}
          width={columnWidths[type]}
          t={t}
        />
      ))}
    </tr>
  );
}
