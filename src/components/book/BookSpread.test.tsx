import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookSpread } from './BookSpread';

describe('BookSpread', () => {
  it('renders left and right when no fullWidth', () => {
    render(
      <BookSpread left={<span>Left</span>} right={<span>Right</span>} />
    );
    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
  });

  it('renders fullWidth only when provided', () => {
    render(
      <BookSpread
        left={<span>Left</span>}
        right={<span>Right</span>}
        fullWidth={<span>Full</span>}
      />
    );
    expect(screen.getByText('Full')).toBeInTheDocument();
    expect(screen.queryByText('Left')).not.toBeInTheDocument();
    expect(screen.queryByText('Right')).not.toBeInTheDocument();
  });
});
