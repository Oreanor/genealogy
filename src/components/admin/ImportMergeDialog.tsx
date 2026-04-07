'use client';

import { useState } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import { Button } from '@/components/ui/atoms/Button';
import {
  buildDefaultResolutions,
  changedKeys,
  type MergeConflict,
  type MergeResult,
  type MergeResolutions,
  type ConflictResolution,
} from '@/lib/utils/dataMerge';
import type { Person } from '@/lib/types/person';
import type { PhotoEntry } from '@/lib/types/photo';
import type { HistoryEntry } from '@/lib/types/history';

interface ImportMergeDialogProps {
  readonly merge: MergeResult;
  readonly onApply: (resolutions: MergeResolutions) => void;
  readonly onCancel: () => void;
  /** Override title i18n key (default: 'adminImportJson'). */
  readonly title?: string;
}

const PERSON_FIELD_LABELS: Record<string, string> = {
  firstName: 'adminFirstName',
  patronymic: 'adminPatronymic',
  lastName: 'adminLastName',
  birthDate: 'adminBirthDate',
  deathDate: 'adminDeathDate',
  birthPlace: 'adminBirthPlace',
  occupation: 'adminOccupation',
  gender: 'adminGender',
  fatherId: 'adminFatherColumn',
  motherId: 'adminMotherColumn',
  avatarPhotoSrc: 'adminAvatarColumn',
};

function FieldDiff({
  label,
  mine,
  theirs,
}: {
  readonly label: string;
  readonly mine: string;
  readonly theirs: string;
}) {
  return (
    <div className="flex gap-1 text-xs leading-tight">
      <span className="shrink-0 text-(--ink-muted)">{label}:</span>
      <span className="line-through text-(--ink-muted)/60">
        {mine || '—'}
      </span>
      <span className="font-medium">→ {theirs || '—'}</span>
    </div>
  );
}

