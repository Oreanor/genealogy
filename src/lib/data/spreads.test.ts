import { describe, it, expect } from 'vitest';
import { getSpreadsForChapter } from './spreads';
import { CHAPTER_IDS } from '@/lib/constants/chapters';

describe('getSpreadsForChapter', () => {
  it('returns person-based spreads for persons chapter', () => {
    const spreads = getSpreadsForChapter(CHAPTER_IDS.PERSONS);
    expect(Array.isArray(spreads)).toBe(true);
    spreads.forEach((s, i) => {
      expect(s.left).toHaveProperty('personId');
      expect(s.spreadIndex).toBe(i);
    });
  });

  it('returns page-based spreads for other chapters', () => {
    const spreads = getSpreadsForChapter(CHAPTER_IDS.TREE);
    expect(spreads.length).toBeGreaterThan(0);
    expect(spreads[0]!.left).toHaveProperty('tree', true);
  });

  it('persons chapter spreads have personId in left when persons exist', () => {
    const spreads = getSpreadsForChapter(CHAPTER_IDS.PERSONS);
    if (spreads.length > 0) {
      expect(spreads[0]!.left!.personId).toBeDefined();
    }
  });

  it('history chapter returns single spread with historyEntries', () => {
    const spreads = getSpreadsForChapter(CHAPTER_IDS.HISTORY);
    expect(spreads.length).toBe(1);
    expect(spreads[0]!.spreadIndex).toBe(0);
    expect(Array.isArray(spreads[0]!.left!.historyEntries)).toBe(true);
  });
});
