import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TocBookmark } from './TocBookmark';
import { withI18n } from '@/lib/i18n/test-utils';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('TocBookmark', () => {
  it('renders link to home', () => {
    render(withI18n(<TocBookmark />));
    const link = screen.getByRole('link', { name: 'Оглавление' });
    expect(link).toHaveAttribute('href', '/ru');
  });

  it('renders link to tree chapter', () => {
    render(withI18n(<TocBookmark />));
    const link = screen.getByRole('link', { name: 'Дерево' });
    expect(link).toHaveAttribute('href', '/ru');
  });
});
