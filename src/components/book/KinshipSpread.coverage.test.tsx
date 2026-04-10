import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Person } from '@/lib/types/person';
import type { Locale } from '@/lib/i18n/config';

const p1: Person = { id: 'p1', firstName: 'A', lastName: 'One', gender: 'm', birthDate: '1900' };
const p2: Person = { id: 'p2', firstName: 'B', lastName: 'Two', gender: 'f', birthDate: '1901' };
const p3: Person = { id: 'p3', firstName: 'C', lastName: 'Three', gender: 'm', birthDate: '1902' };

const getPersonById = (id: string | null | undefined) => {
  switch (id) {
    case 'p1':
      return p1;
    case 'p2':
      return p2;
    case 'p3':
      return p3;
    default:
      return null;
  }
};

vi.mock('next/navigation', () => ({
  usePathname: () => '/kinship',
}));

vi.mock('@/lib/i18n/context', () => ({
  useLocale: (): Locale => 'en',
  useLocaleRoutes: () => ({
    t: (key: string) => {
      if (key === 'kinshipCommonAncestor') return 'Common ancestor:';
      return key;
    },
    locale: 'en' satisfies Locale,
  }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: unknown; children: React.ReactNode }) => (
    <a href={typeof href === 'string' ? href : String(href)}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt?: string }) => <img src={src} alt={alt ?? ''} />,
}));

vi.mock('@/lib/data/persons', () => ({
  getPersons: () => [p1, p2, p3],
  getPersonById: (id: string) => getPersonById(id),
  subscribePersonsOverlay: () => () => {},
}));

vi.mock('@/lib/data/familyRelations', () => ({
  getSiblings: () => [],
}));

vi.mock('@/lib/data/photos', () => ({
  getAvatarForPerson: (id: string) => {
    if (id === 'p3') return { src: 'avatar-p3.jpg', faceRect: [0, 0, 1, 1] };
    if (id === 'p2') return { src: 'avatar-p2.jpg' };
    return null;
  },
  getAvatarCropStyles: () => ({ width: 100, height: 100 }),
}));

vi.mock('@/lib/utils/person', () => ({
  formatLifeDates: () => '1900–1901',
  getFullName: (p: Person) => `${p.firstName} ${p.lastName ?? ''}`.trim(),
  formatPersonNameForLocale: (p: Person) => `${p.firstName} ${p.lastName ?? ''}`.trim(),
  formatNamePartsByLocale: (p: Person) => ({
    firstName: p.firstName,
    lastName: p.lastName ?? '',
    patronymic: '',
  }),
  sortPersonsBySurname: (ps: Person[]) => ps,
}));

vi.mock('@/lib/utils/kinship', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils/kinship')>();
  return {
    ...actual,
    getKinship: (targetId: string, originId: string) => {
      // resultAtoB = getKinship(idB, idA)
      if (originId === 'p1' && targetId === 'p2') {
        // side-branch: includes parent+child but no spouse => triggers isSideBranch + highlight
        return {
          key: 'kinBrother',
          path: ['p1', 'p3', 'p2', 'p1'],
          edgeKinds: ['child', 'parent', 'child'],
        };
      }
      if (originId === 'p3' && targetId === 'p2') {
        // spouse edge: includes spouse so isSideBranch=false, but ChainArrow spouse styling is covered
        return {
          key: 'kinHusband',
          path: ['p3', 'p2', 'p1', 'p2'],
          edgeKinds: ['parent', 'spouse', 'child'],
        };
      }
      return null;
    },
  };
});

describe('KinshipSpread coverage', () => {
  it('renders kinSelf when both selects are equal', async () => {
    const { KinshipSpread } = await import('./KinshipSpread');
    render(<KinshipSpread />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'p1' } });
    fireEvent.change(selects[1], { target: { value: 'p1' } });

    expect(screen.getByText('kinSelf')).toBeInTheDocument();
  });

  it('renders kinshipNoRelation when kinship is null in both directions', async () => {
    const { KinshipSpread } = await import('./KinshipSpread');
    render(<KinshipSpread />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'p1' } });
    fireEvent.change(selects[1], { target: { value: 'p3' } });

    // Our getKinship mock returns null for this pair, so the "no relation" branch triggers.
    expect(screen.getByText('kinshipNoRelation')).toBeInTheDocument();
  });

  it('resolved relation: side-branch triggers common ancestor highlight', async () => {
    const { KinshipSpread } = await import('./KinshipSpread');
    render(<KinshipSpread />);

    const selects = screen.getAllByRole('combobox');
    // resultAtoB = getKinship(idB, idA), so we want getKinship('p2','p1')
    fireEvent.change(selects[0], { target: { value: 'p1' } }); // idA
    fireEvent.change(selects[1], { target: { value: 'p2' } }); // idB

    expect(screen.getByText('kinBrother')).toBeInTheDocument();
    expect(screen.getByText('kinshipChainLabel')).toBeInTheDocument();
    // Highlight uses t('kinshipCommonAncestor').replace(/:$/, '')
    expect(screen.getByText(/Common ancestor/)).toBeInTheDocument();
  });

  it('resolved relation: spouse edge covers spouse arrow branch', async () => {
    const { KinshipSpread } = await import('./KinshipSpread');
    render(<KinshipSpread />);

    const selects = screen.getAllByRole('combobox');
    // resultAtoB = getKinship(idB, idA), so we want getKinship('p2','p3')
    fireEvent.change(selects[0], { target: { value: 'p3' } }); // idA
    fireEvent.change(selects[1], { target: { value: 'p2' } }); // idB

    expect(screen.getByText('kinHusband')).toBeInTheDocument();
    // spouse edgeLabel for kind='spouse' returns kinWife when target person is female
    expect(screen.getByText('kinWife')).toBeInTheDocument();
  });
});

