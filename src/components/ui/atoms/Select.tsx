'use client';

import type { SelectHTMLAttributes } from 'react';
import { controlClass } from './Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

export function Select({ className = '', ...rest }: SelectProps) {
  return (
    <select
      className={`w-full min-w-0 ${controlClass} ${className}`.trim()}
      {...rest}
    />
  );
}
