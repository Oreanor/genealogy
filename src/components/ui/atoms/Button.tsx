'use client';

import type { ButtonHTMLAttributes } from 'react';

const base =
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50';

const variants = {
  primary:
    'bg-[var(--accent)] text-[var(--nav-btn-ink)] hover:opacity-90 shadow-md',
  secondary:
    'border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--paper-light)]',
  ghost:
    'text-[var(--ink-muted)] hover:bg-[var(--paper-light)] hover:text-[var(--ink)]',
  danger:
    'text-[var(--ink-muted)] hover:bg-red-500/20 hover:text-red-600',
  icon:
    'h-9 w-9 shrink-0 border-2 border-[var(--border)] bg-[var(--paper)] text-[var(--ink)] shadow-md hover:shadow-lg md:h-11 md:w-11',
} as const;

const sizes = {
  sm: 'px-2 py-1',
  md: 'px-4 py-2',
  icon: '',
} as const;

export type ButtonVariant = keyof typeof variants;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: keyof typeof sizes;
  children: React.ReactNode;
}

export function Button({
  variant = 'secondary',
  size = variant === 'icon' ? 'icon' : 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const sizeClass = variant === 'icon' ? sizes.icon : sizes[size];
  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${sizeClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
