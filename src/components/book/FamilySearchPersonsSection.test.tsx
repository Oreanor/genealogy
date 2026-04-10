import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { withI18n } from '@/lib/i18n/test-utils';
import { FamilySearchPersonsSection } from './FamilySearchPersonsSection';

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [{ index: 0, key: 'row-0', start: 0 }],
    getTotalSize: () => 40,
    measureElement: vi.fn(),
  }),
}));

vi.mock('@/lib/data/familysearchPersons', () => ({
  getFamilySearchPersons: () => ({
    meta: { sourceJson: 'fixture.json' },
    persons: [
      {
        id: 'fs-ABC1',
        kind: 'anchor' as const,
        firstName: 'Иван',
        lastName: 'Тестов',
        birthDate: '1900',
        birthPlace: 'Место',
      },
    ],
  }),
}));

vi.mock('@/lib/data/familysearchPersonsAlt', () => ({
  getFamilysearchPersonsAlt: () => ({
    meta: { sourceJson: 'alt-fixture.json' },
    persons: [
      {
        id: 'fs-K1',
        kind: 'anchor' as const,
        firstName: 'Канивец',
        lastName: 'Тест',
        birthDate: '1850',
        birthPlace: 'Сумы',
      },
    ],
  }),
}));

describe('FamilySearchPersonsSection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders person name and filter control', () => {
    const { unmount } = render(withI18n(<FamilySearchPersonsSection />));
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByText('Иван Тестов')).toBeInTheDocument();
    unmount();
  });

  it('shows empty state when filter matches nothing (debounced)', () => {
    render(withI18n(<FamilySearchPersonsSection />));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzz-no-match' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByText('Не найдено')).toBeInTheDocument();
  });
});
