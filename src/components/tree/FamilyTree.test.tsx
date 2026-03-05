import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FamilyTree } from './FamilyTree';
import { withI18n } from '@/lib/i18n/test-utils';
import { PERSONS_FIXTURE } from '@/lib/data/__fixtures__/persons';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock('@/lib/data/persons', () => ({
  getPersons: () => PERSONS_FIXTURE,
  getPersonById: (id: string) =>
    PERSONS_FIXTURE.find((p) => p.id === id) ?? null,
}));

describe('FamilyTree', () => {
  beforeEach(() => mockPush.mockClear());

  it('renders tree container', () => {
    const { container } = render(withI18n(<FamilyTree />));
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders person nodes', () => {
    const { container } = render(withI18n(<FamilyTree />));
    expect(container.textContent).toMatch(/Никонец\s*Иван Петрович/);
  });

  it('navigates to person on node click', () => {
    render(withI18n(<FamilyTree />));
    const btn = screen.getByRole('button', { name: /Никонец\s*Иван Петрович/ });
    fireEvent.click(btn);
    expect(mockPush).toHaveBeenCalled();
  });
});
