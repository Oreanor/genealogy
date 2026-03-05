'use client';

import { useState } from 'react';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { polygonPoints } from '@/lib/utils/svg';
import type { ImageConfig } from '@/lib/types/spread';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ImageLightbox } from '@/components/ui/ImageLightbox';

interface ImageWithHotspotsProps {
  config: ImageConfig;
  className?: string;
}

export function ImageWithHotspots({ config, className = '' }: ImageWithHotspotsProps) {
  const router = useRouter();
  const { t, routes } = useLocaleRoutes();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const hotspots = config.hotspots ?? [];

  const handleHotspotClick = (personId: string) => {
    router.push(routes.person(personId));
  };

  const stopAndNav = (personId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    handleHotspotClick(personId);
  };

  const polygons = hotspots.filter((h) => h.shape === 'polygon' && h.coords.length >= 6);
  const rects = hotspots.filter((h) => h.shape === 'rect' && h.coords.length >= 4);
  const circles = hotspots.filter((h) => h.shape === 'circle' && h.coords.length >= 3);
  const points = hotspots.filter((h) => h.shape === 'point' && h.coords.length >= 2);

  return (
    <>
      <div
        className={`relative aspect-[4/3] w-full max-w-md cursor-pointer overflow-hidden rounded ${className}`}
        onClick={() => setLightboxOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setLightboxOpen(true);
          }
        }}
        aria-label={t('openFullscreen')}
      >
      <Image
        src={config.src}
        alt={config.alt ?? ''}
        fill
        className="object-cover"
      />
      {polygons.length > 0 && (
        <svg
          className="absolute inset-0 h-full w-full cursor-pointer"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          {polygons.map((hotspot, index) => (
            <polygon
              key={`${hotspot.personId}-${index}`}
              points={polygonPoints(hotspot.coords)}
              fill="transparent"
              style={{ stroke: 'var(--hotspot-stroke)' }}
              className="stroke-2 transition-colors hover:fill-[var(--hotspot-fill-hover)]"
              onClick={stopAndNav(hotspot.personId)}
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
      {rects.map((hotspot, index) => (
        <button
          key={`rect-${hotspot.personId}-${index}`}
          type="button"
          onClick={stopAndNav(hotspot.personId)}
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
      {circles.map((hotspot, index) => (
        <button
          key={`circle-${hotspot.personId}-${index}`}
          type="button"
          onClick={stopAndNav(hotspot.personId)}
          className="absolute cursor-pointer rounded-full border-2 border-[var(--hotspot-stroke)] bg-[var(--hotspot-fill)] transition-colors hover:bg-[var(--hotspot-fill-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{
            left: `${hotspot.coords[0] - hotspot.coords[2]}%`,
            top: `${hotspot.coords[1] - hotspot.coords[2]}%`,
            width: `${hotspot.coords[2] * 2}%`,
            height: `${hotspot.coords[2] * 2}%`,
          }}
          aria-label={t('goToPerson')}
        />
      ))}
      {points.map((hotspot, index) => (
        <button
          key={`point-${hotspot.personId}-${index}`}
          type="button"
          onClick={stopAndNav(hotspot.personId)}
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-white bg-[var(--accent)] shadow-md transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{
            left: `${hotspot.coords[0]}%`,
            top: `${hotspot.coords[1]}%`,
          }}
          aria-label={t('goToPerson')}
        />
      ))}
    </div>
      <ImageLightbox
        src={config.src}
        alt={config.alt ?? ''}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
