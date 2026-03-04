import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TocBookmark } from './TocBookmark';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('TocBookmark', () => {
  it('renders link to home', () => {
    render(<TocBookmark />);
    const link = screen.getByRole('link', { name: 'Оглавление' });
    expect(link).toHaveAttribute('href', '/');
  });
});
