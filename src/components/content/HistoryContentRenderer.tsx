'use client';

import { HISTORY_RICH_HTML_IMAGE_CLASS } from '@/lib/constants/theme';
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
            <h2 className="border-b border-(--ink-muted)/35 pb-0 text-xl font-semibold text-(--ink)">
              {entry.title}
            </h2>
          )}
          {entry.richText && (
            <div
              className={`prose min-w-0 max-w-none text-(--ink) [&_a]:text-(--link) [&_a:hover]:underline ${HISTORY_RICH_HTML_IMAGE_CLASS}`}
              dangerouslySetInnerHTML={{ __html: entry.richText }}
            />
          )}
        </article>
      ))}
    </div>
  );
}
