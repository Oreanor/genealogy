'use client';

import { useCallback, useRef, useState } from 'react';
import { getFullName } from '@/lib/utils/person';
import { useTranslations } from '@/lib/i18n/context';
import type { Person } from '@/lib/types/person';
import type { PhotoCategory, PhotoEntry } from '@/lib/types/photo';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui/atoms';
import { pxToPercent } from '@/lib/utils/numbers';

const DRAG_THRESHOLD_PX = 5;

export const CUSTOM_PERSON_VALUE = '__custom__';

const SERIES_NEW_VALUE = '__new__';

function SeriesControl({
  value,
  existingSeries,
  onChange,
}: {
  value: string;
  existingSeries: string[];
  onChange: (v: string) => void;
}) {
  const t = useTranslations();
  const [isCustom, setIsCustom] = useState(
    () => value !== '' && !existingSeries.includes(value)
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (v: string) => {
    if (v === SERIES_NEW_VALUE) {
      setIsCustom(true);
      onChange('');
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setIsCustom(false);
      onChange(v);
    }
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-black md:text-(--ink)">
        {t('adminPhotoSeries')}
      </label>
      <Select
        value={isCustom ? SERIES_NEW_VALUE : value}
        onChange={(e) => handleSelect(e.target.value)}
        className="bg-(--paper) px-3 py-2 text-black md:text-(--ink)"
      >
        <option value="">&mdash;</option>
        {existingSeries.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
        <option value={SERIES_NEW_VALUE}>+ {t('adminPhotoSeriesPlaceholder')}</option>
      </Select>
      {isCustom && (
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('adminPhotoSeriesPlaceholder')}
          className="mt-2 bg-(--paper) px-3 py-2 text-black md:text-(--ink)"
        />
      )}
    </div>
  );
}

interface PhotoEditLightboxProps {
  photo: PhotoEntry;
  photoIdx: number;
  persons: Person[];
  existingSeries: string[];
  onUpdate: (field: keyof PhotoEntry, value: unknown) => void;
  onOpenAddPerson: () => void;
  onOpenEditPerson: (personIdx: number) => void;
  onRemovePerson: (photoIdx: number, personIdx: number) => void;
  onClose: () => void;
  faceEditMode?: boolean;
  editingPersonId?: string;
  editingLabel?: string;
  editingCoords?: number[];
  onEditingPersonIdChange?: (id: string) => void;
  onEditingLabelChange?: (value: string) => void;
  onEditingCoordsChange?: (coords: number[]) => void;
  onSavePerson?: () => void;
  onCancelPerson?: () => void;
  isAddMode?: boolean;
}

export function PhotoEditLightbox({
  photo,
  photoIdx,
  persons,
  existingSeries,
  onUpdate,
  onOpenAddPerson,
  onOpenEditPerson,
  onRemovePerson,
  onClose,
  faceEditMode = false,
  editingPersonId = '',
  editingLabel = '',
  editingCoords = [],
  onEditingPersonIdChange,
  onEditingLabelChange,
  onEditingCoordsChange,
  onSavePerson,
  onCancelPerson,
  isAddMode = false,
}: PhotoEditLightboxProps) {
  void isAddMode;
  const t = useTranslations();
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [firstPoint, setFirstPoint] = useState<{ x: number; y: number } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; clientX: number; clientY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [liveRect, setLiveRect] = useState<number[] | null>(null);

  const getPoint = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): { x: number; y: number } => {
      const rect = leftPanelRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const x = pxToPercent(e.clientX - rect.left, rect.width);
      const y = pxToPercent(e.clientY - rect.top, rect.height);
      return { x, y };
    },
    []
  );

  const commitRect = useCallback(
    (a: { x: number; y: number }, b: { x: number; y: number }) => {
      const left = Math.min(a.x, b.x);
      const top = Math.min(a.y, b.y);
      const right = Math.max(a.x, b.x);
      const bottom = Math.max(a.y, b.y);
      const coords = [left, top, right, bottom];
      onEditingCoordsChange?.(coords);
      setFirstPoint(null);
      setLiveRect(null);
    },
    [onEditingCoordsChange]
  );

  const handleLeftMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!faceEditMode || e.button !== 0) return;
      const pt = getPoint(e);
      setDragStart({ ...pt, clientX: e.clientX, clientY: e.clientY });
      setIsDragging(false);
    },
    [faceEditMode, getPoint]
  );

  const handleLeftMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!faceEditMode || !dragStart) return;
      const pt = getPoint(e);
      const dist = Math.sqrt(
        (e.clientX - dragStart.clientX) ** 2 + (e.clientY - dragStart.clientY) ** 2
      );
      if (!isDragging && dist > DRAG_THRESHOLD_PX) {
        setIsDragging(true);
      }
      if (isDragging) {
        const left = Math.min(dragStart.x, pt.x);
        const top = Math.min(dragStart.y, pt.y);
        const right = Math.max(dragStart.x, pt.x);
        const bottom = Math.max(dragStart.y, pt.y);
        setLiveRect([left, top, right, bottom]);
      }
    },
    [faceEditMode, dragStart, isDragging, getPoint]
  );

  const handleLeftMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!faceEditMode || e.button !== 0) return;
      const pt = getPoint(e);
      if (isDragging && dragStart) {
        commitRect(dragStart, pt);
        setDragStart(null);
        setIsDragging(false);
        return;
      }
      if (firstPoint) {
        commitRect(firstPoint, pt);
        setFirstPoint(null);
      } else {
        setFirstPoint(pt);
      }
      setDragStart(null);
      setLiveRect(null);
    },
    [faceEditMode, firstPoint, isDragging, dragStart, getPoint, commitRect]
  );

  const handleLeftMouseLeave = useCallback(() => {
    if (!isDragging) return;
    setDragStart(null);
    setIsDragging(false);
    setLiveRect(null);
  }, [isDragging]);

  const displayCoords = liveRect ?? (editingCoords.length >= 4 ? editingCoords : null);
  const hasFirstPoint = firstPoint !== null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-4"
      role="dialog"
      aria-modal
      aria-label={t('adminCaption')}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[95vh] w-full max-w-5xl flex-col gap-4 overflow-hidden rounded-xl border border-(--border) bg-(--paper) p-4 text-black md:text-(--ink) shadow-xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute right-3 top-3 p-1 text-2xl leading-none"
          aria-label={t('adminCancel')}
        >
          ×
        </Button>

        <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-(--paper-light) p-2">
          <button
            type="button"
            onClick={() => onUpdate('hidden', !photo.hidden)}
            className={`absolute bottom-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-(--border-subtle) shadow ${photo.hidden ? 'bg-(--ink-muted) text-white' : 'bg-(--paper-light) text-(--ink)'}`}
            title={photo.hidden ? t('adminShow') : t('adminHide')}
            aria-label={photo.hidden ? t('adminShow') : t('adminHide')}
          >
            {photo.hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
          <div
            ref={leftPanelRef}
            className={`relative flex h-full w-full min-h-0 items-center justify-center overflow-hidden ${faceEditMode ? 'cursor-crosshair' : ''}`}
            onMouseDown={faceEditMode ? handleLeftMouseDown : undefined}
            onMouseMove={faceEditMode ? handleLeftMouseMove : undefined}
            onMouseUp={faceEditMode ? handleLeftMouseUp : undefined}
            onMouseLeave={faceEditMode ? handleLeftMouseLeave : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt=""
              className="block h-full w-full select-none object-contain pointer-events-none"
              draggable={false}
            />
            {(photo.people ?? [])
              .filter((p) => Array.isArray(p.coords) && p.coords.length >= 4)
              .map((p, i) => {
                const [l, t_, r, b] = p.coords as number[];
                return (
                  <div
                    key={i}
                    className="absolute pointer-events-none border border-(--accent) bg-(--hotspot-fill)"
                    style={{
                      left: `${l}%`,
                      top: `${t_}%`,
                      width: `${r - l}%`,
                      height: `${b - t_}%`,
                    }}
                  />
                );
              })}
            {faceEditMode && hasFirstPoint && (
              <div
                className="absolute pointer-events-none h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-(--accent) shadow-md"
                style={{ left: `${firstPoint.x}%`, top: `${firstPoint.y}%` }}
              />
            )}
            {faceEditMode && displayCoords && displayCoords.length >= 4 && (
              <div
                className="absolute pointer-events-none border-2 border-(--accent) bg-(--hotspot-fill)"
                style={{
                  left: `${displayCoords[0]}%`,
                  top: `${displayCoords[1]}%`,
                  width: `${displayCoords[2]! - displayCoords[0]!}%`,
                  height: `${displayCoords[3]! - displayCoords[1]!}%`,
                }}
              />
            )}
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto pt-4 md:w-80 md:pt-12">
          <div>
            <label className="mb-1 block text-sm font-medium text-black md:text-(--ink)">
              {t('adminCaption')}
            </label>
            <Input
              type="text"
              value={photo.caption ?? ''}
              onChange={(e) => onUpdate('caption', e.target.value)}
              placeholder={t('adminCaptionPlaceholder')}
              className="bg-(--paper) px-3 py-2 text-black md:text-(--ink)"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-black md:text-(--ink)">
              {t('adminPhotoCategory')}
            </label>
            <Select
              value={photo.category ?? 'related'}
              onChange={(e) => onUpdate('category', e.target.value as PhotoCategory)}
              className="bg-(--paper) px-3 py-2 text-black md:text-(--ink)"
            >
              <option value="personal">{t('adminPhotoPersonal')}</option>
              <option value="group">{t('adminPhotoGroup')}</option>
              <option value="related">{t('adminPhotoRelated')}</option>
            </Select>
          </div>

          <SeriesControl
            value={photo.series ?? ''}
            existingSeries={existingSeries}
            onChange={(v) => onUpdate('series', v || undefined)}
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-black md:text-(--ink)">
                {t('adminPeopleOnPhoto')}
              </span>
              {!faceEditMode && (
                <Button variant="ghost" size="sm" onClick={onOpenAddPerson} className="text-sm text-(--accent) hover:underline">
                  {t('adminAdd')}
                </Button>
              )}
            </div>
            {faceEditMode ? (
              <div className="space-y-3 rounded border border-(--border-subtle) bg-(--paper-light) p-3">
                <p className="text-xs text-black/70 md:text-(--ink-muted)">{t('adminPhotoFaceRectHint')}</p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-black md:text-(--ink)">
                    {t('adminPhotoPersonId')}
                  </label>
                  <Select
                    value={editingPersonId}
                    onChange={(e) => onEditingPersonIdChange?.(e.target.value)}
                    className="bg-(--paper) px-3 py-2 w-full text-black md:text-(--ink)"
                  >
                    {(() => {
                      const sorted = [...persons].sort((a, b) =>
                        (getFullName(a) || a.id).localeCompare(getFullName(b) || b.id)
                      );
                      const groups: { letter: string; items: typeof sorted }[] = [];
                      for (const p of sorted) {
                        const letter = (p.lastName || getFullName(p) || p.id).charAt(0).toUpperCase();
                        const last = groups[groups.length - 1];
                        if (last && last.letter === letter) {
                          last.items.push(p);
                        } else {
                          groups.push({ letter, items: [p] });
                        }
                      }
                      return groups.map((g) => (
                        <optgroup key={g.letter} label={g.letter}>
                          {g.items.map((p) => (
                            <option key={p.id} value={p.id}>
                              {getFullName(p) || p.id}
                            </option>
                          ))}
                        </optgroup>
                      ));
                    })()}
                    <option value={CUSTOM_PERSON_VALUE}>{t('adminPhotoCustomName')}</option>
                  </Select>
                </div>
                {editingPersonId === CUSTOM_PERSON_VALUE && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-black md:text-(--ink)">
                      {t('adminPhotoCustomNameLabel')}
                    </label>
                    <Input
                      type="text"
                      value={editingLabel}
                      onChange={(e) => onEditingLabelChange?.(e.target.value)}
                      placeholder={t('adminPhotoCustomNamePlaceholder')}
                      className="bg-(--paper) px-3 py-2 w-full text-black md:text-(--ink)"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={onSavePerson}>
                    {t('adminDone')}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={onCancelPerson}>
                    {t('adminCancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <ul className="space-y-1">
                {(photo.people ?? []).map((person, personIdx) => {
                  const displayName = person.personId
                    ? (persons.find((p) => p.id === person.personId)
                        ? getFullName(persons.find((p) => p.id === person.personId)!)
                        : person.personId)
                    : (person.label ?? '—');
                  return (
                    <li
                      key={personIdx}
                      className="flex flex-wrap items-center gap-2 rounded border border-(--border-subtle) px-2 py-1.5 text-sm"
                    >
                      <span className="text-black md:text-(--ink)">
                        {displayName}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => onOpenEditPerson(personIdx)} className="text-(--accent) hover:underline">
                        {t('adminEdit')}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => onRemovePerson(photoIdx, personIdx)}>
                        ✕
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-auto flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={onClose}>
              {t('adminCancel')}
            </Button>
            <Button variant="primary" onClick={onClose}>
              {t('adminDone')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
