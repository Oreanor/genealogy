'use client';

import Link from 'next/link';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { getPersonById } from '@/lib/data/persons';
import { getFullName } from '@/lib/utils/person';
import { CONTENT_LINK_CLASS } from '@/lib/constants/theme';
import type { HistoryEntry } from '@/lib/types/history';

interface HistoryContentRendererProps {
  entries: HistoryEntry[];
}

export function HistoryContentRenderer({ entries }: HistoryContentRendererProps) {
  const { routes } = useLocaleRoutes();

  return (
    <div className="flex flex-col gap-10">
      {entries.map((entry, idx) => (
        <article key={idx} className="book-serif flex flex-col gap-4">
          {entry.title && (
            <h2 className="text-xl font-semibold text-[var(--ink)]">{entry.title}</h2>
          )}
          {entry.richText && (
            <div
              className="prose max-w-none text-[var(--ink)] [&_a]:text-[var(--link)] [&_a:hover]:underline"
              dangerouslySetInnerHTML={{ __html: entry.richText }}
            />
          )}
          {entry.personIds.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {entry.personIds.map((id) => {
                const person = getPersonById(id);
                return (
                  <Link
                    key={id}
                    href={routes.person(id)}
                    className={`rounded px-3 py-2 text-base ${CONTENT_LINK_CLASS}`}
                  >
                    {getFullName(person!) || id}
                  </Link>
                );
              })}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
