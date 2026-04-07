'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/atoms/Button';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Optional title above content */
  title?: string;
  /** Message or content */
  children: React.ReactNode;
  /** One button (alert) or two (confirm) */
  variant: 'alert' | 'confirm';
  /** Label for primary action (Confirm / OK) */
  confirmLabel: string;
  /** Label for cancel (confirm only) */
  cancelLabel?: string;
  /** Called when user confirms; then onClose is called */
  onConfirm?: () => void;
  /** Optional aria-label for the dialog */
  'aria-label'?: string;
}

/**
 * Modal dialog: overlay + panel with title, content, and buttons.
 * Use variant="alert" for one button, variant="confirm" for Cancel + Confirm.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  variant,
  confirmLabel,
  cancelLabel,
  onConfirm,
  'aria-label': ariaLabel,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-label={ariaLabel ?? title}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-xl border-2 border-(--border) bg-(--book-bg) p-5 shadow-xl focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="mb-3 text-center text-lg font-semibold text-(--ink)">
            {title}
          </h2>
        )}
        <div className="mb-5 text-center text-(--ink)">
          {children}
        </div>
        <div className="flex justify-center gap-2">
          {variant === 'confirm' && cancelLabel && (
            <Button variant="secondary" onClick={onClose}>
              {cancelLabel}
            </Button>
          )}
          <Button variant="primary" onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
