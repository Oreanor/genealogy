'use client';

import type { InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/atoms';

const WRAPPER_CLASS =
  'flex items-center gap-2 rounded-md border border-(--border-subtle) bg-(--book-bg) pl-3 pr-2 py-1.5 focus-within:outline-none';

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  className?: string;
}

export function SearchField({ className = '', ...rest }: SearchFieldProps) {
  return (
    <div className={WRAPPER_CLASS}>
      <Search className="size-5 shrink-0 text-(--ink-muted)" aria-hidden />
      <Input
        type="search"
        className={`min-w-0 flex-1 border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 ${className}`.trim()}
        {...rest}
      />
    </div>
  );
}
