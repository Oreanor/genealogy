import { describe, it, expect } from 'vitest';
import {
  getPhotos,
  getPhotoById,
  getPhotosByCategory,
  getPhotosByPerson,
  getImageLinksByCategory,
} from './photos';

describe('photos', () => {
  it('getPhotos returns array with category defaulting to related', () => {
    const list = getPhotos();
    expect(Array.isArray(list)).toBe(true);
    list.forEach((p) => {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('src');
      expect(['personal', 'group', 'related']).toContain(p.category);
    });
  });

  it('getPhotoById finds by id or src and returns null for missing', () => {
    const list = getPhotos();
    const first = list[0];
    if (first) {
      expect(getPhotoById(first.id)).toEqual(expect.objectContaining({ id: first.id }));
      expect(getPhotoById(first.src)).toEqual(expect.objectContaining({ src: first.src }));
    }
    expect(getPhotoById('non-existent-id-xyz')).toBeNull();
  });

  it('getPhotosByCategory returns only photos of that category', () => {
    const related = getPhotosByCategory('related');
    expect(related.every((p) => p.category === 'related')).toBe(true);
    const personal = getPhotosByCategory('personal');
    expect(personal.every((p) => p.category === 'personal')).toBe(true);
  });

  it('getPhotosByPerson returns photos with personId or in people', () => {
    const list = getPhotosByPerson('non-existent');
    expect(list).toEqual([]);
    const all = getPhotos();
    const withPerson = all.find((p) => p.personId);
    if (withPerson?.personId) {
      const byPerson = getPhotosByPerson(withPerson.personId);
      expect(byPerson.some((p) => p.personId === withPerson.personId)).toBe(true);
    }
  });

  it('getImageLinksByCategory returns strings (src and backSrc when present)', () => {
    const links = getImageLinksByCategory('related');
    expect(Array.isArray(links)).toBe(true);
    expect(links.every((s) => typeof s === 'string' && s.length > 0)).toBe(true);
  });
});
