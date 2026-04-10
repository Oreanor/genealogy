'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

/** Shared control look: border, bg. No focus ring. */
export const controlClass =
  'rounded border border-(--border-subtle) bg-(--book-bg) px-2 py-1 text-(--ink) focus:outline-none';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className = '', ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full min-w-0 ${controlClass} ${className}`.trim()}
        {...rest}
      />
    );
  }
);
