'use client';

import type { Person } from '@/lib/types/person';
import { getFullName } from '@/lib/utils/person';
import { Button, Input } from '@/components/ui/atoms';
import type { TranslationFn } from './adminPersonsTableUtils';

type Props = {
  person: Person;
  persons: Person[];
  type: 'father' | 'mother';
  isOpen: boolean;
  parentPickerQuery: string;
  setParentPickerQuery: (value: string) => void;
  filteredPickerPersons: Person[];
  parentPickerRef?: React.Ref<HTMLDivElement>;
  openPicker: () => void;
  setParent: (personId: string) => void;
  closePicker: () => void;
  width: number;
  t: TranslationFn;
};

export function ParentPickerPopover({
  person,
  persons,
  type,
  isOpen,
  parentPickerQuery,
  setParentPickerQuery,
  filteredPickerPersons,
  parentPickerRef,
  openPicker,
  setParent,
  closePicker,
  width,
  t,
}: Props) {
  const parentId = type === 'father' ? (person.fatherId ?? '') : (person.motherId ?? '');
  const parent = parentId ? persons.find((p) => p.id === parentId) : null;
  const pickerPersons = filteredPickerPersons.filter((p) => p.id !== person.id);

  return (
    <td
      style={{ width, minWidth: width }}
      className="relative border-l border-(--border-subtle) p-1"
    >
      <div className="relative min-w-0" ref={isOpen ? parentPickerRef : undefined}>
        <Button
          variant="ghost"
          size="sm"
          onClick={openPicker}
          className="w-full justify-start truncate font-normal"
          title={type === 'father' ? t('adminFatherColumn') : t('adminMotherColumn')}
        >
          {parent ? getFullName(parent) || parent.id : '—'}
        </Button>
        {isOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[200px] rounded-lg border border-(--border) bg-(--paper) p-2 shadow-lg">
            <Input
              type="text"
              value={parentPickerQuery}
              onChange={(e) => setParentPickerQuery(e.target.value)}
              placeholder={t('adminSearchPersons')}
              className="mb-2"
              autoFocus
            />
            <ul className="max-h-40 overflow-y-auto">
              <li>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setParent('');
                    closePicker();
                  }}
                  className="w-full justify-start"
                >
                  —
                </Button>
              </li>
              {pickerPersons.map((p) => (
                <li key={p.id}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setParent(p.id);
                      closePicker();
                    }}
                    className="w-full justify-start truncate font-normal"
                  >
                    {getFullName(p) || p.id}
                  </Button>
                </li>
              ))}
              {pickerPersons.length === 0 && parentPickerQuery.trim() && (
                <li className="px-2 py-1 text-sm text-(--ink-muted)">
                  {t('adminNoPersonsMatch')}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </td>
  );
}
