'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import type { PhotoPersonShape } from '@/lib/types/photo';

interface PhotoHotspotEditorProps {
  src: string;
  /** Текущие coords и shape для отображения */
  coords: number[];
  shape: PhotoPersonShape;
  onChange: (coords: number[], shape: PhotoPersonShape) => void;
  /** Класс контейнера изображения (для крупного отображения в лайтбоксе) */
  imageClassName?: string;
}

function pxToPercent(value: number, total: number): number {
  return total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
}

const DRAWABLE_SHAPES: PhotoPersonShape[] = ['point', 'circle', 'rect'];

export function PhotoHotspotEditor({
  src,
  coords,
  shape,
  onChange,
  imageClassName,
}: PhotoHotspotEditorProps) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState<'point' | 'circle' | 'rect' | null>(null);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);

  const getPoint = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): { x: number; y: number } => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const x = pxToPercent(e.clientX - rect.left, rect.width);
      const y = pxToPercent(e.clientY - rect.top, rect.height);
      return { x, y };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const { x, y } = getPoint(e);
      if (shape === 'point') {
        onChange([x, y], 'point');
      } else if (shape === 'circle') {
        setDrawing('circle');
        setStart({ x, y });
      } else if (shape === 'rect') {
        setDrawing('rect');
        setStart({ x, y });
      }
    },
    [shape, getPoint, onChange]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!drawing || !start) return;
      const { x, y } = getPoint(e);
      if (drawing === 'circle') {
        const dx = x - start.x;
        const dy = y - start.y;
        const r = Math.sqrt(dx * dx + dy * dy);
        onChange([start.x, start.y, r], 'circle');
      } else if (drawing === 'rect') {
        const left = Math.min(start.x, x);
        const top = Math.min(start.y, y);
        const right = Math.max(start.x, x);
        const bottom = Math.max(start.y, y);
        onChange([left, top, right, bottom], 'rect');
      }
    },
    [drawing, start, getPoint, onChange]
  );

  const handleMouseUp = useCallback(() => {
    setDrawing(null);
    setStart(null);
  }, [] );

  const hasValidCoords =
    (shape === 'point' && coords.length >= 2) ||
    (shape === 'circle' && coords.length >= 3) ||
    (shape === 'rect' && coords.length >= 4);

  const shapeLabels: Record<PhotoPersonShape, string> = {
    point: t('adminPhotoPoint'),
    circle: t('adminPhotoCircle'),
    rect: t('adminRect'),
    polygon: t('adminPolygon'),
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--ink-muted)]">{t('adminPhotoDrawHint')}</p>
      <div className="flex flex-wrap gap-2">
        {DRAWABLE_SHAPES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(coords, s)}
            className={`rounded px-2 py-1 text-sm ${
              shape === s
                ? 'bg-[var(--accent)] text-[var(--nav-btn-ink)]'
                : 'bg-[var(--paper-light)] text-[var(--ink)] hover:bg-[var(--border-subtle)]'
            }`}
          >
            {shapeLabels[s]}
          </button>
        ))}
      </div>
      <div
        ref={containerRef}
        className={`relative aspect-[4/3] w-full cursor-crosshair overflow-hidden rounded-lg border border-[var(--border-subtle)] ${imageClassName ?? 'max-w-sm'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
        {hasValidCoords && (
          <div className="absolute inset-0 pointer-events-none">
            {shape === 'point' && (
              <span
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--accent)] shadow-md"
                style={{ left: `${coords[0]}%`, top: `${coords[1]}%` }}
              />
            )}
            {shape === 'circle' && coords.length >= 3 && (
              <span
                className="absolute rounded-full border-2 border-[var(--accent)] bg-[var(--hotspot-fill)]"
                style={{
                  left: `${coords[0] - coords[2]}%`,
                  top: `${coords[1] - coords[2]}%`,
                  width: `${coords[2] * 2}%`,
                  height: `${coords[2] * 2}%`,
                }}
              />
            )}
            {shape === 'rect' && coords.length >= 4 && (
              <span
                className="absolute border-2 border-[var(--accent)] bg-[var(--hotspot-fill)]"
                style={{
                  left: `${coords[0]}%`,
                  top: `${coords[1]}%`,
                  width: `${coords[2] - coords[0]}%`,
                  height: `${coords[3] - coords[1]}%`,
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
