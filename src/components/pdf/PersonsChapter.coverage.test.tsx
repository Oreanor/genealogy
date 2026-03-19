import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import type { Person } from '@/lib/types/person';
import { render, screen } from '@testing-library/react';

const labels = {
  chapterPersons: 'Persons label',
  spouseM: 'spouseM',
  spouseF: 'spouseF',
  parents: 'parents',
  children: 'children',
  siblings: 'siblings',
  years: 'years',
  birthPlace: 'birthPlace',
  residenceCity: 'residenceCity',
  occupation: 'occupation',
  comment: 'comment',
  mentionedIn: 'mentionedIn',
  photo: 'photo',
};

vi.mock('@react-pdf/renderer', () => ({
  Font: { register: vi.fn() },
  StyleSheet: { create: (styles: Record<string, unknown>) => styles },
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  View: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Image: (props: { src: string }) => <img src={props.src} alt="" />,
}));

const p1: Person = {
  id: 'p1',
  firstName: 'Ivan',
  lastName: 'Petrov',
  gender: 'm',
  birthDate: '1900',
  birthPlace: 'Moscow',
  occupation: 'teacher',
  residenceCity: 'Saint-P',
  comment: 'note',
  fatherId: 'f1',
  motherId: 'm1',
  avatarPhotoSrc: 'avatar-p1.jpg',
};

const father: Person = { id: 'f1', firstName: 'F', lastName: 'Father', gender: 'm' };
const mother: Person = { id: 'm1', firstName: 'M', lastName: 'Mother', gender: 'f' };
const spouse: Person = { id: 's1', firstName: 'Spouse', lastName: 'X', gender: 'f' };
const child: Person = { id: 'c1', firstName: 'Child', lastName: 'Y' };
const sibling: Person = { id: 'sib1', firstName: 'Sibling', lastName: 'Z' };
const p2: Person = {
  id: 'p2',
  firstName: 'NoPhoto',
  lastName: 'Person',
  // no birth/death, no avatar => exercises lots of false branches
};

vi.mock('@/lib/data/root', () => ({
  getRootPersonId: () => 'root',
}));

vi.mock('@/lib/utils/tree', () => ({
  buildTreeMatrix: () => [[p1, p2]],
}));

vi.mock('@/lib/data/persons', () => ({
  getPersons: () => [p1, p2],
  getPersonById: (id: string) => {
    if (id === 'f1') return father;
    if (id === 'm1') return mother;
    return null;
  },
}));

vi.mock('@/lib/utils/person', () => ({
  formatLifeDates: () => '1900–1901',
  getFullName: (p: Person) => `${p.firstName} ${p.lastName ?? ''}`.trim(),
}));

vi.mock('@/lib/data/familyRelations', () => ({
  getChildren: (personId: string) => (personId === p1.id ? [child] : []),
  getSiblings: (personId: string) => (personId === p1.id ? [sibling] : []),
  getSpouse: (personId: string) => (personId === p1.id ? spouse : null),
}));

vi.mock('@/lib/data/history', () => ({
  getHistoryEntriesByPerson: (personId: string) =>
    personId === p1.id
      ? [
          {
            index: 0,
            entry: {
              title: 'Mention 1',
              richText: '<p>x</p>',
              personIds: [p1.id],
            },
          },
          {
            index: 1,
            entry: {
              // empty title => uses "#{index + 1}" fallback
              title: '',
              richText: '<p>y</p>',
              personIds: [p1.id],
            },
          },
        ]
      : [],
}));

vi.mock('@/lib/data/photos', () => ({
  getAvatarForPerson: (id: string) => (id === p1.id ? { src: 'avatar-p1.jpg' } : null),
}));

describe('PersonsChapter', () => {
  it('renders all major PersonInfo branches and photo/no-photo pages', async () => {
    const { PersonsChapter } = await import('./PersonsChapter');

    render(<PersonsChapter labels={labels} />);

    expect(screen.getByText(labels.chapterPersons)).toBeInTheDocument();

    // History mentions (includes fallback for empty title)
    expect(screen.getByText(/Mention 1/)).toBeInTheDocument();
    expect(screen.getByText(/#2/)).toBeInTheDocument();

    // Photo caption / person name for p1 (avatar exists)
    expect(screen.getAllByText(/Ivan Petrov/).length).toBeGreaterThan(0);
  });
});

