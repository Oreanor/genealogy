import { describe, it, expect } from 'vitest';
import { mergeMapPlaceGeoOverlay } from './mapPlaceGeoOverlay';

describe('mergeMapPlaceGeoOverlay', () => {
  it('maps kharkov to sumy when sumy exists in base (extended overlay)', () => {
    const sumy = { lat: 50.91, lon: 34.8 };
    const merged = mergeMapPlaceGeoOverlay({ sumy }, 'extended');
    expect(merged.kharkov).toEqual(sumy);
    expect(merged.kiev?.lat).toBeCloseTo(50.45, 1);
  });
});
