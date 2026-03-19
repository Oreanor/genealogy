import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Person } from '@/lib/types/person';
import type { PhotoEntry } from '@/lib/types/photo';
import type { HistoryEntry } from '@/lib/types/history';
import { PersonDetailPanel } from './PersonDetailPanel';

let isMobileValue = false;

const setImageBoundsMock = vi.fn();

const personA: Person = { id: 'p1', firstName: 'Иван', patronymic: 'Иванович', lastName: 'Петров' };
const personB: Person = { id: 'p2', firstName: 'Петр', patronymic: 'Петрович', lastName: 'Сидоров' };

const photoWithBack: PhotoEntry = {
  id: 'ph1',
  src: 'front-1.jpg',
  caption: 'Caption-1',
  backSrc: 'back-1.jpg',
  backCaption: 'BackCaption-1',
};

const photoWithoutBack: PhotoEntry = {
  id: 'ph2',
  src: 'front-2.jpg',
  caption: 'Caption-2',
  // backSrc missing on purpose to cover fallback branch
  backCaption: 'BackCaption-2',
};

const history0: { index: number; entry: HistoryEntry } = {
  index: 0,
  entry: {
    title: 'History title',
    richText: '<p>History body</p>',
    personIds: [personA.id],
  },
};

let photosByPersonValue: Record<string, PhotoEntry[]> = {
  [personA.id]: [photoWithBack],
};

let historyByPersonValue: Record<string, { entry: HistoryEntry; index: number }[]> = {
  [personA.id]: [history0],
};

vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => isMobileValue,
}));

vi.mock('@/hooks/usePhotoImageBounds', () => ({
  usePhotoImageBounds: () => ({
    photoContainerRef: { current: null },
    imageBounds: null,
    setImageBounds: setImageBoundsMock,
    onPhotoImageLoad: vi.fn(),
  }),
}));

vi.mock('@/lib/data/photos', () => ({
  getPhotosByPerson: (personId: string) => photosByPersonValue[personId] ?? [],
  getPreferredPanelPhoto: (personId: string) => (photosByPersonValue[personId] ?? [])[0] ?? null,
  getLightboxFacesFromPhoto: () => [],
  // called only via ImageLightbox props creation; the rest is irrelevant for this test
  getAvatarForPerson: () => null,
  getAvatarCropStyles: () => ({ width: 0, height: 0 }),
}));

vi.mock('@/lib/data/history', () => ({
  getHistoryEntriesByPerson: (personId: string) => historyByPersonValue[personId] ?? [],
}));

vi.mock('@/lib/data/persons', () => ({
  getPersons: () => [personA, personB],
}));

vi.mock('@/lib/utils/person', () => ({
  getFullName: (p: Person) => `${p.firstName} ${p.lastName ?? ''}`.trim(),
  formatPersonNameForLocale: (p: Person) => `${p.firstName} ${p.lastName ?? ''}`.trim(),
}));

vi.mock('@/lib/i18n/context', () => ({
  useTranslations: () => (key: string) => (key === 'back' ? 'Back' : key),
  useLocale: () => 'ru',
}));

vi.mock('@/components/book/BookSpread', () => ({
  BookSpread: ({ left, right }: { left: React.ReactNode; right: React.ReactNode }) => (
    <div data-testid="bookspread">
      <div data-testid="bookspread-left">{left}</div>
      <div data-testid="bookspread-right">{right}</div>
    </div>
  ),
}));

vi.mock('@/components/book/BookPage', () => ({
  BookPage: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
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
        <div data-testid="left-selected-photo">{props.selectedPhoto?.caption ?? ''}</div>
        {props.personPhotos.map((ph) => (
          <React.Fragment key={ph.id}>
            <button type="button" onClick={() => props.onPhotoClick(ph, false)}>
              select-{ph.id}
            </button>
            <button type="button" onClick={() => props.onPhotoClick(ph, true)}>
              toggle-back-{ph.id}
            </button>
          </React.Fragment>
        ))}
        <button type="button" onClick={() => props.onHistoryClick(0)}>
          history-0
        </button>
        {props.renderPersonLink(personB, `${personB.firstName} ${personB.lastName ?? ''}`.trim())}
      </div>
    );
  }

  function PersonSpreadRightContent(props: {
    caption: string | null;
    historyEntry: HistoryEntry | null;
    onToggleFaces: () => void;
    onBigPhotoClick?: () => void;
  }) {
    return (
      <div>
        <div data-testid="caption">{props.caption ?? ''}</div>
        <div data-testid="history-title">{props.historyEntry?.title ?? ''}</div>
        <button type="button" onClick={props.onToggleFaces}>
          toggle-faces
        </button>
        {props.onBigPhotoClick && (
          <button type="button" onClick={props.onBigPhotoClick}>
            big-photo
          </button>
        )}
      </div>
    );
  }

  return { PersonSpreadLeftContent, PersonSpreadRightContent };
});

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

