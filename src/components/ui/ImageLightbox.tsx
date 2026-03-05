'use client';

import { useEffect } from 'react';
import Image from 'next/image';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ src, alt = '', open, onClose }: ImageLightboxProps) {
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
    <button
      type="button"
      onClick={onClose}
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/90 p-4 focus:outline-none"
      aria-label="Закрыть"
    >
      <Image
        src={src}
        alt={alt}
        width={1920}
        height={1080}
        className="max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] w-auto h-auto object-contain"
        onClick={(e) => e.stopPropagation()}
        unoptimized
      />
    </button>
  );
}
