import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Person } from '@/lib/types/person';
import type { PhotoEntry } from '@/lib/types/photo';
import type { HistoryEntry } from '@/lib/types/history';

const person: Person = { id: 'p1', firstName: 'Иван', lastName: 'Петров' };

const photoWithBack: PhotoEntry = {
  id: 'ph1',
  src: 'front-1.jpg',
  caption: 'Front caption',
  backSrc: 'back-1.jpg',
  backCaption: 'Back caption',
};

const photoWithoutBack: PhotoEntry = {
  id: 'ph2',
  src: 'front-2.jpg',
  caption: 'Front caption 2',
  backCaption: 'Back caption 2',
  // backSrc missing
};

const history0 = {
  index: 0,
  entry: {
    title: 'History title 0',
    richText: '<p>History body 0</p>',
    personIds: [person.id],
  } satisfies HistoryEntry,
};

let isMobileValue = false;
let searchParamsValue = new URLSearchParams(`id=${person.id}`);
const routerPush = vi.fn();

const setImageBoundsMock = vi.fn();
const onPhotoImageLoadMock = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParamsValue,
  useRouter: () => ({ push: routerPush }),
}));

vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => isMobileValue,
}));

vi.mock('@/hooks/usePhotoImageBounds', () => ({
  usePhotoImageBounds: () => ({
    photoContainerRef: { current: null },
    imageBounds: null,
    setImageBounds: setImageBoundsMock,
    onPhotoImageLoad: onPhotoImageLoadMock,
  }),
}));

vi.mock('@/lib/i18n/context', () => ({
  useLocaleRoutes: () => ({
    t: (key: string) => key,
    routes: {
      person: (id: string) => `/person/${id}`,
    },
  }),
  useLocale: () => 'ru',
}));

vi.mock('@/lib/data/persons', () => ({
  getPersons: () => [person],
}));

vi.mock('@/lib/data/photos', () => ({
  getPhotosByPerson: () => [photoWithBack, photoWithoutBack],
  getPreferredPanelPhoto: () => photoWithBack,
  getLightboxFacesFromPhoto: () => [],
}));

vi.mock('@/lib/data/history', () => ({
  getHistoryEntriesByPerson: () => [history0],
}));

vi.mock('@/lib/utils/person', () => ({
  sortPersonsBySurname: (ps: Person[]) => ps,
  personMatchesSearch: () => true,
  getFullName: (p: Person) => `${p.firstName} ${p.lastName ?? ''}`.trim(),
  formatPersonNameForLocale: (p: Person) => `${p.firstName} ${p.lastName ?? ''}`.trim(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: unknown; children: React.ReactNode }) => (
    <a href={typeof href === 'string' ? href : String(href)}>{children}</a>
  ),
}));

vi.mock('@/components/ui/molecules/PersonSearchDropdown', () => ({
  PersonSearchDropdown: () => <div data-testid="persons-dropdown" />,
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

vi.mock('@/components/ui/atoms/Button', () => ({
  Button: ({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/content/PersonSpreadContent', () => {
  function PersonSpreadLeftContent(props: {
    person: Person;
    personPhotos: PhotoEntry[];
    selectedPhoto: PhotoEntry | null;
    onPhotoClick: (photo: PhotoEntry, toggleBack?: boolean) => void;
    onHistoryClick: (index: number) => void;
    renderPersonLink: (p: Person, displayName?: string) => React.ReactNode;
  }) {
    return (
      <div>
        <div data-testid="left-selected-photo">{props.selectedPhoto?.id ?? 'none'}</div>
        {props.personPhotos.map((ph) => (
          <React.Fragment key={ph.id}>
            <button type="button" onClick={() => props.onPhotoClick(ph, false)}>
              select-front-{ph.id}
            </button>
            <button type="button" onClick={() => props.onPhotoClick(ph, true)}>
              select-back-{ph.id}
            </button>
          </React.Fragment>
        ))}
        <button type="button" onClick={() => props.onHistoryClick(0)}>
          history-0
        </button>
        {props.renderPersonLink(props.person, `${props.person.firstName} ${props.person.lastName ?? ''}`.trim())}
      </div>
    );
  }

  function PersonSpreadRightContent(props: {
    caption: string | null;
    historyEntry: HistoryEntry | null;
    onToggleFaces: () => void;
  }) {
    return (
      <div>
        <div data-testid="caption">{props.caption ?? ''}</div>
        <div data-testid="history-title">{props.historyEntry?.title ?? ''}</div>
        <button type="button" onClick={props.onToggleFaces}>
          toggle-faces
        </button>
      </div>
    );
  }

  return { PersonSpreadLeftContent, PersonSpreadRightContent };
});

describe('PersonsSection coverage', () => {
  beforeEach(() => {
    isMobileValue = false;
    searchParamsValue = new URLSearchParams(`id=${person.id}`);
    routerPush.mockClear();
  });

  it('desktop: switches caption (front/back + fallback) and renders history', async () => {
    const { PersonsSection } = await import('./PersonsSection');
    render(<PersonsSection />);

    // initial selected photo is first (photoWithBack)
    expect(screen.getByTestId('caption')).toHaveTextContent(photoWithBack.caption ?? '');

    // toggle to back caption branch
    fireEvent.click(screen.getByText(`select-back-${photoWithBack.id}`));
    await waitFor(() => {
      expect(screen.getByTestId('caption')).toHaveTextContent(photoWithBack.backCaption ?? '');
    });

    // switch to photoWithoutBack while showPhotoBack=false
    fireEvent.click(screen.getByText(`select-front-${photoWithoutBack.id}`));
    await waitFor(() => {
      expect(screen.getByTestId('caption')).toHaveTextContent(photoWithoutBack.caption ?? '');
    });

    // then toggle showPhotoBack=true with no backSrc -> fallback uses front caption
    fireEvent.click(screen.getByText(`select-back-${photoWithoutBack.id}`));
    await waitFor(() => {
      expect(screen.getByTestId('caption')).toHaveTextContent(photoWithoutBack.caption ?? '');
    });

    // history click: clears photo selection and shows historyEntry on desktop
    fireEvent.click(screen.getByText('history-0'));
    await waitFor(() => {
      expect(screen.getByTestId('caption')).toHaveTextContent('');
      expect(screen.getByTestId('history-title')).toHaveTextContent(history0.entry.title);
    });
  });

  it('mobile: opens image lightbox on photo click and shows text lightbox on history click', async () => {
    isMobileValue = true;
    const { PersonsSection } = await import('./PersonsSection');
    render(<PersonsSection />);

    // clicking front selects photo and opens ImageLightbox (lightboxOpen && selectedPhoto)
    fireEvent.click(screen.getByText(`select-front-${photoWithBack.id}`));
    await waitFor(() => {
      expect(screen.getByTestId('lightbox')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('close-lightbox'));
    await waitFor(() => {
      expect(screen.queryByTestId('lightbox')).not.toBeInTheDocument();
    });

    // history click on mobile opens the text overlay and (on mobile) right-panel historyEntry stays null
    fireEvent.click(screen.getByText('history-0'));
    await waitFor(() => {
      expect(screen.getByText(history0.entry.title)).toBeInTheDocument();
      expect(screen.getByTestId('history-title')).toHaveTextContent('');
    });

    // close overlay
    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    await waitFor(() => {
      expect(screen.queryByText(history0.entry.title)).not.toBeInTheDocument();
    });
  });
});

