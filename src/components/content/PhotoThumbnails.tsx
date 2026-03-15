'use client';

import Image from 'next/image';
import { RotateCw } from 'lucide-react';
import type { PhotoEntry } from '@/lib/types/photo';

export interface PhotoThumbnailsProps {
  /** Optional section title above the grid */
  title?: string;
  photos: PhotoEntry[];
  selectedPhoto: PhotoEntry | null;
  onSelect: (photo: PhotoEntry, toggleBack?: boolean) => void;
}

const THUMB_CLASS =
  'relative h-14 w-14 shrink-0 overflow-hidden rounded border border-(--border-subtle) bg-(--paper-light) transition-opacity hover:opacity-80 focus:outline-none';

export function PhotoThumbnails({ title, photos, selectedPhoto, onSelect }: PhotoThumbnailsProps) {
  if (photos.length === 0) return null;

  return (
    <div className="space-y-1">
      {title && <p className="text-sm font-medium text-(--ink-muted)">{title}</p>}
      <div className="flex flex-wrap gap-2">
        {photos.map((photo) => (
          <button
            key={photo.src}
            type="button"
            className={THUMB_CLASS}
            onClick={() => {
              if (selectedPhoto?.src === photo.src && photo.backSrc) {
                onSelect(photo, true);
              } else {
                onSelect(photo);
              }
            }}
            aria-label={photo.caption ?? photo.id}
          >
            <Image
              src={photo.src}
              alt={photo.caption ?? ''}
              fill
              className="object-cover"
              sizes="56px"
            />
            {photo.backSrc && (
              <span className="absolute bottom-0.5 right-0.5 flex items-center justify-center rounded bg-black/50 p-0.5">
                <RotateCw className="size-3.5 text-white" aria-hidden />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
