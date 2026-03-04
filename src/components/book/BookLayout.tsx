import { TocBookmark } from './TocBookmark';

interface BookLayoutProps {
  children: React.ReactNode;
  showTocBookmark?: boolean;
}

export function BookLayout({
  children,
  showTocBookmark = false,
}: BookLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-100 to-amber-200/80 p-1 sm:p-2 md:p-4 lg:p-5">
      {showTocBookmark && <TocBookmark />}
      <div className="mx-auto w-full max-w-[95%] sm:max-w-[92%] md:max-w-[94%] lg:max-w-7xl">{children}</div>
    </div>
  );
}
