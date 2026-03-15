import { useCallback, useRef, useState } from 'react';

export type ImageBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function usePhotoImageBounds() {
  const photoContainerRef = useRef<HTMLDivElement>(null);
  const [imageBounds, setImageBounds] = useState<ImageBounds | null>(null);

  const onPhotoImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = (e.currentTarget ?? e.target) as HTMLImageElement;
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      if (!nw || !nh) return;
      const measure = () => {
        const container = photoContainerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const cw = rect.width;
        const ch = rect.height;
        const scale = Math.min(cw / nw, ch / nh);
        const displayW = nw * scale;
        const displayH = nh * scale;
        setImageBounds({
          left: ((cw - displayW) / 2 / cw) * 100,
          top: ((ch - displayH) / 2 / ch) * 100,
          width: (displayW / cw) * 100,
          height: (displayH / ch) * 100,
        });
      };
      requestAnimationFrame(measure);
    },
    []
  );

  return { photoContainerRef, imageBounds, setImageBounds, onPhotoImageLoad };
}
