import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavButtonProps {
  onClick: () => void;
  disabled: boolean;
  direction: 'prev' | 'next';
  'aria-label'?: string;
}

export function NavButton({ onClick, disabled, direction, 'aria-label': ariaLabel }: NavButtonProps) {
  const isLeft = direction === 'prev';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? (isLeft ? 'Previous' : 'Next')}
      className={`flex h-10 w-7 items-center justify-center shadow-md transition-colors disabled:cursor-not-allowed disabled:opacity-30 bg-(--nav-btn) text-(--nav-btn-ink) hover:enabled:bg-(--nav-btn-hover) md:h-12 md:w-8 ${
        isLeft ? 'rounded-l-md' : 'rounded-r-md'
      }`}
    >
      {isLeft ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
    </button>
  );
}
