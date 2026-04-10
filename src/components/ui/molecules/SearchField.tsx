'use client';

import type { InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/atoms';

const WRAPPER_CLASS =
  'flex min-h-0 items-center gap-1.5 rounded border border-(--ink-muted)/30 bg-(--paper) py-0.5 pl-2 pr-1.5 text-xs leading-tight text-(--ink) focus-within:border-(--accent) focus-within:outline-none';

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  className?: string;
  /** Доп. классы для внешней оболочки (например `h-8` для выравнивания с селектом). */
  wrapperClassName?: string;
}

export function SearchField({ className = '', wrapperClassName = '', ...rest }: SearchFieldProps) {
  return (
    <div className={`${WRAPPER_CLASS} w-full ${wrapperClassName}`.trim()}>
      <Search className="size-3.5 shrink-0 text-(--ink-muted)" aria-hidden />
      <Input
        type="search"
        className={`min-w-0 flex-1 border-0 bg-transparent py-0 text-xs leading-tight text-(--ink) shadow-none placeholder:text-(--ink-muted)/70 focus:ring-0 focus:ring-offset-0 ${className}`.trim()}
        {...rest}
      />
    </div>
  );
}