describe('PersonDetailPanel', () => {
  beforeEach(() => {
    isMobileValue = false;
    photosByPersonValue = { [personA.id]: [photoWithBack] };
    historyByPersonValue = { [personA.id]: [history0] };
    setImageBoundsMock.mockClear();
  });

  it('inline=true: shows back button and opens/closes lightbox on mobile photo click', async () => {
    isMobileValue = true;

    const onClose = vi.fn();
    const onSelectPerson = vi.fn();

    render(
      <React.StrictMode>
        <PersonDetailPanel
          person={personA}
          inline
          onClose={onClose}
          onSelectPerson={onSelectPerson}
        />
      </React.StrictMode>
    );

    fireEvent.click(screen.getByRole('button', { name: /^←\s*Back$/ }));
    expect(onClose).toHaveBeenCalledTimes(1);

    // select-front click triggers "isMobile -> setLightboxOpen(true)" branch
    fireEvent.click(screen.getByText(`select-${photoWithBack.id}`));
    expect(screen.getByTestId('lightbox')).toBeInTheDocument();

    fireEvent.click(screen.getByText('close-lightbox'));
    expect(screen.queryByTestId('lightbox')).not.toBeInTheDocument();

    // renderPersonLink -> click calls onSelectPerson with other person id
    fireEvent.click(
      screen.getByRole('button', {
        name: `${personB.firstName} ${personB.lastName ?? ''}`.trim(),
      })
    );
    expect(onSelectPerson).toHaveBeenCalledWith(personB.id);
  });

  it('inline=false: overlay closes on background click and caption/history selection work', () => {
    isMobileValue = false;
    photosByPersonValue = { [personA.id]: [photoWithBack] };
    historyByPersonValue = { [personA.id]: [history0] };

    const onClose = vi.fn();
    const onSelectPerson = vi.fn();

    render(<PersonDetailPanel person={personA} onClose={onClose} onSelectPerson={onSelectPerson} />);

    const overlay = screen.getByRole('presentation');
    const dialog = screen.getByRole('dialog', { name: /Иван/i });

    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(0);

    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);

    // initial caption uses selectedPhoto.caption when showBack=false
    expect(screen.getByTestId('caption')).toHaveTextContent(photoWithBack.caption ?? '');

    // toggle-back sets showPhotoBack; with backSrc+backCaption -> uses backCaption
    fireEvent.click(screen.getByText(`toggle-back-${photoWithBack.id}`));
    expect(screen.getByTestId('caption')).toHaveTextContent(photoWithBack.backCaption ?? '');

    // history click clears selectedPhoto and sets historyEntry
    fireEvent.click(screen.getByText('history-0'));
    expect(screen.getByTestId('caption')).toHaveTextContent('');
    expect(screen.getByTestId('history-title')).toHaveTextContent(history0.entry.title);
  });

  it('caption fallback: showBack=true but photo has no backSrc uses front caption', () => {
    isMobileValue = false;
    photosByPersonValue = { [personA.id]: [photoWithoutBack] };

    const onClose = vi.fn();
    const onSelectPerson = vi.fn();

    render(<PersonDetailPanel person={personA} onClose={onClose} onSelectPerson={onSelectPerson} />);

    expect(screen.getByTestId('caption')).toHaveTextContent(photoWithoutBack.caption ?? '');

    fireEvent.click(screen.getByText(`toggle-back-${photoWithoutBack.id}`));
    expect(screen.getByTestId('caption')).toHaveTextContent(photoWithoutBack.caption ?? '');
  });
});

