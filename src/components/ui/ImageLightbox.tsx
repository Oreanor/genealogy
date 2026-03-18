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
  /** Back side image; click on image toggles front/back */
  backSrc?: string;
  /** Caption for back side */
  backCaption?: string;
  /** Optional faces to overlay (rect + name); toggle "show faces" in UI */
  faces?: LightboxFace[];
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({
  src,
  alt = '',
  caption,
  backSrc,
  backCaption,
  faces = [],
  open,
  onClose,
}: ImageLightboxProps) {
  const t = useTranslations();
  const [showFaces, setShowFaces] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasFaces = faces.length > 0;
  const hasBack = Boolean(backSrc);
  const displaySrc = hasBack && showBack && backSrc ? backSrc : src;
  const displayCaption = hasBack && showBack && backCaption != null ? backCaption : caption;

  useEffect(() => {
    if (!open) return;
    setShowBack(false);
    setIsLoading(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
  }, [displaySrc, open]);

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
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-2 bg-black/90 p-2 focus:outline-none md:gap-4 md:p-4"
      aria-label={t('closeLightbox')}
    >
      <div className="relative inline-block max-h-[calc(100vh-4rem)] max-w-[calc(100vw-1rem)] md:max-h-[calc(100vh-8rem)] md:max-w-[calc(100vw-2rem)]">
        <Image
          src={displaySrc}
          alt={hasBack && showBack ? (backCaption ?? alt) : alt}
          width={1920}
          height={1080}
          className="block w-auto max-h-[calc(100vh-4rem)] max-w-[calc(100vw-1rem)] object-contain md:max-h-[calc(100vh-8rem)] md:max-w-[calc(100vw-2rem)]"
          onClick={(e) => {
            e.stopPropagation();
            if (hasBack && !isLoading) setShowBack((v) => !v);
          }}
          onLoad={() => setIsLoading(false)}
          unoptimized
        />
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-(--paper) border-t-transparent" />
          </div>
        )}
        {hasFaces && !(hasBack && showBack) && showFaces && (
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
                    className="absolute rounded bg-black/75 px-2 py-0.5 text-xs font-medium text-white leading-tight text-center"
                    style={{
                      left: `${(l + r) / 2}%`,
                      top: `${b + 1}%`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {face.lastName != null || face.firstName != null || face.patronymic != null ? (
                      <>
                        {face.lastName && <span className="block">{face.lastName}</span>}
                        {face.firstName && <span className="block">{face.firstName}</span>}
                        {face.patronymic && <span className="block">{face.patronymic}</span>}
                      </>
                    ) : (
                      face.displayName
                    )}
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
            className={`absolute bottom-2 right-2 flex h-9 w-9 shrink-0 items-center justify-center rounded bg-black/60 text-white hover:bg-black/80 focus:outline-none ${hasBack && showBack ? 'invisible pointer-events-none' : ''}`}
            title={showFaces ? t('lightboxHideLabels') : t('lightboxShowLabels')}
            aria-label={showFaces ? t('lightboxHideLabels') : t('lightboxShowLabels')}
          >
            {showFaces ? <ListX className="size-[18px]" /> : <List className="size-[18px]" />}
          </button>
        )}
      </div>
      {displayCaption != null && displayCaption.trim() !== '' && (
        <p className="book-serif text-center font-bold text-white" onClick={(e) => e.stopPropagation()}>
          {displayCaption.trim()}
        </p>
      )}
    </div>
  );
}
