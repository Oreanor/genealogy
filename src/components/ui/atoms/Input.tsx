'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

/** Shared control look: border, bg. No focus ring. */
export const controlClass =
  'rounded border border-[var(--border-subtle)] bg-transparent px-2 py-1 text-[var(--ink)] focus:outline-none';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
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
