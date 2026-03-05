import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookLayout } from './BookLayout';
import { withI18n } from '@/lib/i18n/test-utils';

vi.mock('./SectionBookmarks', () => ({
  SectionBookmarks: () => <nav aria-label="Nav">Закладки</nav>,
}));

vi.mock('@/components/ui/PageColorPickerClient', () => ({
  PageColorPicker: () => null,
}));

vi.mock('@/components/ui/LocaleSwitcher', () => ({
  LocaleSwitcher: () => null,
}));

vi.mock('@/components/ui/AdminButton', () => ({
  AdminButton: () => null,
}));

describe('BookLayout', () => {
  it('renders children', () => {
    render(withI18n(<BookLayout>Content</BookLayout>));
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('shows section bookmarks', () => {
    render(withI18n(<BookLayout>Content</BookLayout>));
    expect(screen.getByRole('navigation', { name: 'Nav' })).toBeInTheDocument();
  });
});
