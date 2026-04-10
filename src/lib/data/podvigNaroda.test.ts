import { describe, it, expect } from 'vitest';
import { getPodvigNarodaFile, getPodvigNarodaRecords } from './podvigNaroda';

describe('podvigNaroda', () => {
  it('exposes merged bundle metadata', () => {
    const f = getPodvigNarodaFile();
    expect(f.meta.recordCount).toBe(f.records.length);
    expect(f.meta.mergedFrom.length).toBeGreaterThanOrEqual(1);
  });

  it('has typed slices by recordType', () => {
    const rows = getPodvigNarodaRecords();
    const types = new Set(rows.map((r) => r.recordType));
    expect(types.has('award')).toBe(true);
    expect(rows.every((r) => r.person && r.source?.entityLabelRu)).toBe(true);
  });

  it('includes map derived fields from build script when birth year is known', () => {
    const rows = getPodvigNarodaRecords();
    const withYear = rows.filter((r) => r.derived?.birthYear != null);
    expect(withYear.length).toBeGreaterThan(0);
    expect(withYear.every((r) => r.derived && typeof r.derived.mapGeoPlaceLabel !== 'undefined')).toBe(true);
  });
});
