import { describe, it, expect } from 'vitest';
import { mergeKanivetsMapPlaceGeo } from './kanivetsMapPlaceGeo';

describe('mergeKanivetsMapPlaceGeo', () => {
  it('maps kharkov to sumy when sumy exists in base', () => {
    const sumy = { lat: 50.91, lon: 34.8 };
    const merged = mergeKanivetsMapPlaceGeo({ sumy });
    expect(merged.kharkov).toEqual(sumy);
    expect(merged.kiev?.lat).toBeCloseTo(50.45, 1);
  });
});
