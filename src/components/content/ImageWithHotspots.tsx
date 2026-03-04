'use client';

import { ROUTES } from '@/lib/constants/routes';
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
  const hasPolygons = config.hotspots?.some((h) => h.shape === 'polygon');
  const hasRects = config.hotspots?.some((h) => h.shape === 'rect');

  const handleHotspotClick = (personId: string) => {
    router.push(ROUTES.person(personId));
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
                className="stroke-amber-500/50 stroke-2 transition-colors hover:fill-amber-400/30"
                onClick={() => handleHotspotClick(hotspot.personId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleHotspotClick(hotspot.personId);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Перейти к персоне"
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
              className="absolute cursor-pointer border-2 border-amber-500/50 bg-amber-400/10 transition-colors hover:bg-amber-400/30 focus:outline-none focus:ring-2 focus:ring-amber-600"
              style={{
                left: `${hotspot.coords[0]}%`,
                top: `${hotspot.coords[1]}%`,
                width: `${hotspot.coords[2] - hotspot.coords[0]}%`,
                height: `${hotspot.coords[3] - hotspot.coords[1]}%`,
              }}
              aria-label="Перейти к персоне"
            />
          ))}
    </div>
  );
}
