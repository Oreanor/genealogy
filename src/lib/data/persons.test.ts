import { describe, it, expect } from 'vitest';
import { getPersons, getPersonById } from './persons';

describe('persons data', () => {
  describe('getPersons', () => {
    it('returns non-empty array', () => {
      const persons = getPersons();
      expect(Array.isArray(persons)).toBe(true);
      expect(persons.length).toBeGreaterThan(0);
    });

    it('each person has id and name', () => {
      const persons = getPersons();
      persons.forEach((p) => {
        expect(p).toHaveProperty('id');
        expect(p).toHaveProperty('name');
        expect(typeof p.id).toBe('string');
        expect(typeof p.name).toBe('string');
      });
    });
  });

  describe('getPersonById', () => {
    it('returns person for valid id', () => {
      const p = getPersonById('person-1');
      expect(p).not.toBeNull();
      expect(p!.id).toBe('person-1');
      expect(p!.name).toBe('Иван Петрович Никонец');
    });

    it('returns null for unknown id', () => {
      expect(getPersonById('unknown')).toBeNull();
    });
  });
});
