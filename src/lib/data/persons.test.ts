import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import {
  getBundledPersons,
  getPersons,
  getPersonById,
  getPersonsOverlayVersion,
  setAdminWorkingPersons,
  subscribePersonsOverlay,
} from './persons';

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

  describe('snapshot cache and overlay', () => {
    // Node 22+ ships its own (inert) global localStorage that can shadow the DOM one.
    beforeEach(() => {
      const store = new Map<string, string>();
      vi.stubGlobal('localStorage', {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      });
    });

    afterEach(() => {
      setAdminWorkingPersons(null);
      vi.unstubAllGlobals();
    });

    it('returns the same array until something changes', () => {
      expect(getPersons()).toBe(getPersons());
    });

    it('invalidates and notifies when the admin overlay changes', () => {
      const listener = vi.fn();
      const unsubscribe = subscribePersonsOverlay(listener);
      const before = getPersons();
      const version = getPersonsOverlayVersion();

      const [first] = getBundledPersons();
      setAdminWorkingPersons(first ? [{ ...first, comment: 'edited' }] : []);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(getPersonsOverlayVersion()).toBe(version + 1);
      expect(getPersons()).not.toBe(before);
      unsubscribe();
    });

    it('invalidates when name locks change', () => {
      const before = getPersons();
      localStorage.setItem(STORAGE_KEYS.personNameLocks, JSON.stringify(['someone']));
      expect(getPersons()).not.toBe(before);
    });
  });
});
