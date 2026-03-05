'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslations } from '@/lib/i18n/context';

/** Rect coords: [left%, top%, right%, bottom%] for face/avatar area. */
interface PhotoHotspotEditorProps {
  src: string;
  coords: number[];
  onChange: (coords: number[]) => void;
  imageClassName?: string;
}

function pxToPercent(value: number, total: number): number {
  return total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
}

export function PhotoHotspotEditor({
  src,
  coords,
  onChange,
  imageClassName,
}: PhotoHotspotEditorProps) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState(false);
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
      setDrawing(true);
      setStart({ x, y });
      onChange([x, y, x, y]);
    },
    [getPoint, onChange]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!drawing || !start) return;
      const { x, y } = getPoint(e);
      const left = Math.min(start.x, x);
      const top = Math.min(start.y, y);
      const right = Math.max(start.x, x);
      const bottom = Math.max(start.y, y);
      onChange([left, top, right, bottom]);
    },
    [drawing, start, getPoint, onChange]
  );

  const handleMouseUp = useCallback(() => {
    setDrawing(false);
    setStart(null);
  }, []);

  const hasRect = coords.length >= 4;

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--ink-muted)]">{t('adminPhotoDrawHint')}</p>
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
        {hasRect && (
          <div className="absolute inset-0 pointer-events-none">
            <span
              className="absolute border-2 border-[var(--accent)] bg-[var(--hotspot-fill)]"
              style={{
                left: `${coords[0]}%`,
                top: `${coords[1]}%`,
                width: `${coords[2]! - coords[0]!}%`,
                height: `${coords[3]! - coords[1]!}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
