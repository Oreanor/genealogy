import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavButton } from './NavButton';

describe('NavButton', () => {
  it('renders children', () => {
    render(<NavButton onClick={() => {}} disabled={false}>← Назад</NavButton>);
    expect(screen.getByRole('button', { name: '← Назад' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<NavButton onClick={onClick} disabled={false}>Click</NavButton>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<NavButton onClick={onClick} disabled>Click</NavButton>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});
