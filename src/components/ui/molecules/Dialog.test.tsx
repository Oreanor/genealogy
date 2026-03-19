import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('returns null when closed', () => {
    const { container } = render(
      <Dialog
        open={false}
        onClose={vi.fn()}
        variant="alert"
        confirmLabel="OK"
      >
        Content
      </Dialog>
    );
    expect(container.firstChild).toBeNull();
  });

  it('alert variant: confirm closes and calls onConfirm', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <Dialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        variant="alert"
        confirmLabel="OK"
        title="Title"
        aria-label="Dialog"
      >
        Content
      </Dialog>
    );

    const confirm = screen.getByRole('button', { name: 'OK' });
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();

    expect(screen.queryByRole('button', { name: /Отмена|Cancel/i })).toBeNull();
  });

  it('confirm variant: cancel calls onClose only', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <Dialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        variant="confirm"
        confirmLabel="Подтвердить"
        cancelLabel="Отмена"
        title="Title"
        aria-label="Dialog"
      >
        Content
      </Dialog>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

