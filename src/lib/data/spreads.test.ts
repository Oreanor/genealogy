import { describe, it, expect } from 'vitest';
import { getSpreadsForChapter } from './spreads';
import { CHAPTER_IDS } from '@/lib/constants/chapters';

describe('getSpreadsForChapter', () => {
  it('returns person-based spreads for persony', () => {
    const spreads = getSpreadsForChapter(CHAPTER_IDS.PERSONS);
    const personsCount = 19; // from persons.json (incl. person-19)
    expect(spreads).toHaveLength(personsCount);
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

  it('persony spreads have personId in left', () => {
    const spreads = getSpreadsForChapter(CHAPTER_IDS.PERSONS);
    expect(spreads[0]!.left!.personId).toBeDefined();
  });
});
