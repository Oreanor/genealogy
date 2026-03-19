import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { HistoryEntry } from '@/lib/types/history';
import { HistoryContentRenderer } from './HistoryContentRenderer';

describe('HistoryContentRenderer', () => {
  it('renders title and richText only when provided', () => {
    const entries: HistoryEntry[] = [
      {
        title: 'Entry title',
        richText: '<p>Rich <strong>text</strong></p>',
        personIds: [],
      },
      {
        title: '',
        richText: '',
        personIds: [],
      },
    ];

    render(<HistoryContentRenderer entries={entries} />);

    expect(screen.getByText('Entry title')).toBeInTheDocument();
    expect(screen.getByText('Rich')).toBeInTheDocument();
    expect(screen.getByText('text')).toBeInTheDocument();
  });
});

