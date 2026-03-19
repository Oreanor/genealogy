import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RootPersonProvider, useRootPersonId, useSetRootPersonId } from './RootPersonContext';
import { getRootPersonId } from '@/lib/data/root';

vi.mock('@/lib/data/root', () => ({
  getRootPersonId: vi.fn(),
}));

const getRootPersonIdMock = vi.mocked(getRootPersonId);

function Consumer() {
  const id = useRootPersonId();
  const setId = useSetRootPersonId();

  return (
    <div>
      <span data-testid="root-id">{id}</span>
      <button type="button" onClick={() => setId('updated-root')}>
        set
      </button>
    </div>
  );
}

describe('RootPersonContext', () => {
  it('without provider: falls back to getRootPersonId and noop setter', () => {
    getRootPersonIdMock.mockReturnValue('root-fallback');

    render(<Consumer />);
    expect(screen.getByTestId('root-id')).toHaveTextContent('root-fallback');

    fireEvent.click(screen.getByText(/set/i));
    // No provider => setter is noop => value should remain.
    expect(screen.getByTestId('root-id')).toHaveTextContent('root-fallback');
  });

  it('with provider: uses provider value and updates via setRootPersonId', () => {
    getRootPersonIdMock.mockReturnValue('root-from-provider');

    render(
      <RootPersonProvider>
        <Consumer />
      </RootPersonProvider>
    );

    expect(screen.getByTestId('root-id')).toHaveTextContent('root-from-provider');

    fireEvent.click(screen.getByText(/set/i));
    expect(screen.getByTestId('root-id')).toHaveTextContent('updated-root');
  });
});

