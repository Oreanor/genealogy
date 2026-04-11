import { describe, it, expect } from 'vitest';
import {
  person,
  photo,
  history,
  makeData,
} from '@/lib/data/__fixtures__/dataMerge';
import {
  computeMerge,
  applyMerge,
  mergeHasChanges,
  mergeHasConflicts,
  buildDefaultResolutions,
  validateImportData,
  parseAdminImportData,
  hashData,
  changedKeys,
  type MergeResolutions,
} from './dataMerge';

// ---------------------------------------------------------------------------
// computeMerge
// ---------------------------------------------------------------------------

describe('computeMerge', () => {
  it('detects identical data as no changes', () => {
    const data = makeData({
      persons: [person('p1'), person('p2')],
      photos: [photo('ph1')],
      history: [history('Story A')],
    });
    const m = computeMerge(data, data);
    expect(mergeHasChanges(m)).toBe(false);
    expect(mergeHasConflicts(m)).toBe(false);
  });

  it('detects new persons (additive)', () => {
    const current = makeData({ persons: [person('p1')] });
    const incoming = makeData({ persons: [person('p1'), person('p2')] });
    const m = computeMerge(current, incoming);

    expect(m.persons.toAdd).toHaveLength(1);
    expect(m.persons.toAdd[0].id).toBe('p2');
    expect(m.persons.conflicts).toHaveLength(0);
    expect(mergeHasChanges(m)).toBe(true);
    expect(mergeHasConflicts(m)).toBe(false);
  });

  it('detects person conflicts (same id, different data)', () => {
    const current = makeData({
      persons: [person('p1', { birthDate: '1990' })],
    });
    const incoming = makeData({
      persons: [person('p1', { birthDate: '1991' })],
    });
    const m = computeMerge(current, incoming);

    expect(m.persons.toAdd).toHaveLength(0);
    expect(m.persons.conflicts).toHaveLength(1);
    expect(m.persons.conflicts[0].existing.birthDate).toBe('1990');
    expect(m.persons.conflicts[0].incoming.birthDate).toBe('1991');
    expect(mergeHasConflicts(m)).toBe(true);
  });

  it('detects new photos', () => {
    const current = makeData({ photos: [photo('ph1')] });
    const incoming = makeData({ photos: [photo('ph1'), photo('ph2')] });
    const m = computeMerge(current, incoming);

    expect(m.photos.toAdd).toHaveLength(1);
    expect(m.photos.toAdd[0].id).toBe('ph2');
  });

  it('detects photo conflicts', () => {
    const current = makeData({
      photos: [photo('ph1', { caption: 'old' })],
    });
    const incoming = makeData({
      photos: [photo('ph1', { caption: 'new' })],
    });
    const m = computeMerge(current, incoming);

    expect(m.photos.conflicts).toHaveLength(1);
  });

  it('detects photo conflict when people array differs', () => {
    const current = makeData({
      photos: [photo('ph1', { people: [{ personId: 'p1' }] })],
    });
    const incoming = makeData({
      photos: [
        photo('ph1', {
          people: [{ personId: 'p1' }, { personId: 'p2' }],
        }),
      ],
    });
    const m = computeMerge(current, incoming);

    expect(m.photos.conflicts).toHaveLength(1);
    expect(m.photos.conflicts[0].existing.people).toHaveLength(1);
    expect(m.photos.conflicts[0].incoming.people).toHaveLength(2);
  });

  it('detects photo conflict when face coords change', () => {
    const current = makeData({
      photos: [
        photo('ph1', {
          people: [{ personId: 'p1', coords: [10, 20, 30, 40] }],
        }),
      ],
    });
    const incoming = makeData({
      photos: [
        photo('ph1', {
          people: [{ personId: 'p1', coords: [15, 25, 35, 45] }],
        }),
      ],
    });
    const m = computeMerge(current, incoming);

    expect(m.photos.conflicts).toHaveLength(1);
  });

  it('detects new history entries by title', () => {
    const current = makeData({ history: [history('A')] });
    const incoming = makeData({ history: [history('A'), history('B')] });
    const m = computeMerge(current, incoming);

    expect(m.history.toAdd).toHaveLength(1);
    expect(m.history.toAdd[0].title).toBe('B');
  });

  it('detects history conflicts (same title, different content)', () => {
    const current = makeData({
      history: [history('A', { richText: '<p>old</p>' })],
    });
    const incoming = makeData({
      history: [history('A', { richText: '<p>new</p>' })],
    });
    const m = computeMerge(current, incoming);

    expect(m.history.conflicts).toHaveLength(1);
  });

  it('detects history conflict when personIds differ', () => {
    const current = makeData({
      history: [history('A', { personIds: ['p1'] })],
    });
    const incoming = makeData({
      history: [history('A', { personIds: ['p1', 'p2'] })],
    });
    const m = computeMerge(current, incoming);

    expect(m.history.conflicts).toHaveLength(1);
  });

  it('detects root person conflict', () => {
    const current = makeData({ rootPersonId: 'p1' });
    const incoming = makeData({ rootPersonId: 'p2' });
    const m = computeMerge(current, incoming);

    expect(m.rootConflict).toBe(true);
    expect(m.incomingRootPersonId).toBe('p2');
    expect(mergeHasConflicts(m)).toBe(true);
  });

  it('no root conflict when same root', () => {
    const a = makeData({ rootPersonId: 'p1' });
    const b = makeData({ rootPersonId: 'p1' });
    expect(computeMerge(a, b).rootConflict).toBe(false);
  });

  it('handles mixed: new + conflict + unchanged across sections', () => {
    const current = makeData({
      persons: [
        person('p1', { firstName: 'Alice' }),
        person('p2', { firstName: 'Bob' }),
      ],
      photos: [photo('ph1')],
      history: [history('A')],
    });
    const incoming = makeData({
      persons: [
        person('p1', { firstName: 'Alicia' }),
        person('p2', { firstName: 'Bob' }),
        person('p3', { firstName: 'Charlie' }),
      ],
      photos: [photo('ph1'), photo('ph2')],
      history: [history('A'), history('B')],
    });
    const m = computeMerge(current, incoming);

    expect(m.persons.toAdd).toHaveLength(1);
    expect(m.persons.conflicts).toHaveLength(1);
    expect(m.photos.toAdd).toHaveLength(1);
    expect(m.photos.conflicts).toHaveLength(0);
    expect(m.history.toAdd).toHaveLength(1);
    expect(m.history.conflicts).toHaveLength(0);
  });

  it('incoming with fewer items than current does not produce removals', () => {
    const current = makeData({
      persons: [person('p1'), person('p2'), person('p3')],
      photos: [photo('ph1'), photo('ph2')],
      history: [history('A'), history('B')],
    });
    const incoming = makeData({
      persons: [person('p1')],
      photos: [photo('ph1')],
      history: [history('A')],
    });
    const m = computeMerge(current, incoming);

    expect(m.persons.toAdd).toHaveLength(0);
    expect(m.persons.conflicts).toHaveLength(0);
    expect(m.photos.toAdd).toHaveLength(0);
    expect(m.photos.conflicts).toHaveLength(0);
    expect(m.history.toAdd).toHaveLength(0);
    expect(m.history.conflicts).toHaveLength(0);
    expect(mergeHasChanges(m)).toBe(false);
  });

  it('mergeHasChanges is true when only root differs', () => {
    const a = makeData({ rootPersonId: 'p1' });
    const b = makeData({ rootPersonId: 'p2' });
    const m = computeMerge(a, b);

    expect(m.persons.toAdd).toHaveLength(0);
    expect(m.persons.conflicts).toHaveLength(0);
    expect(mergeHasChanges(m)).toBe(true);
  });

  it('detects lineDynamics conflict', () => {
    const current = makeData({
      lineDynamics: {
        title: 'A',
        description: '',
        data: [],
      },
    });
    const incoming = makeData({
      lineDynamics: {
        title: 'B',
        description: '',
        data: [],
      },
    });
    const m = computeMerge(current, incoming);
    expect(m.lineDynamicsConflict).toBe(true);
    expect(mergeHasConflicts(m)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// applyMerge
// ---------------------------------------------------------------------------

describe('applyMerge', () => {
  it('adds new records without touching existing', () => {
    const current = makeData({ persons: [person('p1')] });
    const incoming = makeData({ persons: [person('p1'), person('p2')] });
    const m = computeMerge(current, incoming);
    const res = buildDefaultResolutions(m);
    const result = applyMerge(current, m, res);

    expect(result.persons).toHaveLength(2);
    expect(result.persons.map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  it('keeps existing when resolution is "keep"', () => {
    const current = makeData({
      persons: [person('p1', { birthDate: '1990' })],
    });
    const incoming = makeData({
      persons: [person('p1', { birthDate: '2000' })],
    });
    const m = computeMerge(current, incoming);
    const res: MergeResolutions = {
      persons: ['keep'],
      photos: [],
      history: [],
      rootPersonId: 'keep',
      placeFallbacks: 'keep',
      lineDynamics: 'keep',
    };
    const result = applyMerge(current, m, res);

    expect(result.persons[0].birthDate).toBe('1990');
  });

  it('takes incoming when resolution is "take"', () => {
    const current = makeData({
      persons: [person('p1', { birthDate: '1990' })],
    });
    const incoming = makeData({
      persons: [person('p1', { birthDate: '2000' })],
    });
    const m = computeMerge(current, incoming);
    const res: MergeResolutions = {
      persons: ['take'],
      photos: [],
      history: [],
      rootPersonId: 'keep',
      placeFallbacks: 'keep',
      lineDynamics: 'keep',
    };
    const result = applyMerge(current, m, res);

    expect(result.persons[0].birthDate).toBe('2000');
  });

  it('resolves per-record: mixed keep/take on persons', () => {
    const current = makeData({
      persons: [
        person('p1', { birthDate: '1990' }),
        person('p2', { birthPlace: 'CityA' }),
      ],
    });
    const incoming = makeData({
      persons: [
        person('p1', { birthDate: '2000' }),
        person('p2', { birthPlace: 'CityB' }),
      ],
    });
    const m = computeMerge(current, incoming);
    const res: MergeResolutions = {
      persons: ['take', 'keep'],
      photos: [],
      history: [],
      rootPersonId: 'keep',
      placeFallbacks: 'keep',
      lineDynamics: 'keep',
    };
    const result = applyMerge(current, m, res);

    expect(result.persons[0].birthDate).toBe('2000');
    expect(result.persons[1].birthPlace).toBe('CityA');
  });

  it('applies root change when resolution is "take"', () => {
    const current = makeData({ rootPersonId: 'p1' });
    const incoming = makeData({ rootPersonId: 'p2' });
    const m = computeMerge(current, incoming);
    const res: MergeResolutions = {
      persons: [],
      photos: [],
      history: [],
      rootPersonId: 'take',
      placeFallbacks: 'keep',
      lineDynamics: 'keep',
    };
    const result = applyMerge(current, m, res);

    expect(result.rootPersonId).toBe('p2');
  });

  it('keeps root when resolution is "keep"', () => {
    const current = makeData({ rootPersonId: 'p1' });
    const incoming = makeData({ rootPersonId: 'p2' });
    const m = computeMerge(current, incoming);
    const res: MergeResolutions = {
      persons: [],
      photos: [],
      history: [],
      rootPersonId: 'keep',
      placeFallbacks: 'keep',
      lineDynamics: 'keep',
    };
    const result = applyMerge(current, m, res);

    expect(result.rootPersonId).toBe('p1');
  });

  it('root "take" without actual conflict is a no-op', () => {
    const data = makeData({ rootPersonId: 'p1' });
    const m = computeMerge(data, data);
    const res: MergeResolutions = {
      persons: [],
      photos: [],
      history: [],
      rootPersonId: 'take',
      placeFallbacks: 'keep',
      lineDynamics: 'keep',
    };
    const result = applyMerge(data, m, res);

    expect(m.rootConflict).toBe(false);
    expect(result.rootPersonId).toBe('p1');
  });

  it('applies history merge with per-record resolution', () => {
    const current = makeData({
      history: [
        history('A', { richText: '<p>old-a</p>' }),
        history('B', { richText: '<p>old-b</p>' }),
      ],
    });
    const incoming = makeData({
      history: [
        history('A', { richText: '<p>new-a</p>' }),
        history('B', { richText: '<p>new-b</p>' }),
        history('C', { richText: '<p>brand-new</p>' }),
      ],
    });
    const m = computeMerge(current, incoming);
    const res: MergeResolutions = {
      persons: [],
      photos: [],
      history: ['take', 'keep'],
      rootPersonId: 'keep',
      placeFallbacks: 'keep',
      lineDynamics: 'keep',
    };
    const result = applyMerge(current, m, res);

    expect(result.history).toHaveLength(3);
    expect(result.history.find((h) => h.title === 'A')?.richText).toBe(
      '<p>new-a</p>'
    );
    expect(result.history.find((h) => h.title === 'B')?.richText).toBe(
      '<p>old-b</p>'
    );
    expect(result.history.find((h) => h.title === 'C')?.richText).toBe(
      '<p>brand-new</p>'
    );
  });

  it('resolves photo conflict with people array (take)', () => {
    const current = makeData({
      photos: [photo('ph1', { people: [{ personId: 'p1' }] })],
    });
    const incoming = makeData({
      photos: [
        photo('ph1', {
          people: [{ personId: 'p1' }, { personId: 'p2', coords: [1, 2, 3, 4] }],
        }),
      ],
    });
    const m = computeMerge(current, incoming);
    const res: MergeResolutions = {
      persons: [],
      photos: ['take'],
      history: [],
      rootPersonId: 'keep',
      placeFallbacks: 'keep',
      lineDynamics: 'keep',
    };
    const result = applyMerge(current, m, res);

    expect(result.photos[0].people).toHaveLength(2);
    expect(result.photos[0].people![1].personId).toBe('p2');
  });

  it('preserves order: current records first, then toAdd', () => {
    const current = makeData({
      persons: [person('p1'), person('p2')],
    });
    const incoming = makeData({
      persons: [person('p1'), person('p2'), person('p3'), person('p4')],
    });
    const m = computeMerge(current, incoming);
    const res = buildDefaultResolutions(m);
    const result = applyMerge(current, m, res);

    expect(result.persons.map((p) => p.id)).toEqual([
      'p1',
      'p2',
      'p3',
      'p4',
    ]);
  });

  it('incoming with fewer items does not remove current records', () => {
    const current = makeData({
      persons: [person('p1'), person('p2'), person('p3')],
    });
    const incoming = makeData({ persons: [person('p1')] });
    const m = computeMerge(current, incoming);
    const res = buildDefaultResolutions(m);
    const result = applyMerge(current, m, res);

    expect(result.persons).toHaveLength(3);
    expect(result.persons.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
  });

  it('full scenario: add + conflicts + unchanged across all sections', () => {
    const current = makeData({
      rootPersonId: 'p1',
      persons: [person('p1', { firstName: 'Alice' }), person('p2')],
      photos: [photo('ph1', { caption: 'old' })],
      history: [history('Story', { richText: '<p>v1</p>' })],
    });
    const incoming = makeData({
      rootPersonId: 'p99',
      persons: [
        person('p1', { firstName: 'Alicia' }),
        person('p2'),
        person('p3'),
      ],
      photos: [photo('ph1', { caption: 'new' }), photo('ph2')],
      history: [
        history('Story', { richText: '<p>v2</p>' }),
        history('New Story'),
      ],
    });
    const m = computeMerge(current, incoming);
    const res: MergeResolutions = {
      persons: ['take'],
      photos: ['keep'],
      history: ['take'],
      rootPersonId: 'take',
      placeFallbacks: 'keep',
      lineDynamics: 'keep',
    };
    const result = applyMerge(current, m, res);

    expect(result.rootPersonId).toBe('p99');
    expect(result.persons).toHaveLength(3);
    expect(result.persons.find((p) => p.id === 'p1')?.firstName).toBe(
      'Alicia'
    );
    expect(result.photos).toHaveLength(2);
    expect(result.photos.find((p) => p.id === 'ph1')?.caption).toBe('old');
    expect(result.history).toHaveLength(2);
    expect(result.history.find((h) => h.title === 'Story')?.richText).toBe(
      '<p>v2</p>'
    );
  });
});

// ---------------------------------------------------------------------------
// buildDefaultResolutions
// ---------------------------------------------------------------------------

describe('buildDefaultResolutions', () => {
  it('creates "keep" for every conflict', () => {
    const current = makeData({
      persons: [person('p1', { birthDate: '1990' })],
      photos: [photo('ph1', { caption: 'a' })],
      history: [history('A', { richText: 'x' })],
    });
    const incoming = makeData({
      persons: [person('p1', { birthDate: '2000' })],
      photos: [photo('ph1', { caption: 'b' })],
      history: [history('A', { richText: 'y' })],
    });
    const m = computeMerge(current, incoming);
    const res = buildDefaultResolutions(m);

    expect(res.persons).toEqual(['keep']);
    expect(res.photos).toEqual(['keep']);
    expect(res.history).toEqual(['keep']);
    expect(res.rootPersonId).toBe('keep');
    expect(res.placeFallbacks).toBe('keep');
    expect(res.lineDynamics).toBe('keep');
  });

  it('creates empty arrays when there are no conflicts', () => {
    const m = computeMerge(makeData(), makeData());
    const res = buildDefaultResolutions(m);

    expect(res.persons).toEqual([]);
    expect(res.photos).toEqual([]);
    expect(res.history).toEqual([]);
    expect(res.rootPersonId).toBe('keep');
    expect(res.placeFallbacks).toBe('keep');
    expect(res.lineDynamics).toBe('keep');
  });
});

// ---------------------------------------------------------------------------
// validateImportData
// ---------------------------------------------------------------------------

describe('validateImportData', () => {
  it('accepts valid data', () => {
    expect(validateImportData(makeData())).toBe(true);
  });

  it('rejects null', () => {
    expect(validateImportData(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(validateImportData(undefined)).toBe(false);
  });

  it('rejects non-object', () => {
    expect(validateImportData('string')).toBe(false);
    expect(validateImportData(42)).toBe(false);
    expect(validateImportData(true)).toBe(false);
  });

  it('rejects empty object', () => {
    expect(validateImportData({})).toBe(false);
  });

  it('rejects missing keys', () => {
    expect(validateImportData({ rootPersonId: 'p1', persons: [] })).toBe(
      false
    );
    expect(
      validateImportData({ rootPersonId: 'p1', persons: [], photos: [] })
    ).toBe(false);
  });

  it('accepts when all required keys present', () => {
    expect(
      validateImportData({
        rootPersonId: 'p1',
        persons: [],
        photos: [],
        history: [],
        placeFallbacks: {},
      })
    ).toBe(true);
  });

  it('accepts data with extra keys (not strict)', () => {
    expect(
      validateImportData({
        rootPersonId: 'p1',
        persons: [],
        photos: [],
        history: [],
        placeFallbacks: {},
        customField: 'hello',
      })
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// parseAdminImportData
// ---------------------------------------------------------------------------

describe('parseAdminImportData', () => {
  it('fills empty lineDynamics when key is missing', () => {
    const raw = {
      rootPersonId: 'p1',
      persons: [],
      photos: [],
      history: [],
      placeFallbacks: {},
    };
    const parsed = parseAdminImportData(raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.lineDynamics.data).toEqual([]);
    expect(parsed!.lineDynamics.title).toBe('');
  });

  it('preserves lineDynamics when present', () => {
    const raw = {
      rootPersonId: 'p1',
      persons: [],
      photos: [],
      history: [],
      placeFallbacks: {},
      lineDynamics: {
        title: 'T',
        description: 'D',
        data: [{ decade: '1990', low: 1, mid: 2, high: 3, cluster_uman: 0, cluster_sumy: 0 }],
      },
    };
    const parsed = parseAdminImportData(raw);
    expect(parsed!.lineDynamics.title).toBe('T');
    expect(parsed!.lineDynamics.data).toHaveLength(1);
  });

  it('accepts legacy nikonetsLineDynamics import key', () => {
    const raw = {
      rootPersonId: 'p1',
      persons: [],
      photos: [],
      history: [],
      placeFallbacks: {},
      nikonetsLineDynamics: {
        title: 'Legacy',
        description: '',
        data: [],
      },
    };
    const parsed = parseAdminImportData(raw);
    expect(parsed!.lineDynamics.title).toBe('Legacy');
  });
});

// ---------------------------------------------------------------------------
// hashData
// ---------------------------------------------------------------------------

describe('hashData', () => {
  it('returns same hash for identical data', () => {
    const a = makeData({ persons: [person('p1')] });
    const b = makeData({ persons: [person('p1')] });
    expect(hashData(a)).toBe(hashData(b));
  });

  it('returns different hash for different data', () => {
    const a = makeData({ persons: [person('p1')] });
    const b = makeData({ persons: [person('p2')] });
    expect(hashData(a)).not.toBe(hashData(b));
  });

  it('returns a non-empty string', () => {
    expect(hashData(makeData()).length).toBeGreaterThan(0);
  });

  it('is sensitive to array element order', () => {
    const a = makeData({ persons: [person('p1'), person('p2')] });
    const b = makeData({ persons: [person('p2'), person('p1')] });
    expect(hashData(a)).not.toBe(hashData(b));
  });

  it('differs when nested fields change', () => {
    const a = makeData({
      photos: [photo('ph1', { people: [{ personId: 'p1' }] })],
    });
    const b = makeData({
      photos: [photo('ph1', { people: [{ personId: 'p2' }] })],
    });
    expect(hashData(a)).not.toBe(hashData(b));
  });
});

// ---------------------------------------------------------------------------
// changedKeys
// ---------------------------------------------------------------------------

describe('changedKeys', () => {
  it('returns empty array for identical objects', () => {
    const obj = { a: 1, b: 'x' };
    expect(changedKeys(obj, obj)).toEqual([]);
  });

  it('lists keys with different values', () => {
    const a = { a: 1, b: 2, c: 3 };
    const b = { a: 1, b: 99, c: 3 };
    expect(changedKeys(a, b)).toEqual(['b']);
  });

  it('detects keys present only in one object', () => {
    const a = { a: 1 } as Record<string, unknown>;
    const b = { a: 1, b: 2 } as Record<string, unknown>;
    expect(changedKeys(a, b)).toEqual(['b']);
  });

  it('handles nested differences via JSON serialization', () => {
    const a = { data: [1, 2, 3] } as Record<string, unknown>;
    const b = { data: [1, 2, 4] } as Record<string, unknown>;
    expect(changedKeys(a, b)).toEqual(['data']);
  });

  it('reports multiple changed keys', () => {
    const a = { x: 1, y: 2, z: 3 };
    const b = { x: 10, y: 2, z: 30 };
    expect(changedKeys(a, b).sort((a, b) => a.localeCompare(b))).toEqual(['x', 'z']);
  });
});
