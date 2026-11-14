import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TranslationFn } from '@/lib/i18n/types';
import { ArchiveNameSearch } from './ArchiveNameSearch';

const t = ((key: string) => key) as TranslationFn;
const NAMES = ['Ivan', 'Ivanna', 'Ivanko'];

function Harness({ onPick }: { onPick: (name: string) => void }) {
  const [query, setQuery] = useState('');
  const suggestions = query.trim().length >= 3 ? NAMES.filter((n) => n.toLowerCase().startsWith(query.toLowerCase())) : [];
  return (
    <ArchiveNameSearch
      id="test-search"
      t={t}
      query={query}
      onQueryChange={setQuery}
      suggestions={suggestions}
      toOption={(name) => ({ key: name, primary: name, secondary: 'born', ariaLabel: name })}
      onPick={onPick}
    />
  );
}

describe('ArchiveNameSearch', () => {
  it('stays collapsed until the query is long enough', async () => {
    const user = userEvent.setup();
    render(<Harness onPick={vi.fn()} />);
    const input = screen.getByRole('combobox');

    await user.type(input, 'iv');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.type(input, 'a');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('supports arrow navigation and Enter to pick', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<Harness onPick={onPick} />);
    const input = screen.getByRole('combobox');

    await user.type(input, 'iva');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    const options = screen.getAllByRole('option');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', options[1]!.id);

    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(screen.getAllByRole('option')[2]).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Enter}');
    expect(onPick).toHaveBeenCalledWith('Ivanko');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes on Escape and shows the empty state', async () => {
    const user = userEvent.setup();
    render(<Harness onPick={vi.fn()} />);
    const input = screen.getByRole('combobox');

    await user.type(input, 'xyz');
    expect(screen.getByText('mapArchiveSearchNoResults')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('picks an option on pointer down', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<Harness onPick={onPick} />);

    await user.type(screen.getByRole('combobox'), 'ivann');
    await user.pointer({ keys: '[MouseLeft>]', target: screen.getByRole('option', { name: 'Ivanna' }) });
    expect(onPick).toHaveBeenCalledWith('Ivanna');
  });
});
