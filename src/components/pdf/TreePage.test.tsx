import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import type { Person } from '@/lib/types/person';

function collectStrings(node: unknown, out: string[] = []) {
  if (node == null || typeof node === 'boolean') return out;
  if (typeof node === 'string' || typeof node === 'number') {
    out.push(String(node));
    return out;
  }
  if (Array.isArray(node)) {
    for (const n of node) collectStrings(n, out);
    return out;
  }
  if (React.isValidElement(node)) {
    collectStrings((node as { props?: { children?: unknown } }).props?.children, out);
  }
  return out;
}

const labels = {
  chapterTree: 'Tree label',
  roleLabels: {
    role1: 'Role label',
  },
};

const person1: Person = {
  id: 'p1',
  firstName: 'A',
  patronymic: 'B',
  lastName: 'C',
  birthDate: '1900',
  // no avatarPhotoSrc required because we mock getAvatarForPerson
};

const person2: Person = {
  id: 'p2',
  firstName: 'D',
  lastName: 'E',
  // no birth/death to cover false branch
};

// Person not in the treeIds set; used to ensure siblingsCount > 0.
const externalPerson: Person = { id: 'p3', firstName: 'X', lastName: 'Y' };

vi.mock('@/lib/data/root', () => ({
  getRootPersonId: () => 'root',
}));

vi.mock('@/lib/utils/tree', () => ({
  buildTreeMatrix: () => [
    [person1, null],
    [null, person2],
  ],
}));

vi.mock('@/lib/data/familyRelations', () => ({
  getSiblings: (id: string) => (id === 'p1' ? [externalPerson] : []),
  getCousins: () => [],
}));

vi.mock('@/lib/utils/relationship', () => ({
  getTreeRoleKey: (level: number, index: number) => (level === 0 && index === 0 ? 'role1' : null),
}));

vi.mock('@/lib/data/photos', () => ({
  getAvatarForPerson: (id: string) => (id === 'p1' ? { src: 'avatar-1.jpg' } : null),
}));

vi.mock('@/lib/utils/person', async () => {
  return {
    ...(await vi.importActual<typeof import('@/lib/utils/person')>('@/lib/utils/person')),
    formatLifeDates: () => '1900-1901',
  };
});

describe('TreePage', () => {
  it('renders labels and executes major branches', async () => {
    const { TreePage } = await import('./TreePage');
    const tree = TreePage({ labels });
    const strings = collectStrings(tree);

    expect(strings).toContain(labels.chapterTree);
    expect(strings).toContain('Role label');
    expect(strings).toContain('1900-1901');

    // siblingsCount should be > 0 for person1 => "+1" should be present.
    expect(strings.join('')).toContain('+1');
  });
});

