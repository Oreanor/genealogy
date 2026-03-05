import { describe, it, expect } from 'vitest';
import { getPersons, getPersonById } from './persons';

describe('persons data', () => {
  describe('getPersons', () => {
    it('returns array', () => {
      const persons = getPersons();
      expect(Array.isArray(persons)).toBe(true);
    });

    it('each person has id and firstName', () => {
      const persons = getPersons();
      persons.forEach((p) => {
        expect(p).toHaveProperty('id');
        expect(p).toHaveProperty('firstName');
        expect(typeof p.id).toBe('string');
        expect(typeof p.firstName).toBe('string');
      });
    });
  });

  describe('getPersonById', () => {
    it('returns null for unknown id', () => {
      expect(getPersonById('unknown')).toBeNull();
    });
  });
});
