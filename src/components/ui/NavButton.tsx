interface NavButtonProps {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}

const NAV_BUTTON_CLASS =
  'rounded-lg px-3 py-1.5 text-sm font-medium shadow-md transition-colors disabled:cursor-not-allowed disabled:opacity-40 md:min-h-[44px] md:min-w-[44px] md:px-5 md:py-3 bg-[var(--nav-btn)] text-[var(--nav-btn-ink)] hover:enabled:bg-[var(--nav-btn-hover)]';

export function NavButton({ onClick, disabled, children }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={NAV_BUTTON_CLASS}
    >
      {children}
    </button>
  );
}
