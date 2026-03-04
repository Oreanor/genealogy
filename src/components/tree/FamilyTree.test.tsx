import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FamilyTree } from './FamilyTree';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('FamilyTree', () => {
  beforeEach(() => mockPush.mockClear());

  it('renders svg', () => {
    const { container } = render(<FamilyTree />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders person nodes', () => {
    const { container } = render(<FamilyTree />);
    expect(container.textContent).toContain('Иван Петрович');
  });

  it('navigates to person on node click', () => {
    const { container } = render(<FamilyTree />);
    const nodes = container.querySelectorAll('g[role="button"]');
    expect(nodes.length).toBeGreaterThan(0);
    fireEvent.click(nodes[0]!);
    expect(mockPush).toHaveBeenCalled();
  });
});
