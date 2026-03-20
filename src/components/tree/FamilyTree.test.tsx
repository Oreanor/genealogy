import type { ReactElement } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FamilyTree } from './FamilyTree';
import { withI18n } from '@/lib/i18n/test-utils';
import { PERSONS_FIXTURE } from '@/lib/data/__fixtures__/persons';
import { RootPersonProvider } from '@/lib/contexts/RootPersonContext';

vi.mock('@/lib/data/persons', () => ({
  getPersons: () => PERSONS_FIXTURE,
  getPersonById: (id: string) =>
    PERSONS_FIXTURE.find((p) => p.id === id) ?? null,
  subscribePersonsOverlay: () => () => {},
}));

vi.mock('@/lib/data/root', () => ({
  getRootPersonId: () => 'p001',
}));

function renderTree(ui: ReactElement) {
  return render(withI18n(<RootPersonProvider>{ui}</RootPersonProvider>));
}

describe('FamilyTree', () => {
  const onPersonClick = vi.fn();

  beforeEach(() => onPersonClick.mockClear());

  it('renders tree container', () => {
    const { container } = renderTree(<FamilyTree onPersonClick={onPersonClick} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders person nodes', () => {
    const { container } = renderTree(<FamilyTree onPersonClick={onPersonClick} />);
    expect(container.textContent).toMatch(/Никонец\s*Иван\s*Петрович/);
  });

  it('calls onPersonClick when node is clicked', () => {
    renderTree(<FamilyTree onPersonClick={onPersonClick} />);
    const buttons = screen.getAllByRole('button', { name: /Никонец\s*Иван\s*Петрович/ });
    fireEvent.click(buttons[0]!);
    expect(onPersonClick).toHaveBeenCalledWith('p001');
  });
});
