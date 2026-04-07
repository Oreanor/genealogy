'use client';

import Link, { type LinkProps } from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type SquareTone = 'default' | 'inverse' | 'surface';

function toneClass(tone: SquareTone): string {
  if (tone === 'inverse') {
    return 'border-(--ink) bg-(--ink) text-(--paper) hover:opacity-90';
  }
  if (tone === 'surface') {
    return 'border-(--border) bg-(--book-bg) text-(--ink)';
  }
  return 'border-(--border) bg-(--paper) text-(--ink)';
}

const BASE_CLASS =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 shadow-md transition-shadow hover:shadow-lg md:h-9 md:w-9';

interface CommonProps {
  label: string;
  children: ReactNode;
  tone?: SquareTone;
  className?: string;
}

interface SquareIconButtonProps
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {}

export function SquareIconButton({
  label,
  children,
  tone = 'default',
  className = '',
  type = 'button',
  ...rest
}: SquareIconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={`${BASE_CLASS} ${toneClass(tone)} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}

interface SquareIconLinkProps
  extends CommonProps,
    Omit<LinkProps, 'href'> {
  href: LinkProps['href'];
  ariaCurrent?: 'page';
}

export function SquareIconLink({
  label,
  children,
  tone = 'default',
  className = '',
  href,
  ariaCurrent,
  ...rest
}: SquareIconLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={ariaCurrent}
      className={`${BASE_CLASS} ${toneClass(tone)} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Link>
  );
}
