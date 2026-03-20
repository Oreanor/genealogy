import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Person } from '@/lib/types/person';
import type { PhotoEntry } from '@/lib/types/photo';

const personOne: Person = { id: 'p1', firstName: 'Иван', lastName: 'Петров' };
const personTwo: Person = { id: 'p2', firstName: 'Анна', lastName: 'Сидорова' };

const photoOne: PhotoEntry = {
  id: 'ph1',
  src: 'front-1.jpg',
  caption: 'Front caption 1',
  backSrc: 'back-1.jpg',
  backCaption: 'Back caption 1',
};

const photoTwo: PhotoEntry = {
  id: 'ph2',
  src: 'front-2.jpg',
  caption: 'Front caption 2',
};

const photoThree: PhotoEntry = {
  id: 'ph3',
  src: 'front-3.jpg',
  caption: 'Front caption 3',
};

const allPhotos = [photoOne, photoTwo, photoThree];
const personPhotosById: Record<string, PhotoEntry[]> = {
  [personOne.id]: [photoOne, photoTwo],
  [personTwo.id]: [photoThree],
};

let searchParamsValue = new URLSearchParams(`id=${personOne.id}&photo=${photoOne.id}`);
let pathnameValue = '/book';
const routerPush = vi.fn();
const routerReplace = vi.fn((url: string) => {
  const [, query = ''] = url.split('?');
  searchParamsValue = new URLSearchParams(query);
});

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParamsValue,
  usePathname: () => pathnameValue,
  useRouter: () => ({
    push: routerPush,
    replace: routerReplace,
  }),
}));

vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/usePhotoImageBounds', () => ({
  usePhotoImageBounds: () => ({
    photoContainerRef: { current: null },
    imageBounds: null,
    onPhotoImageLoad: vi.fn(),
  }),
}));

vi.mock('@/lib/i18n/context', () => ({
  useLocaleRoutes: () => ({
    t: (key: string) => key,
    locale: 'ru',
  }),
}));

vi.mock('@/lib/data/persons', () => ({
  getPersons: () => [personOne, personTwo],
}));

vi.mock('@/lib/data/photos', () => ({
  getPhotos: () => allPhotos,
  getPhotoById: (id: string) => allPhotos.find((photo) => photo.id === id) ?? null,
  getPhotosByPerson: (personId: string) => personPhotosById[personId] ?? [],
  getLightboxFacesFromPhoto: () => [],
  splitPersonPhotosForCarousels: (photos: PhotoEntry[]) => ({
    noSeries: photos,
    bySeries: [],
  }),
  splitAllPhotosForCarousels: (photos: PhotoEntry[]) => ({
    personal: photos,
    group: [],
    related: [],
    bySeries: [],
  }),
}));

vi.mock('@/lib/utils/person', () => ({
  sortPersonsBySurname: (persons: Person[]) => persons,
  personMatchesSearch: () => true,
  formatPersonNameForLocale: (person: Person) =>
    `${person.firstName} ${person.lastName ?? ''}`.trim(),
}));

vi.mock('@/components/ui/molecules/PersonSearchDropdown', () => ({
  PersonSearchDropdown: () => <div data-testid="persons-dropdown" />,
}));

vi.mock('@/components/content/PhotoThumbnails', () => ({
  PhotoThumbnails: (props: {
    photos: PhotoEntry[];
    selectedPhoto: PhotoEntry | null;
    onSelect: (photo: PhotoEntry, toggleBack?: boolean) => void;
  }) => (
    <div>
      <div data-testid="selected-thumbnail">{props.selectedPhoto?.id ?? 'none'}</div>
      {props.photos.map((photo) => (
        <button
          key={photo.id}
          type="button"
          onClick={() => props.onSelect(photo, props.selectedPhoto?.id === photo.id && Boolean(photo.backSrc))}
        >
          select-{photo.id}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/components/content/PersonSpreadContent', () => ({
  PersonSpreadRightContent: (props: {
    caption: string | null;
  }) => <div data-testid="caption">{props.caption ?? ''}</div>,
}));

vi.mock('@/components/ui/ImageLightbox', () => ({
  ImageLightbox: () => null,
}));

describe('PhotosSection coverage', () => {
  beforeEach(() => {
    searchParamsValue = new URLSearchParams(`id=${personOne.id}&photo=${photoOne.id}`);
    pathnameValue = '/book';
    routerPush.mockClear();
    routerReplace.mockClear();
  });

  it('derives selected person and photo directly from URL updates', async () => {
    const { PhotosSection } = await import('./PhotosSection');
    const { rerender } = render(<PhotosSection />);

    expect(screen.getByTestId('selected-thumbnail')).toHaveTextContent(photoOne.id);
    expect(screen.getByTestId('caption')).toHaveTextContent(photoOne.caption ?? '');

    searchParamsValue = new URLSearchParams(`id=${personOne.id}&photo=${photoTwo.id}`);
    rerender(<PhotosSection />);
    expect(screen.getByTestId('selected-thumbnail')).toHaveTextContent(photoTwo.id);
    expect(screen.getByTestId('caption')).toHaveTextContent(photoTwo.caption ?? '');

    searchParamsValue = new URLSearchParams(`id=${personTwo.id}&photo=${photoOne.id}`);
    rerender(<PhotosSection />);
    expect(screen.getByTestId('selected-thumbnail')).toHaveTextContent('none');
    expect(screen.getByTestId('caption')).toHaveTextContent('');
  });

  it('resets back-side state when URL selects another photo', async () => {
    const { PhotosSection } = await import('./PhotosSection');
    const { rerender } = render(<PhotosSection />);

    fireEvent.click(screen.getByText(`select-${photoOne.id}`));
    expect(screen.getByTestId('caption')).toHaveTextContent(photoOne.backCaption ?? '');

    searchParamsValue = new URLSearchParams(`id=${personOne.id}&photo=${photoTwo.id}`);
    rerender(<PhotosSection />);
    expect(screen.getByTestId('caption')).toHaveTextContent(photoTwo.caption ?? '');
  });
});
