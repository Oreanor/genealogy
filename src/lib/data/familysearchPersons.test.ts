import { describe, it, expect } from 'vitest';
import { getFamilySearchPersons } from './familysearchPersons';

describe('getFamilySearchPersons', () => {
  it('returns committed bundle with meta and non-empty persons', () => {
    const bundle = getFamilySearchPersons();
    expect(bundle.meta).toBeDefined();
    expect(Array.isArray(bundle.persons)).toBe(true);
    expect(bundle.persons.length).toBeGreaterThan(0);
    const p = bundle.persons[0]!;
    expect(typeof p.id).toBe('string');
    expect(p.id.startsWith('fs-')).toBe(true);
  });
});
