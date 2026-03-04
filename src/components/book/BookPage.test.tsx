import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookPage } from './BookPage';

describe('BookPage', () => {
  it('renders children', () => {
    render(<BookPage>Page content</BookPage>);
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<BookPage className="custom">X</BookPage>);
    expect(container.firstChild).toHaveClass('custom');
  });
});
