'use client';

import { Button, Input } from '@/components/ui/atoms';
import type { CityReviewState } from './adminPersonsTableUtils';

type Props = {
  cityReview: CityReviewState | null;
  cityMapHostRef: React.RefObject<HTMLDivElement | null>;
  setCityReview: React.Dispatch<React.SetStateAction<CityReviewState | null>>;
  onApply: (city: string, point: { lat: number; lon: number }) => void;
};

export function CityReviewDialog({
  cityReview,
  cityMapHostRef,
  setCityReview,
  onApply,
}: Props) {
  if (!cityReview) return null;

  const lat = Number(cityReview.manualLat.replace(',', '.'));
  const lon = Number(cityReview.manualLon.replace(',', '.'));
  const hasValidPoint = Number.isFinite(lat) && Number.isFinite(lon);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal
      aria-label="City review"
    >
      <div className="w-full max-w-lg rounded-xl border-2 border-(--border) bg-(--book-bg) p-4 shadow-xl">
        <h3 className="mb-2 text-center text-lg font-semibold text-(--ink)">
          Новый город: {cityReview.city}
        </h3>
        <p className="mb-2 text-sm text-(--ink-muted)">
          {cityReview.geocodedPoint
            ? 'Координаты найдены через геокодер. Можно оставить как есть, скорректировать вручную или кликнуть точку на карте.'
            : 'Координаты не найдены автоматически. Введите их вручную или кликните на карте.'}
        </p>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <Input
            value={cityReview.manualLat}
            onChange={(e) =>
              setCityReview((prev) =>
                prev ? { ...prev, manualLat: e.target.value } : prev
              )
            }
            placeholder="lat"
          />
          <Input
            value={cityReview.manualLon}
            onChange={(e) =>
              setCityReview((prev) =>
                prev ? { ...prev, manualLon: e.target.value } : prev
              )
            }
            placeholder="lon"
          />
        </div>
        <div
          ref={cityMapHostRef}
          className="mb-3 h-56 w-full overflow-hidden rounded border border-(--border-subtle)"
        />
        <div className="flex justify-center gap-2">
          <Button variant="secondary" onClick={() => setCityReview(null)}>
            Отмена
          </Button>
          <Button
            variant="primary"
            disabled={!hasValidPoint}
            onClick={() => {
              if (hasValidPoint) {
                onApply(cityReview.city, { lat, lon });
              }
              setCityReview(null);
            }}
          >
            Применить
          </Button>
        </div>
      </div>
    </div>
  );
}
