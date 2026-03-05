import { describe, it, expect } from 'vitest';
import { getTreeRoleKey } from './relationship';
import type { Person } from '@/lib/types/person';

const male: Person = {
  id: 'p1',
  firstName: 'A',
  lastName: 'B',
  gender: 'm',
};
const female: Person = {
  id: 'p2',
  firstName: 'C',
  lastName: 'D',
  gender: 'f',
};

describe('getTreeRoleKey', () => {
  it('returns empty for null person', () => {
    expect(getTreeRoleKey(0, 0, null)).toBe('');
    expect(getTreeRoleKey(2, 0, null)).toBe('');
  });

  it('returns roleMe for level 0', () => {
    expect(getTreeRoleKey(0, 0, male)).toBe('roleMe');
  });

  it('returns roleFather/roleMother for level 1', () => {
    expect(getTreeRoleKey(1, 0, male)).toBe('roleFather');
    expect(getTreeRoleKey(1, 1, female)).toBe('roleMother');
  });

  it('returns grandfather/grandmother for level 2', () => {
    expect(getTreeRoleKey(2, 0, male)).toBe('roleGrandfather');
    expect(getTreeRoleKey(2, 1, female)).toBe('roleGrandmother');
  });

  it('returns great-grandfather/great-grandmother for level 3', () => {
    expect(getTreeRoleKey(3, 0, male)).toBe('roleGreatGrandfather');
    expect(getTreeRoleKey(3, 1, female)).toBe('roleGreatGrandmother');
  });

  it('returns gg-grandfather/gg-grandmother for level 4', () => {
    expect(getTreeRoleKey(4, 0, male)).toBe('roleGgGrandfather');
    expect(getTreeRoleKey(4, 1, female)).toBe('roleGgGrandmother');
  });

  it('returns ggg-grandfather/ggg-grandmother for level 5', () => {
    expect(getTreeRoleKey(5, 0, male)).toBe('roleGggGrandfather');
    expect(getTreeRoleKey(5, 1, female)).toBe('roleGggGrandmother');
  });

  it('returns empty for unknown level', () => {
    expect(getTreeRoleKey(6, 0, male)).toBe('');
  });
});
