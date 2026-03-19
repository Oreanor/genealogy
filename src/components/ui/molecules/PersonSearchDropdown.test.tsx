import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Person } from '@/lib/types/person';
import { SearchField } from './SearchField';
import { PersonSearchDropdown } from './PersonSearchDropdown';

describe('SearchField / PersonSearchDropdown', () => {
  it('SearchField forwards value and triggers onChange', () => {
    const onChange = vi.fn();
    render(
      <SearchField
        placeholder="Поиск"
        value="abc"
        onChange={(e) => onChange((e.target as HTMLInputElement).value)}
      />
    );

    const input = screen.getByPlaceholderText('Поиск') as HTMLInputElement;
    expect(input.value).toBe('abc');

    fireEvent.change(input, { target: { value: 'abcd' } });
    expect(onChange).toHaveBeenCalledWith('abcd');
  });

  it('PersonSearchDropdown renders list on focus and selects person', () => {
    const p1: Person = { id: '1', firstName: 'Иван', lastName: 'Иванов', gender: 'm' };
    const p2: Person = { id: '2', firstName: 'Пётр', lastName: 'Петров', gender: 'm' };

    const onSelect = vi.fn();
    const { unmount } = render(
      <PersonSearchDropdown
        value=""
        onChange={vi.fn()}
        onFocus={vi.fn()}
        onBlur={vi.fn()}
        onSelectPerson={onSelect}
        filteredPersons={[p1, p2]}
        getDisplayName={(p) => `${p.firstName} ${p.lastName}`}
        placeholder="placeholder"
        ariaLabel="aria"
        searchFocused
      />
    );

    const item = screen.getByRole('button', { name: /Иван Иванов/i });
    fireEvent.mouseDown(item);
    expect(onSelect).toHaveBeenCalledWith(p1);

    // When focused=false, dropdown should not render.
    unmount();
    render(
      <PersonSearchDropdown
        value=""
        onChange={vi.fn()}
        onFocus={vi.fn()}
        onBlur={vi.fn()}
        onSelectPerson={vi.fn()}
        filteredPersons={[p1]}
        getDisplayName={(p) => `${p.firstName} ${p.lastName}`}
        placeholder="placeholder"
        ariaLabel="aria"
        searchFocused={false}
      />
    );
    expect(screen.queryByRole('button', { name: /Иван Иванов/i })).toBeNull();
  });
});

