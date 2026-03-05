import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRef, useState } from 'react';
import { useClickOutside } from './useClickOutside';

function TestComponent() {
  const [open, setOpen] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  return (
    <div>
      <div ref={ref}>
        <button type="button">inside</button>
      </div>
      {open && <span>open</span>}
    </div>
  );
}

describe('useClickOutside', () => {
  it('closes when clicking outside', () => {
    render(<TestComponent />);
    expect(screen.getByText('open')).toBeInTheDocument();
    fireEvent.click(screen.getByText('inside'));
    expect(screen.getByText('open')).toBeInTheDocument();
    fireEvent.click(document.body);
    expect(screen.queryByText('open')).not.toBeInTheDocument();
  });
});
