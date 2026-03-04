import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FamilyTree } from './FamilyTree';
import { withI18n } from '@/lib/i18n/test-utils';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('FamilyTree', () => {
  beforeEach(() => mockPush.mockClear());

  it('renders tree container', () => {
    const { container } = render(withI18n(<FamilyTree />));
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders person nodes', () => {
    const { container } = render(withI18n(<FamilyTree />));
    expect(container.textContent).toContain('Иван Петрович');
  });

  it('navigates to person on node click', () => {
    render(withI18n(<FamilyTree />));
    const btn = screen.getByRole('button', { name: 'Иван Петрович Никонец' });
    fireEvent.click(btn);
    expect(mockPush).toHaveBeenCalled();
  });
});
