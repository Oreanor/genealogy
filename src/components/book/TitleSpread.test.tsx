import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TitleSpread } from './TitleSpread';
import { withI18n } from '@/lib/i18n/test-utils';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: () => null,
}));

describe('TitleSpread', () => {
  it('renders book title', () => {
    render(withI18n(<TitleSpread />));
    expect(screen.getByRole('heading', { name: /Родословная/ })).toBeInTheDocument();
  });

  it('renders table of contents heading', () => {
    render(withI18n(<TitleSpread />));
    expect(screen.getByRole('heading', { name: 'Оглавление' })).toBeInTheDocument();
  });

  it('renders chapter links', () => {
    render(withI18n(<TitleSpread />));
    expect(screen.getByRole('link', { name: 'Семейное древо' })).toHaveAttribute(
      'href',
      '/ru/chapter/family-tree'
    );
  });
});
