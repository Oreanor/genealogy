'use client';

import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { PhotoEntry } from '@/lib/types/photo';

export interface PhotoThumbnailsProps {
  /** Optional section title above the grid */
  title?: string;
  photos: PhotoEntry[];
  selectedPhoto: PhotoEntry | null;
  onSelect: (photo: PhotoEntry, toggleBack?: boolean) => void;
}

const THUMB_CLASS =
  'relative aspect-square w-full overflow-hidden rounded border border-(--border-subtle) bg-(--paper-light) transition-opacity hover:opacity-80 focus:outline-none';

export function PhotoThumbnails({ title, photos, selectedPhoto, onSelect }: PhotoThumbnailsProps) {
  if (photos.length === 0) return null;

  const hasTitle = Boolean(title && title.trim());
  const defaultExpanded = false;
  const [expanded, setExpanded] = useState(defaultExpanded);

  const countLabel = useMemo(() => {
    const n = photos.length;
    return n === 1 ? '1' : String(n);
  }, [photos.length]);

  return (
    <div className="space-y-1">
      {hasTitle && (
        <button
          type="button"
          className="group flex w-full items-center justify-between gap-2 rounded px-1 py-0.5 text-left"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <span className="text-sm font-medium text-(--ink-muted) group-hover:text-(--ink)">
            {title}
            <span className="ml-2 text-xs text-(--ink-muted)/80">({countLabel})</span>
          </span>
          <ChevronDown
            className={`size-4 text-(--ink-muted) transition-transform ${expanded ? 'rotate-0' : '-rotate-90'}`}
            aria-hidden
          />
        </button>
      )}

      {(!hasTitle || expanded) && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => {
            const isSelected = selectedPhoto?.src === photo.src;
            return (
              <button
                key={photo.src}
                type="button"
                className={`${THUMB_CLASS} ${isSelected ? 'border-(--ink) ring-1 ring-(--ink)' : ''}`}
                onClick={() => {
                  if (selectedPhoto?.src === photo.src && photo.backSrc) {
                    onSelect(photo, true);
                  } else {
                    onSelect(photo);
                  }
                }}
                aria-pressed={isSelected}
                aria-label={photo.caption ?? photo.id}
              >
                <Image
                  src={photo.src}
                  alt={photo.caption ?? ''}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 30vw, 120px"
                  quality={55}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
