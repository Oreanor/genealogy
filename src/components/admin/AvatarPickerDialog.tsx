'use client';

import { Button } from '@/components/ui/atoms';
import type { Person } from '@/lib/types/person';
import type { AvatarSource } from '@/lib/data/photos';
import type { TranslationFn } from './adminPersonsTableUtils';

type Props = {
  open: boolean;
  person: Person | null;
  options: AvatarSource[];
  onClose: () => void;
  onSelect: (src?: string) => void;
  renderFaceThumbnail: (source: AvatarSource, size?: number) => React.ReactNode;
  t: TranslationFn;
};

export function AvatarPickerDialog({
  open,
  person,
  options,
  onClose,
  onSelect,
  renderFaceThumbnail,
  t,
}: Props) {
  if (!open || !person) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal
      aria-label={t('adminChoosePortrait')}
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border-2 border-(--border) bg-(--surface) p-4 shadow-xl">
        <h2 className="mb-3 text-center text-lg font-semibold text-(--ink)">
          {t('adminChoosePortrait')}
        </h2>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {options.length === 0 ? (
            <p className="text-center text-(--ink-muted)">{t('noPhotosYet')}</p>
          ) : (
            <div className="flex justify-center">
              <div className="flex w-full max-w-3xl flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(undefined);
                    onClose();
                  }}
                  className="flex h-[88px] w-[88px] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-(--border-subtle) p-2 text-(--ink-muted) hover:border-(--accent) hover:bg-(--paper-light)"
                >
                  <span className="text-2xl">—</span>
                  <span className="text-xs">{t('adminAvatarDefault')}</span>
                </button>
                {options.map((opt, i) => (
                  <button
                    key={`${opt.src}-${i}`}
                    type="button"
                    onClick={() => {
                      onSelect(opt.src);
                      onClose();
                    }}
                    className={`flex h-[88px] w-[88px] flex-col items-center justify-center gap-1 rounded-lg border-2 p-2 focus:outline-none ${
                      person.avatarPhotoSrc === opt.src
                        ? 'border-(--accent) bg-(--paper-light)'
                        : 'border-(--border-subtle) hover:border-(--accent)'
                    }`}
                  >
                    {renderFaceThumbnail(opt, 56)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 flex justify-center">
          <Button variant="secondary" onClick={onClose}>
            {t('adminCancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}
