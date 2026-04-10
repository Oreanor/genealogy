'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Eye, EyeOff, File, Files } from 'lucide-react';
import { Button } from '@/components/ui/atoms';
import type { PhotoEntry } from '@/lib/types/photo';
import type { TranslationFn } from '@/lib/i18n/types';
import {
  isNew,
  type AdminPhotoGroupSection,
  type PhotoItem,
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
            const hasBackSide =
              backIdxByFrontSrc.has(photo.src) || Boolean(photo.backSrc);

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

                  <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white shadow"
                      title={hasBackSide ? t('adminEditBack') : undefined}
                      aria-hidden
                    >
                      {hasBackSide ? <Files className="size-3.5" /> : <File className="size-3.5" />}
                    </span>

                    {isNew(photo) && (
                      <span className="rounded bg-amber-500 px-1.5 py-0.5 text-xs font-medium text-white shadow">
                        {t('adminNew')}
                      </span>
                    )}
                  </div>
                </Button>

                <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetConfirmDeleteIdx(idx);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-white/60 bg-red-600 text-sm font-semibold leading-none text-white shadow transition-colors hover:bg-red-700"
                    title={t('adminRemove')}
                    aria-label={t('adminRemove')}
                  >
                    <span aria-hidden>×</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdatePhoto(idx, 'hidden', !photo.hidden);
                    }}
                    className={`flex h-6 w-6 items-center justify-center rounded-full border shadow transition-colors ${
                      photo.hidden
                        ? 'border-(--ink-muted) bg-(--ink-muted) text-white'
                        : 'border-(--border-subtle) bg-(--paper-light)/95 text-(--ink)'
                    }`}
                    title={photo.hidden ? t('adminShow') : t('adminHide')}
                    aria-label={photo.hidden ? t('adminShow') : t('adminHide')}
                  >
                    {photo.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>

                <span className="mt-0.5 block truncate px-1 text-center text-xs leading-tight text-(--ink-muted)" title={photo.src}>
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
