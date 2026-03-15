'use client';

import type { HistoryEntry } from '@/lib/types/history';

interface HistoryContentRendererProps {
  entries: HistoryEntry[];
}

export function HistoryContentRenderer({ entries }: HistoryContentRendererProps) {
  return (
    <div className="flex flex-col gap-10">
      {entries.map((entry, idx) => (
        <article key={idx} className="book-serif flex flex-col gap-4">
          {entry.title && (
            <h2 className="text-xl font-semibold text-(--ink)">{entry.title}</h2>
          )}
          {entry.richText && (
            <div
              className="prose max-w-none text-(--ink) [&_a]:text-(--link) [&_a:hover]:underline"
              dangerouslySetInnerHTML={{ __html: entry.richText }}
            />
          )}
        </article>
      ))}
    </div>
  );
}
