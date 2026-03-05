import { BookLayout, BookView } from '@/components/book';
import { Suspense } from 'react';

export default function HomePage() {
  return (
    <BookLayout>
      <Suspense fallback={<div className="h-[94vh] min-h-[500px] animate-pulse rounded-lg bg-[var(--paper)]" />}>
        <BookView />
      </Suspense>
    </BookLayout>
  );
}
