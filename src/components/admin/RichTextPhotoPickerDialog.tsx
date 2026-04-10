'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/atoms';
import type { TranslationFn } from '@/lib/i18n/types';
import type { PhotoEntry } from '@/lib/types/photo';
import { buildAdminPhotoGroups, buildPhotoIndexMaps } from './adminPhotosTabUtils';

export interface RichTextPhotoPickerDialogProps {
  open: boolean;
  onClose: () => void;
  photos: PhotoEntry[];
  onPick: (src: string) => void;
  t: TranslationFn;
}

export function RichTextPhotoPickerDialog({
  open,
  onClose,
  photos,
  onPick,
  t,
}: RichTextPhotoPickerDialogProps) {
  const { photoIdxBySrc } = buildPhotoIndexMaps(photos);
  const groups = buildAdminPhotoGroups(photos, photoIdxBySrc, t).filter((g) => g.items.length > 0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label={t('dialogClose')}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="rich-text-photo-picker-title"
        className="relative flex max-h-[min(85vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-(--border) bg-(--paper) shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-(--border-subtle) px-4 py-3">
          <h2 id="rich-text-photo-picker-title" className="text-base font-semibold text-(--ink)">
            {t('adminRichTextPickImage')}
          </h2>
          <Button type="button" variant="secondary" className="h-8 w-8 shrink-0 p-0" onClick={onClose} aria-label={t('dialogClose')}>
            <X className="size-4" aria-hidden />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {groups.length === 0 ? (
            <p className="text-sm text-(--ink-muted)">{t('adminNoPhotosInGallery')}</p>
          ) : (
            <div className="flex flex-col gap-8">
              {groups.map((section) => (
                <section key={section.key} className="space-y-2">
                  <h3 className="text-sm font-medium text-(--ink-muted)">{section.title}</h3>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
                    {section.items.map(({ photo }) => (
                      <button
                        key={photo.src}
                        type="button"
                        className="group overflow-hidden rounded-lg border border-(--border-subtle) bg-(--paper-light) transition hover:border-(--accent) hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
                        onClick={() => {
                          onPick(photo.src);
                          onClose();
                        }}
                        title={photo.caption?.trim() || photo.src}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <span className="block aspect-3/4 w-full overflow-hidden">
                          <img
                            src={photo.src}
                            alt=""
                            className={`h-full w-full object-cover ${photo.hidden ? 'opacity-50' : ''}`}
                          />
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
