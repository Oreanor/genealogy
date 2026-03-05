interface BookPageProps {
  children?: React.ReactNode;
  className?: string;
}

export function BookPage({ children = null, className = '' }: BookPageProps) {
  return (
    <div
      className={`flex min-h-0 min-w-0 h-full w-full flex-col bg-[var(--paper)] p-4 sm:p-5 md:p-6 shadow-inner ${className}`}
    >
      {children}
    </div>
  );
}
