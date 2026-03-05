import { describe, it, expect } from 'vitest';
import { SECTION_IDS, SECTIONS, isSectionId } from './sections';

describe('sections', () => {
  it('exports SECTION_IDS with tree, persons, history, photos', () => {
    expect(SECTION_IDS).toEqual(['tree', 'persons', 'history', 'photos']);
  });

  it('exports SECTIONS with id and i18nKey for each', () => {
    expect(SECTIONS).toHaveLength(4);
    expect(SECTIONS.map((s) => s.id)).toEqual(['tree', 'persons', 'history', 'photos']);
    expect(SECTIONS.every((s) => s.i18nKey.startsWith('chapters_'))).toBe(true);
  });

  describe('isSectionId', () => {
    it('returns true for valid section ids', () => {
      expect(isSectionId('tree')).toBe(true);
      expect(isSectionId('persons')).toBe(true);
      expect(isSectionId('history')).toBe(true);
      expect(isSectionId('photos')).toBe(true);
    });

    it('returns false for invalid values', () => {
      expect(isSectionId('')).toBe(false);
      expect(isSectionId('other')).toBe(false);
      expect(isSectionId('TREE')).toBe(false);
    });
  });
});
