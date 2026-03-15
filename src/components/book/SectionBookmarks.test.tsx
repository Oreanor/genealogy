import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionBookmarks } from './SectionBookmarks';
import { withI18n } from '@/lib/i18n/test-utils';

vi.mock('next/navigation', () => ({
  usePathname: () => '/ru',
  useSearchParams: () => new URLSearchParams('section=persons'),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('SectionBookmarks', () => {
  it('renders nav with section links', () => {
    render(withI18n(<SectionBookmarks />));
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it('tree link has pathname without query', () => {
    render(withI18n(<SectionBookmarks />));
    const links = screen.getAllByRole('link');
    const treeLink = links.find((l) => l.getAttribute('href') === '/ru');
    expect(treeLink).toBeDefined();
  });
});
