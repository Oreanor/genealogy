import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Person } from '@/lib/types/person';
import type { PhotoEntry } from '@/lib/types/photo';
import type { HistoryEntry } from '@/lib/types/history';

const pathname = '/book';

const person: Person = {
  id: 'p1',
  firstName: 'Иван',
  patronymic: 'Петрович',
  lastName: 'Петров',
  birthDate: '1925',
  deathDate: '1998',
  birthPlace: 'Moscow',
  occupation: 'teacher',
  residenceCity: 'City',
  comment: 'note',
  fatherId: 'f1',
  motherId: 'm1',
};

const spouse: Person = { id: 's1', firstName: 'Анна', lastName: 'Сидорова', gender: 'f' };
const father: Person = { id: 'f1', firstName: 'F', lastName: 'Father', gender: 'm' };
const mother: Person = { id: 'm1', firstName: 'M', lastName: 'Mother', gender: 'f' };
const child: Person = { id: 'c1', firstName: 'C', lastName: 'Child' };
const sibling: Person = { id: 'sib1', firstName: 'Sb', lastName: 'Sibling' };
const cousin: Person = { id: 'cus1', firstName: 'Cr', lastName: 'Cousin' };

const photo1: PhotoEntry = {
  id: 'ph1',
  src: 'front1.jpg',
  caption: 'Front 1',
  backSrc: 'back1.jpg',
  backCaption: 'Back 1',
};
const photo2: PhotoEntry = { id: 'ph2', src: 'front2.jpg', caption: 'Front 2' };

const history0 = {
  index: 0,
  entry: {
    title: 'Mention title',
    richText: '<p>text</p>',
    personIds: [person.id],
  } satisfies HistoryEntry,
};

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}));

vi.mock('@/lib/i18n/context', () => ({
  useLocaleRoutes: () => ({
    t: (key: string) => key,
    routes: {
      person: (id: string) => `/person/${id}`,
    },
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

vi.mock('@/components/ui/ImageLightbox', () => ({
  ImageLightbox: (props: { open: boolean; onClose: () => void }) =>
    props.open ? (
      <div data-testid="lightbox">
        <button type="button" onClick={props.onClose}>
          close-lightbox
        </button>
      </div>
    ) : null,
}));

vi.mock('@/lib/data/persons', () => ({
  getPersons: () => [person, spouse, father, mother, child, sibling, cousin],
  getPersonById: (id: string) => {
    if (id === person.fatherId) return father;
    if (id === person.motherId) return mother;
    return null;
  },
}));

vi.mock('@/lib/data/familyRelations', () => ({
  getChildren: () => [child],
  getSiblings: () => [sibling],
  getCousins: () => [cousin],
  getSpouse: () => spouse,
}));

vi.mock('@/lib/data/photos', () => ({
  getPhotosByPerson: () => [photo1, photo2],
  getLightboxFacesFromPhoto: () => [],
}));

vi.mock('@/lib/data/history', () => ({
  getHistoryEntriesByPerson: () => [history0],
}));

vi.mock('@/lib/utils/person', () => ({
  formatLifeDates: (birth?: string, death?: string) => `${birth ?? ''}-${death ?? ''}`.replace(/^-|-$/g, ''),
  getFullName: (p: Person) =>
    [p.firstName, p.patronymic, p.lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(),
}));

describe('PersonCard coverage', () => {
  it('renders relatives and history as links when onHistoryClick is not provided', async () => {
    const { PersonCard } = await import('./PersonCard');
    render(<PersonCard person={person} showPhotos={false} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Иван Петрович Петров');
    expect(screen.getByText(/spouseF/)).toBeInTheDocument();
    expect(screen.getByText(/parents/)).toBeInTheDocument();
    expect(screen.getByText(/children/)).toBeInTheDocument();
    expect(screen.getByText(/siblings/)).toBeInTheDocument();
    expect(screen.getByText(/cousins/)).toBeInTheDocument();

    // historyMentions.length > 0 and onHistoryClick absent => Link branch
    const mentionLink = screen.getByRole('link', { name: history0.entry.title });
    expect(mentionLink).toHaveAttribute('href', `${pathname}?section=history&entry=0`);
  });

  it('renders photos grid and opens/closes fullscreen lightbox', async () => {
    const { PersonCard } = await import('./PersonCard');
    render(<PersonCard person={person} />);

    // 2 photos => 2 fullscreen buttons
    const btn1 = screen.getByRole('button', { name: photo1.caption });
    fireEvent.click(btn1);

    expect(screen.getByTestId('lightbox')).toBeInTheDocument();
    fireEvent.click(screen.getByText('close-lightbox'));
    expect(screen.queryByTestId('lightbox')).not.toBeInTheDocument();
  });

  it('renders history mentions as in-place buttons when onHistoryClick is provided', async () => {
    const onHistoryClick = vi.fn();
    const { PersonCard } = await import('./PersonCard');
    render(<PersonCard person={person} onHistoryClick={onHistoryClick} showPhotos={false} />);

    const mentionBtn = screen.getByRole('button', { name: history0.entry.title });
    fireEvent.click(mentionBtn);
    expect(onHistoryClick).toHaveBeenCalledWith(0);
  });
});

