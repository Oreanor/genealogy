interface BookPageProps {
  children?: React.ReactNode;
  className?: string;
}

export function BookPage({ children = null, className = '' }: BookPageProps) {
  return (
    <div
      className={`flex min-h-0 min-w-0 h-full w-full flex-col bg-(--paper) p-6 sm:p-8 md:p-9 shadow-inner ${className}`}
    >
      {children}
    </div>
  );
}
