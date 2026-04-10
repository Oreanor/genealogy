import { describe, it, expect } from 'vitest';
import type { PhotoEntry } from '@/lib/types/photo';
import {
  getPhotos,
  getPhotoById,
  getPhotoBySrc,
  getPhotosByCategory,
  getPhotosByPerson,
  getPhotosEligibleForAvatarFromList,
  getPersonFaceRect,
  getAvatarForPerson,
  getAvatarOptionsForPerson,
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

  it('getPhotosByPerson returns photos with person in people', () => {
    const list = getPhotosByPerson('non-existent');
    expect(list).toEqual([]);
    const all = getPhotos();
    const withPeople = all.find((p) => (p.people ?? []).length > 0);
    if (withPeople?.people?.[0]) {
      const pid = withPeople.people[0].personId;
      if (pid) {
        const byPerson = getPhotosByPerson(pid);
        expect(byPerson.some((p) => (p.people ?? []).some((pp) => pp.personId === pid))).toBe(true);
      }
    }
  });

  it('getImageLinksByCategory returns strings (src and backSrc when present)', () => {
    const links = getImageLinksByCategory('related');
    expect(Array.isArray(links)).toBe(true);
    expect(links.every((s) => typeof s === 'string' && s.length > 0)).toBe(true);
  });

  it('getPhotoBySrc finds by src and returns null for missing', () => {
    const list = getPhotos();
    const first = list[0];
    if (first) {
      expect(getPhotoBySrc(first.src)).toEqual(expect.objectContaining({ src: first.src }));
    }
    expect(getPhotoBySrc('/non/existent/path.jpg')).toBeNull();
  });

  it('getPhotosEligibleForAvatarFromList returns photos where person is in people', () => {
    const list: PhotoEntry[] = [
      { id: 'a', src: '/a.jpg', category: 'personal', people: [{ personId: 'p1' }] },
      { id: 'b', src: '/b.jpg', category: 'group', people: [{ personId: 'p1', coords: [0, 0, 10, 10] }] },
      { id: 'c', src: '/c.jpg', category: 'related' },
    ];
    const eligible = getPhotosEligibleForAvatarFromList(list, 'p1');
    expect(eligible).toHaveLength(2);
    expect(eligible.map((p) => p.id)).toEqual(['a', 'b']);
    expect(getPhotosEligibleForAvatarFromList(list, 'p99')).toHaveLength(0);
  });

  it('getPersonFaceRect returns rect coords when coords length >= 4', () => {
    const photo = { id: 'x', src: '/x.jpg', people: [{ personId: 'p1', coords: [10, 20, 50, 80] }] };
    expect(getPersonFaceRect(photo, 'p1')).toEqual([10, 20, 50, 80]);
    expect(getPersonFaceRect(photo, 'p2')).toBeNull();
    expect(getPersonFaceRect({ ...photo, people: [{ personId: 'p1' }] }, 'p1')).toBeNull();
  });

  it('getAvatarForPerson prefers personal, then group; preferredPhotoSrc used when valid', () => {
    expect(getAvatarForPerson('non-existent')).toBeNull();
    const all = getPhotos();
    const withPhoto = all.find((p) => (p.people ?? []).some((pp) => pp.personId));
    const entry = withPhoto?.people?.find((pp) => pp.personId);
    if (withPhoto && entry?.personId) {
      const pid = entry.personId;
      const avatar = getAvatarForPerson(pid);
      expect(avatar).not.toBeNull();
      expect(avatar!.src).toBeDefined();
      expect(all.some((p) => p.src === avatar!.src && (p.people ?? []).some((pp) => pp.personId === pid))).toBe(true);
      const withPreferred = getAvatarForPerson(pid, withPhoto.src);
      expect(withPreferred?.src).toBe(withPhoto.src);
    }
  });

  it('getAvatarForPerson falls back to group when personal is missing', () => {
    const all = getPhotos();
    const groupedOnly = all.find((p) =>
      p.category === 'group' &&
      (p.people ?? []).some((pp) => pp.personId) &&
      !(all.some((x) =>
        x.category === 'personal' &&
        (x.people ?? []).some((xp) =>
          xp.personId === (p.people ?? []).find((pp) => pp.personId)?.personId
        )
      ))
    );
    const pid = groupedOnly?.people?.find((pp) => pp.personId)?.personId;
    if (groupedOnly && pid) {
      const avatar = getAvatarForPerson(pid);
      expect(avatar?.src).toBe(groupedOnly.src);
    }
  });

  it('getAvatarOptionsForPerson returns all eligible photos with face rect', () => {
    const opts = getAvatarOptionsForPerson('non-existent');
    expect(opts).toEqual([]);
    const withPhoto = getPhotos().find((p) => (p.people ?? []).some((pp) => pp.personId));
    const entry = withPhoto?.people?.find((pp) => pp.personId);
    if (withPhoto && entry?.personId) {
      const options = getAvatarOptionsForPerson(entry.personId);
      expect(options.length).toBeGreaterThan(0);
      options.forEach((o) => {
        expect(o).toHaveProperty('src');
        expect(o.faceRect === null || (Array.isArray(o.faceRect) && o.faceRect.length === 4)).toBe(true);
      });
    }
  });
});
