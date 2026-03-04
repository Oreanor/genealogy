import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookLayout } from './BookLayout';

vi.mock('./TocBookmark', () => ({
  TocBookmark: () => <a href="/">Оглавление</a>,
}));

describe('BookLayout', () => {
  it('renders children', () => {
    render(<BookLayout>Content</BookLayout>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('shows TocBookmark when showTocBookmark is true', () => {
    render(<BookLayout showTocBookmark>Content</BookLayout>);
    expect(screen.getByRole('link', { name: 'Оглавление' })).toBeInTheDocument();
  });

  it('hides TocBookmark when showTocBookmark is false', () => {
    render(<BookLayout>Content</BookLayout>);
    expect(screen.queryByRole('link', { name: 'Оглавление' })).not.toBeInTheDocument();
  });
});
