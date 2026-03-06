import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpreadNavigation } from './SpreadNavigation';
import { withI18n } from '@/lib/i18n/test-utils';

const mockPush = vi.fn();
let searchParams: Record<string, string | null> = { spread: '0', id: null };
vi.mock('@/lib/data/persons', async () => {
  const { PERSONS_FIXTURE } = await import('@/lib/data/__fixtures__/persons');
  return {
    getPersons: () => PERSONS_FIXTURE,
    getPersonById: (id: string) =>
      PERSONS_FIXTURE.find((p) => p.id === id) ?? null,
  };
});
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/ru',
  useSearchParams: () => ({
    get: (key: string) => searchParams[key] ?? null,
  }),
}));

describe('SpreadNavigation', () => {
  beforeEach(() => {
    searchParams = { spread: '0', id: null };
  });

  it('renders spread with content', () => {
    const spreads = [
      {
        spreadIndex: 0,
        left: {
          blocks: [
            {
              type: 'paragraph' as const,
              content: [{ type: 'text' as const, value: 'Test' }],
            },
          ],
        },
        right: {},
      },
    ];
    render(
      withI18n(
        <SpreadNavigation
          chapterSlug="history"
          chapterTitle="Истории"
          spreads={spreads}
        />
      )
    );
    expect(screen.getByText('Истории')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders person card for persons chapter with id', () => {
    searchParams = { spread: null, id: 'p001' };
    const spreads = [
      { spreadIndex: 0, left: { personId: 'p001' }, right: {} },
    ];
    render(
      withI18n(
        <SpreadNavigation
          chapterSlug="persons"
          chapterTitle="Персоны"
          spreads={spreads}
        />
      )
    );
    expect(screen.getByRole('heading', { name: /Иван Петрович/ })).toBeInTheDocument();
  });

  it('shows nav buttons when multiple spreads', () => {
    const spreads = [
      { spreadIndex: 0, left: {}, right: {} },
      { spreadIndex: 1, left: {}, right: {} },
    ];
    render(
      withI18n(
        <SpreadNavigation
          chapterSlug="history"
          chapterTitle="X"
          spreads={spreads}
        />
      )
    );
    expect(screen.getByRole('button', { name: /Previous/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next/ })).toBeInTheDocument();
  });
});
