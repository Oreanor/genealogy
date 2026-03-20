'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Eye, EyeOff, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/atoms';
import type { PhotoEntry } from '@/lib/types/photo';
import {
  isNew,
  type AdminPhotoGroupSection,
  type PhotoItem,
  type TranslationFn,
} from './adminPhotosTabUtils';

type AdminPhotoGroupProps = {
  title: string;
  items: PhotoItem[];
  backIdxByFrontSrc: Map<string, number>;
  photoIdxBySrc: Map<string, number>;
  t: TranslationFn;
  onSelectPhotoIdx: (idx: number) => void;
  onSetConfirmDeleteIdx: (idx: number) => void;
  onUpdatePhoto: (index: number, field: keyof PhotoEntry, value: unknown) => void;
};

function AdminPhotoGroup({
  title,
  items,
  backIdxByFrontSrc,
  photoIdxBySrc,
  t,
  onSelectPhotoIdx,
  onSetConfirmDeleteIdx,
  onUpdatePhoto,
}: AdminPhotoGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const countLabel = useMemo(() => (items.length === 1 ? '1' : String(items.length)), [items.length]);

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="group inline-flex items-center gap-2 rounded px-1 py-0.5 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="inline-flex items-center gap-0.5 text-sm font-medium text-(--ink-muted) group-hover:text-(--ink)">
          {title}
          <span className="ml-1 text-xs text-(--ink-muted)/80">({countLabel})</span>
          <ChevronDown
            className={`size-4 text-(--ink-muted) transition-transform ${
              expanded ? 'rotate-0' : '-rotate-90'
            }`}
            aria-hidden
          />
        </span>
      </button>

      {expanded && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-3">
          {items.map(({ photo, idx }) => {
            const backIdx =
              backIdxByFrontSrc.get(photo.src) ??
              (photo.backSrc ? photoIdxBySrc.get(photo.backSrc) : undefined);

            return (
              <div key={photo.src} className="relative">
                <Button
                  variant="secondary"
                  onClick={() => onSelectPhotoIdx(idx)}
                  className={`relative w-full overflow-hidden rounded-lg border-2 border-(--border-subtle) bg-(--paper) p-0 aspect-3/4 hover:border-(--accent) hover:shadow-lg ${
                    photo.hidden ? 'opacity-40' : ''
                  }`}
                >
                  <span className="block aspect-3/4 w-full overflow-hidden bg-(--paper-light)">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.src} alt="" className="h-full w-full object-cover" />
                  </span>

                  {backIdx !== undefined && (
                    <span
                      role="presentation"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPhotoIdx(backIdx);
                      }}
                      className="absolute bottom-0.5 right-0.5 flex cursor-pointer items-center justify-center rounded bg-black/50 p-0.5"
                      aria-label={t('adminEditBack')}
                      title={t('adminEditBack')}
                    >
                      <RotateCw className="size-3.5 text-white" aria-hidden />
                    </span>
                  )}

                  {isNew(photo) && (
                    <span className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-xs font-medium text-white shadow">
                      {t('adminNew')}
                    </span>
                  )}
                </Button>

                <span
                  role="presentation"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetConfirmDeleteIdx(idx);
                  }}
                  className="absolute right-1 top-1 z-10 flex cursor-pointer items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow hover:bg-red-700"
                  title={t('adminRemove')}
                  aria-label={t('adminRemove')}
                >
                  ✕
                </span>

                <span
                  role="presentation"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdatePhoto(idx, 'hidden', !photo.hidden);
                  }}
                  className={`absolute bottom-6 right-1 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-(--border-subtle) shadow ${
                    photo.hidden ? 'bg-(--ink-muted) text-white' : 'bg-(--paper-light) text-(--ink)'
                  }`}
                  title={photo.hidden ? t('adminShow') : t('adminHide')}
                  aria-label={photo.hidden ? t('adminShow') : t('adminHide')}
                >
                  {photo.hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </span>

                <span
                  className="mt-0.5 block truncate text-center text-xs leading-tight text-(--ink-muted)"
                  title={photo.src}
                >
                  {photo.src.split('/').pop()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type Props = {
  groups: AdminPhotoGroupSection[];
  backIdxByFrontSrc: Map<string, number>;
  photoIdxBySrc: Map<string, number>;
  t: TranslationFn;
  onSelectPhotoIdx: (idx: number) => void;
  onSetConfirmDeleteIdx: (idx: number) => void;
  onUpdatePhoto: (index: number, field: keyof PhotoEntry, value: unknown) => void;
};

export function AdminPhotosGroups({
  groups,
  backIdxByFrontSrc,
  photoIdxBySrc,
  t,
  onSelectPhotoIdx,
  onSetConfirmDeleteIdx,
  onUpdatePhoto,
}: Props) {
  return (
    <>
      {groups.map((group) => (
        <AdminPhotoGroup
          key={group.key}
          title={group.title}
          items={group.items}
          backIdxByFrontSrc={backIdxByFrontSrc}
          photoIdxBySrc={photoIdxBySrc}
          t={t}
          onSelectPhotoIdx={onSelectPhotoIdx}
          onSetConfirmDeleteIdx={onSetConfirmDeleteIdx}
          onUpdatePhoto={onUpdatePhoto}
        />
      ))}
    </>
  );
}
