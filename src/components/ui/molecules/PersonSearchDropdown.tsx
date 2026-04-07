'use client';

import { SearchField } from './SearchField';
import type { Person } from '@/lib/types/person';

export interface PersonSearchDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSelectPerson: (person: Person) => void;
  filteredPersons: Person[];
  getDisplayName: (person: Person) => string;
  placeholder: string;
  ariaLabel: string;
  searchFocused: boolean;
}

export function PersonSearchDropdown({
  value,
  onChange,
  onFocus,
  onBlur,
  onSelectPerson,
  filteredPersons,
  getDisplayName,
  placeholder,
  ariaLabel,
  searchFocused,
}: PersonSearchDropdownProps) {
  return (
    <div className="relative">
      <SearchField
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onClick={onFocus}
        onBlur={() => setTimeout(onBlur, 150)}
        aria-label={ariaLabel}
      />
      {searchFocused && filteredPersons.length > 0 && (
        <ul className="absolute left-0 right-0 z-10 mt-1 max-h-64 overflow-y-auto rounded-md border border-(--border-subtle) bg-(--book-bg) shadow-lg">
          {filteredPersons.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  // Обрабатываем выбор до blur инпута, чтобы клик не «терялся»
                  e.preventDefault();
                  onSelectPerson(p);
                }}
                className="block w-full px-3 py-1 text-left text-sm text-(--ink) hover:bg-(--paper-light)"
              >
                {getDisplayName(p)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
