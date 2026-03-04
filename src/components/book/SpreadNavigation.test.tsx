import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpreadNavigation } from './SpreadNavigation';

const mockPush = vi.fn();
let searchParams: Record<string, string | null> = { spread: '0', id: null };
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
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
          blocks: [{ type: 'paragraph', content: [{ type: 'text', value: 'Test' }] }],
        },
        right: {},
      },
    ];
    render(
      <SpreadNavigation
        chapterSlug="istoriya"
        chapterTitle="История"
        spreads={spreads}
      />
    );
    expect(screen.getByText('История')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders person card for persony with id', () => {
    searchParams = { spread: null, id: 'person-1' };
    const spreads = [
      { spreadIndex: 0, left: { personId: 'person-1' }, right: {} },
    ];
    render(
      <SpreadNavigation
        chapterSlug="persony"
        chapterTitle="Персоны"
        spreads={spreads}
      />
    );
    expect(screen.getByRole('heading', { name: /Иван Петрович/ })).toBeInTheDocument();
  });

  it('shows nav buttons when multiple spreads', () => {
    const spreads = [
      { spreadIndex: 0, left: {}, right: {} },
      { spreadIndex: 1, left: {}, right: {} },
    ];
    render(
      <SpreadNavigation
        chapterSlug="istoriya"
        chapterTitle="X"
        spreads={spreads}
      />
    );
    expect(screen.getByRole('button', { name: /Назад/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Вперёд/ })).toBeInTheDocument();
  });
});
