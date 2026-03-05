'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { List, ListX } from 'lucide-react';
import { useTranslations } from '@/lib/i18n/context';
import type { LightboxFace } from '@/lib/data/photos';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  /** Caption shown below the image (centered, bold) */
  caption?: string;
  /** Optional faces to overlay (rect + name); toggle "show faces" in UI */
  faces?: LightboxFace[];
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ src, alt = '', caption, faces = [], open, onClose }: ImageLightboxProps) {
  const t = useTranslations();
  const [showFaces, setShowFaces] = useState(false);
  const hasFaces = faces.length > 0;

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-4 bg-black/90 p-4 focus:outline-none"
      aria-label="Закрыть"
    >
      <div className="relative inline-block max-h-[calc(100vh-8rem)] max-w-[calc(100vw-2rem)]">
        <Image
          src={src}
          alt={alt}
          width={1920}
          height={1080}
          className="block w-auto max-h-[calc(100vh-8rem)] max-w-[calc(100vw-2rem)] object-contain"
          onClick={(e) => e.stopPropagation()}
          unoptimized
        />
        {hasFaces && showFaces && (
          <>
            {faces.map((face, i) => {
              const [l, t_, r, b] = face.coords;
              const w = r - l;
              const h = b - t_;
              return (
                <div key={`${i}-${face.displayName}`} className="absolute inset-0 pointer-events-none">
                  <div
                    className="absolute border-2 border-white/90"
                    style={{
                      left: `${l}%`,
                      top: `${t_}%`,
                      width: `${w}%`,
                      height: `${h}%`,
                    }}
                  />
                  <div
                    className="absolute left-0 whitespace-nowrap rounded bg-black/75 px-2 py-0.5 text-xs font-medium text-white"
                    style={{
                      left: `${l}%`,
                      top: `${b + 1}%`,
                    }}
                  >
                    {face.displayName}
                  </div>
                </div>
              );
            })}
          </>
        )}
        {hasFaces && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowFaces((v) => !v);
            }}
            className="absolute bottom-2 right-2 flex h-9 w-9 shrink-0 items-center justify-center rounded bg-black/60 text-white hover:bg-black/80 focus:outline-none"
            title={showFaces ? t('lightboxHideLabels') : t('lightboxShowLabels')}
            aria-label={showFaces ? t('lightboxHideLabels') : t('lightboxShowLabels')}
          >
            {showFaces ? <ListX className="size-[18px]" /> : <List className="size-[18px]" />}
          </button>
        )}
      </div>
      {caption != null && caption.trim() !== '' && (
        <p className="book-serif text-center font-bold text-white" onClick={(e) => e.stopPropagation()}>
          {caption.trim()}
        </p>
      )}
    </div>
  );
}
