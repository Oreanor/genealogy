import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/data/data.json', () => ({
  default: {
    history: [
      { title: 'Entry 1', richText: '<p>Text 1</p>', personIds: ['p001', 'p002'], hidden: false },
      { title: 'Entry 2', richText: '<p>Text 2</p>', personIds: ['p003'], hidden: true },
      { title: 'Entry 3', richText: '<p>Text 3</p>', personIds: ['p001'], hidden: false },
    ],
  },
}));

let getHistoryEntries: typeof import('./history').getHistoryEntries;
let getHistoryEntriesByPerson: typeof import('./history').getHistoryEntriesByPerson;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import('./history');
  getHistoryEntries = mod.getHistoryEntries;
  getHistoryEntriesByPerson = mod.getHistoryEntriesByPerson;
});

describe('getHistoryEntries', () => {
  it('returns only visible entries by default', () => {
    const entries = getHistoryEntries();
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.title)).toEqual(['Entry 1', 'Entry 3']);
  });

  it('returns all entries when includeHidden is true', () => {
    const entries = getHistoryEntries({ includeHidden: true });
    expect(entries).toHaveLength(3);
  });
});

describe('getHistoryEntriesByPerson', () => {
  it('returns entries matching personId with correct indices', () => {
    const results = getHistoryEntriesByPerson('p001');
    expect(results).toHaveLength(2);
    expect(results[0]!.entry.title).toBe('Entry 1');
    expect(results[0]!.index).toBe(0);
    expect(results[1]!.entry.title).toBe('Entry 3');
    expect(results[1]!.index).toBe(1);
  });

  it('returns empty array for unknown personId', () => {
    expect(getHistoryEntriesByPerson('p999')).toEqual([]);
  });

  it('excludes hidden entries', () => {
    const results = getHistoryEntriesByPerson('p003');
    expect(results).toEqual([]);
  });
});
