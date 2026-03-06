import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavButton } from './NavButton';

describe('NavButton', () => {
  it('renders prev button', () => {
    render(<NavButton onClick={() => {}} disabled={false} direction="prev" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders next button', () => {
    render(<NavButton onClick={() => {}} disabled={false} direction="next" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<NavButton onClick={onClick} disabled={false} direction="prev" />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<NavButton onClick={onClick} disabled direction="next" />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});