function ToggleButton({
  value,
  onToggle,
}: {
  readonly value: ConflictResolution;
  readonly onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
        value === 'keep'
          ? 'bg-(--nav-btn) text-(--nav-btn-ink)'
          : 'bg-amber-100 text-amber-800'
      }`}
    >
      {value === 'keep' ? '← mine' : '→ theirs'}
    </button>
  );
}

function PersonConflictRow({
  conflict,
  resolution,
  onToggle,
  t,
}: {
  readonly conflict: MergeConflict<Person>;
  readonly resolution: ConflictResolution;
  readonly onToggle: () => void;
  readonly t: (key: string) => string;
}) {
  const keys = changedKeys(
    conflict.existing as unknown as Record<string, unknown>,
    conflict.incoming as unknown as Record<string, unknown>
  );
  const name = [
    conflict.existing.lastName,
    conflict.existing.firstName,
    conflict.existing.patronymic,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="rounded-lg border border-(--border) px-3 py-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{name || conflict.existing.id}</span>
        <ToggleButton value={resolution} onToggle={onToggle} />
      </div>
      <div className="space-y-0.5">
        {keys.map((key) => (
          <FieldDiff
            key={key}
            label={t(PERSON_FIELD_LABELS[key] ?? key)}
            mine={String(
              (conflict.existing as unknown as Record<string, unknown>)[key] ?? ''
            )}
            theirs={String(
              (conflict.incoming as unknown as Record<string, unknown>)[key] ?? ''
            )}
          />
        ))}
      </div>
    </div>
  );
}

function PhotoConflictRow({
  conflict,
  resolution,
  onToggle,
}: {
  readonly conflict: MergeConflict<PhotoEntry>;
  readonly resolution: ConflictResolution;
  readonly onToggle: () => void;
}) {
  const keys = changedKeys(
    conflict.existing as unknown as Record<string, unknown>,
    conflict.incoming as unknown as Record<string, unknown>
  );
  const label =
    conflict.existing.caption ?? conflict.existing.src ?? conflict.existing.id;

  return (
    <div className="rounded-lg border border-(--border) px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{label}</span>
        <ToggleButton value={resolution} onToggle={onToggle} />
      </div>
      <p className="mt-0.5 text-xs text-(--ink-muted)">
        {keys.join(', ')}
      </p>
    </div>
  );
}

function HistoryConflictRow({
  conflict,
  resolution,
  onToggle,
}: {
  readonly conflict: MergeConflict<HistoryEntry>;
  readonly resolution: ConflictResolution;
  readonly onToggle: () => void;
}) {
  const keys = changedKeys(
    conflict.existing as unknown as Record<string, unknown>,
    conflict.incoming as unknown as Record<string, unknown>
  );

  return (
    <div className="rounded-lg border border-(--border) px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">
          {conflict.existing.title}
        </span>
        <ToggleButton value={resolution} onToggle={onToggle} />
      </div>
      <p className="mt-0.5 text-xs text-(--ink-muted)">
        {keys.join(', ')}
      </p>
    </div>
  );
}

function SectionHeader({ label, count }: { readonly label: string; readonly count: number }) {
  return (
    <h3 className="mt-3 mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-(--ink-muted)">
      {label}
      <span className="rounded-full bg-amber-100 px-1.5 text-amber-800">
        {count}
      </span>
    </h3>
  );
}

export function ImportMergeDialog({
  merge,
  onApply,
  onCancel,
  title: titleKey,
}: ImportMergeDialogProps) {
  const t = useTranslations();
  const [resolutions, setResolutions] = useState<MergeResolutions>(() =>
    buildDefaultResolutions(merge)
  );

  const toggleRecord = (
    section: 'persons' | 'photos' | 'history',
    index: number
  ) => {
    setResolutions((prev) => {
      const arr = [...prev[section]];
      arr[index] = arr[index] === 'keep' ? 'take' : 'keep';
      return { ...prev, [section]: arr };
    });
  };

  const setAll = (value: ConflictResolution) => {
    setResolutions({
      persons: merge.persons.conflicts.map(() => value),
      photos: merge.photos.conflicts.map(() => value),
      history: merge.history.conflicts.map(() => value),
      rootPersonId: value,
      placeFallbacks: value,
    });
  };

  const totalAdded =
    merge.persons.toAdd.length +
    merge.photos.toAdd.length +
    merge.history.toAdd.length;

  const totalConflicts =
    merge.persons.conflicts.length +
    merge.photos.conflicts.length +
    merge.history.conflicts.length +
    (merge.rootConflict ? 1 : 0) +
    (merge.placeFallbacksConflict ? 1 : 0);

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal
        aria-label={t(titleKey ?? 'adminImportJson')}
        tabIndex={-1}
        className="relative z-10 flex max-h-[80vh] w-full max-w-md flex-col rounded-xl border-2 border-(--border) bg-(--book-bg) shadow-xl focus:outline-none"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-(--border) px-5 pt-5 pb-3">
          <h2 className="text-center text-lg font-semibold text-(--ink)">
            {t(titleKey ?? 'adminImportJson')}
          </h2>
          <p className="mt-1 text-center text-sm text-(--ink-muted)">
            {totalAdded > 0 && <>+{totalAdded} {t('adminImportNew')}</>}
            {totalAdded > 0 && totalConflicts > 0 && ' · '}
            {totalConflicts > 0 && (
              <span className="text-amber-600">
                {totalConflicts} {t('adminImportConflicts')}
              </span>
            )}
          </p>
          {totalConflicts > 1 && (
            <div className="mt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setAll('keep')}
                className="rounded-md bg-(--nav-btn) px-2 py-0.5 text-xs text-(--nav-btn-ink) transition-colors hover:bg-(--nav-btn-hover)"
              >
                ← all mine
              </button>
              <button
                type="button"
                onClick={() => setAll('take')}
                className="rounded-md bg-amber-100 px-2 py-0.5 text-xs text-amber-800 transition-colors hover:bg-amber-200"
              >
                → all theirs
              </button>
            </div>
          )}
        </div>

        {/* Scrollable conflict list */}
        <div className="overflow-y-auto px-5 py-3">
          {merge.persons.conflicts.length > 0 && (
            <>
              <SectionHeader
                label={t('adminTabPersons')}
                count={merge.persons.conflicts.length}
              />
              <div className="space-y-1.5">
                {merge.persons.conflicts.map((c, i) => (
                  <PersonConflictRow
                    key={c.existing.id}
                    conflict={c}
                    resolution={resolutions.persons[i]}
                    onToggle={() => toggleRecord('persons', i)}
                    t={t}
                  />
                ))}
              </div>
            </>
          )}

          {merge.photos.conflicts.length > 0 && (
            <>
              <SectionHeader
                label={t('adminTabPhotos')}
                count={merge.photos.conflicts.length}
              />
              <div className="space-y-1.5">
                {merge.photos.conflicts.map((c, i) => (
                  <PhotoConflictRow
                    key={c.existing.id}
                    conflict={c}
                    resolution={resolutions.photos[i]}
                    onToggle={() => toggleRecord('photos', i)}
                  />
                ))}
              </div>
            </>
          )}

          {merge.history.conflicts.length > 0 && (
            <>
              <SectionHeader
                label={t('chapters_history')}
                count={merge.history.conflicts.length}
              />
              <div className="space-y-1.5">
                {merge.history.conflicts.map((c, i) => (
                  <HistoryConflictRow
                    key={c.existing.title}
                    conflict={c}
                    resolution={resolutions.history[i]}
                    onToggle={() => toggleRecord('history', i)}
                  />
                ))}
              </div>
            </>
          )}

          {merge.rootConflict && (
            <>
              <SectionHeader label={t('adminRootColumn')} count={1} />
              <div className="rounded-lg border border-(--border) px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <FieldDiff
                    label={t('adminRootColumn')}
                    mine={merge.incomingRootPersonId}
                    theirs={merge.incomingRootPersonId}
                  />
                  <ToggleButton
                    value={resolutions.rootPersonId}
                    onToggle={() =>
                      setResolutions((prev) => ({
                        ...prev,
                        rootPersonId:
                          prev.rootPersonId === 'keep' ? 'take' : 'keep',
                      }))
                    }
                  />
                </div>
              </div>
            </>
          )}
          {merge.placeFallbacksConflict && (
            <>
              <SectionHeader label={t('chapters_map')} count={1} />
              <div className="rounded-lg border border-(--border) px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-(--ink-muted)">
                    placeFallbacks
                  </span>
                  <ToggleButton
                    value={resolutions.placeFallbacks}
                    onToggle={() =>
                      setResolutions((prev) => ({
                        ...prev,
                        placeFallbacks:
                          prev.placeFallbacks === 'keep' ? 'take' : 'keep',
                      }))
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-(--border) px-5 py-3">
          <div className="flex justify-center gap-2">
            <Button variant="secondary" onClick={onCancel}>
              {t('adminCancel')}
            </Button>
            <Button variant="primary" onClick={() => onApply(resolutions)}>
              {t('adminImportApply')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
