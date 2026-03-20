import { useCallback, useRef, useState } from 'react';

export type ImageBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type BoundsState = {
  resetKey: string;
  bounds: ImageBounds | null;
};

export function usePhotoImageBounds(resetKey = 'default') {
  const photoContainerRef = useRef<HTMLDivElement>(null);
  const [boundsState, setBoundsState] = useState<BoundsState>({
    resetKey,
    bounds: null,
  });
  const imageBounds = boundsState.resetKey === resetKey ? boundsState.bounds : null;

  const setImageBounds = useCallback(
    (bounds: ImageBounds | null) => {
      setBoundsState({ resetKey, bounds });
    },
    [resetKey]
  );

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
        setBoundsState({
          resetKey,
          bounds: {
            left: ((cw - displayW) / 2 / cw) * 100,
            top: ((ch - displayH) / 2 / ch) * 100,
            width: (displayW / cw) * 100,
            height: (displayH / ch) * 100,
          },
        });
      };
      requestAnimationFrame(measure);
    },
    [resetKey]
  );

  return { photoContainerRef, imageBounds, setImageBounds, onPhotoImageLoad };
}
