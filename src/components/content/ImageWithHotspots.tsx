'use client';

import { getRoutes } from '@/lib/constants/routes';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { polygonPoints } from '@/lib/utils/svg';
import type { ImageConfig } from '@/lib/types/spread';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ImageWithHotspotsProps {
  config: ImageConfig;
  className?: string;
}

export function ImageWithHotspots({ config, className = '' }: ImageWithHotspotsProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const routes = getRoutes(locale);
  const hasPolygons = config.hotspots?.some((h) => h.shape === 'polygon');
  const hasRects = config.hotspots?.some((h) => h.shape === 'rect');

  const handleHotspotClick = (personId: string) => {
    router.push(routes.person(personId));
  };

  return (
    <div className={`relative aspect-[4/3] w-full max-w-md overflow-hidden rounded ${className}`}>
      <Image
        src={config.src}
        alt={config.alt ?? ''}
        fill
        className="object-cover"
      />
      {hasPolygons && (
        <svg
          className="absolute inset-0 h-full w-full cursor-pointer"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          {config.hotspots
            ?.filter((h) => h.shape === 'polygon' && h.coords.length >= 6)
            .map((hotspot, index) => (
              <polygon
                key={`${hotspot.personId}-${index}`}
                points={polygonPoints(hotspot.coords)}
                fill="transparent"
                style={{ stroke: 'var(--hotspot-stroke)' }}
                className="stroke-2 transition-colors hover:fill-[var(--hotspot-fill-hover)]"
                onClick={() => handleHotspotClick(hotspot.personId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleHotspotClick(hotspot.personId);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={t('goToPerson')}
              />
            ))}
        </svg>
      )}
      {hasRects &&
        config.hotspots
          ?.filter((h) => h.shape === 'rect' && h.coords.length >= 4)
          .map((hotspot, index) => (
            <button
              key={`${hotspot.personId}-${index}`}
              type="button"
              onClick={() => handleHotspotClick(hotspot.personId)}
              className="absolute cursor-pointer border-2 border-[var(--hotspot-stroke)] bg-[var(--hotspot-fill)] transition-colors hover:bg-[var(--hotspot-fill-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{
                left: `${hotspot.coords[0]}%`,
                top: `${hotspot.coords[1]}%`,
                width: `${hotspot.coords[2] - hotspot.coords[0]}%`,
                height: `${hotspot.coords[3] - hotspot.coords[1]}%`,
              }}
              aria-label={t('goToPerson')}
            />
          ))}
    </div>
  );
}
