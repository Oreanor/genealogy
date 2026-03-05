import { describe, it, expect } from 'vitest';
import { getPages, getPagesByChapter, getSpreadByChapterAndIndex } from './pages';

describe('pages data', () => {
  describe('getPages', () => {
    it('returns non-empty array', () => {
      const pages = getPages();
      expect(Array.isArray(pages)).toBe(true);
    });
  });

  describe('getPagesByChapter', () => {
    it('returns pages for chapter', () => {
      const pages = getPagesByChapter('photos');
      expect(pages.length).toBeGreaterThan(0);
      expect(pages.every((p) => p.chapter === 'photos')).toBe(true);
    });

    it('sorts by spreadIndex', () => {
      const pages = getPagesByChapter('photos');
      for (let i = 1; i < pages.length; i++) {
        expect(pages[i]!.spreadIndex).toBeGreaterThanOrEqual(pages[i - 1]!.spreadIndex);
      }
    });

    it('returns empty for persons (spreads from persons, not pages)', () => {
      expect(getPagesByChapter('persons')).toEqual([]);
    });

    it('returns empty for history (content in data.json history section, not pages)', () => {
      expect(getPagesByChapter('history')).toEqual([]);
    });
  });

  describe('getSpreadByChapterAndIndex', () => {
    it('returns page for valid chapter and index', () => {
      const page = getSpreadByChapterAndIndex('photos', 0);
      expect(page).not.toBeNull();
      expect(page!.chapter).toBe('photos');
      expect(page!.spreadIndex).toBe(0);
    });

    it('returns null for invalid index', () => {
      expect(getSpreadByChapterAndIndex('photos', 999)).toBeNull();
    });
  });
});
