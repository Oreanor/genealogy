import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FamilyTree } from './FamilyTree';
import { withI18n } from '@/lib/i18n/test-utils';
import { PERSONS_FIXTURE } from '@/lib/data/__fixtures__/persons';

vi.mock('@/lib/data/persons', () => ({
  getPersons: () => PERSONS_FIXTURE,
  getPersonById: (id: string) =>
    PERSONS_FIXTURE.find((p) => p.id === id) ?? null,
}));

describe('FamilyTree', () => {
  const onPersonClick = vi.fn();

  beforeEach(() => onPersonClick.mockClear());

  it('renders tree container', () => {
    const { container } = render(withI18n(<FamilyTree onPersonClick={onPersonClick} />));
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders person nodes', () => {
    const { container } = render(withI18n(<FamilyTree onPersonClick={onPersonClick} />));
    expect(container.textContent).toMatch(/Никонец\s*Иван Петрович/);
  });

  it('calls onPersonClick when node is clicked', () => {
    render(withI18n(<FamilyTree onPersonClick={onPersonClick} />));
    const btn = screen.getByRole('button', { name: /Никонец\s*Иван Петрович/ });
    fireEvent.click(btn);
    expect(onPersonClick).toHaveBeenCalledWith('p001');
  });
});
