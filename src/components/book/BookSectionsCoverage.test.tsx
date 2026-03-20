import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { withI18n } from '@/lib/i18n/test-utils';
import { getPersons } from '@/lib/data/persons';
import { getPhotosByPerson, splitPersonPhotosForCarousels } from '@/lib/data/photos';
import { getHistoryEntries } from '@/lib/data/history';
import { getKinship } from '@/lib/utils/kinship';
import { getMessages } from '@/lib/i18n/messages';
import { getFullName } from '@/lib/utils/person';
import type { PhotoEntry } from '@/lib/types/photo';
import { HelpSpread } from './HelpSpread';
import { PersonsSection } from './PersonsSection';
import { PhotosSection } from './PhotosSection';
import { HistorySection } from './HistorySection';
import { KinshipSpread } from './KinshipSpread';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt?: string }) => <img src={src} alt={alt ?? ''} />,
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: unknown; children: React.ReactNode }) => (
    <a href={typeof href === 'string' ? href : String(href)}>{children}</a>
  ),
}));

let searchParamsValue = new URLSearchParams();
let pathnameValue = '/book';
const routerPush = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParamsValue,
  usePathname: () => pathnameValue,
  useRouter: () => ({
    push: routerPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

let isMobileValue = false;
vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => isMobileValue,
}));

vi.mock('@/hooks/usePhotoImageBounds', () => ({
  usePhotoImageBounds: () => ({
    photoContainerRef: { current: null },
    imageBounds: null,
    setImageBounds: vi.fn(),
    onPhotoImageLoad: vi.fn(),
  }),
}));

function pickPersonWithFirstBackNoSeries(): { personId: string; first: PhotoEntry } | null {
  for (const p of getPersons()) {
    const photos = getPhotosByPerson(p.id);
    const first = photos[0];
    const noSeries = !(first?.series ?? '').trim();
    if (first?.backSrc && first.backCaption != null && noSeries) {
      return { personId: p.id, first };
    }
  }
  return null;
}

function pickPersonWithAnyBackNoSeries() {
  for (const p of getPersons()) {
    const photos = getPhotosByPerson(p.id);
    const { noSeries } = splitPersonPhotosForCarousels(photos);
    const target = noSeries.find((ph) => ph.backSrc && ph.backCaption != null);
    if (target) return { personId: p.id, photo: target };
  }
  return null;
}

describe('Book sections coverage', () => {
  it('HelpSpread renders key steps', () => {
    render(withI18n(<HelpSpread />));
    expect(screen.getByRole('heading', { level: 2, name: /Помощь: Семейное древо/ })).toBeInTheDocument();
    expect(screen.getByText(/Нажмите на овал персоны/)).toBeInTheDocument();
  });

  it('PersonsSection covers selected person + toggle back caption', () => {
    const picked = pickPersonWithFirstBackNoSeries();
    if (!picked) return;

    const personId = picked.personId;

    searchParamsValue = new URLSearchParams(`id=${personId}`);
    isMobileValue = false;
    routerPush.mockClear();

    render(withI18n(<PersonsSection />));

    const person = getPersons().find((p) => p.id === personId)!;
    expect(screen.getByText(getFullName(person))).toBeInTheDocument();

    const photos = getPhotosByPerson(personId);
    const first = photos[0];
    expect(first).toBeTruthy();

    const selectedThumb = screen
      .getAllByRole('button')
      .find((b) => b.getAttribute('aria-pressed') === 'true' && b.querySelector('img')?.getAttribute('src') === first.src);
    expect(selectedThumb).toBeTruthy();
    const selectedBtn = selectedThumb as HTMLElement;
    fireEvent.click(selectedBtn);

    // After toggling back, caption should switch to backCaption.
    if (picked?.first.backCaption != null) {
      expect(screen.getByText(picked.first.backCaption)).toBeInTheDocument();
    }
  });

  it('PhotosSection covers selecting photo + toggle back caption', () => {
    const picked = pickPersonWithAnyBackNoSeries();
    if (!picked) return;

    const personId = picked.personId;
    const photo = picked.photo;
    const noSeriesTitle = 'Фотографии';

    searchParamsValue = new URLSearchParams(`id=${personId}`);
    pathnameValue = '/book';
    isMobileValue = false;
    routerPush.mockClear();

    const person = getPersons().find((p) => p.id === personId)!;
    const { container } = render(withI18n(<PhotosSection />));
    const scope = within(container);

    // Ensure selectedPerson branch is rendered.
    expect(scope.getByText(getFullName(person))).toBeInTheDocument();

    // Expand "Фотографии" section.
    const expandBtn = scope
      .getAllByRole('button')
      .find((b) => b.getAttribute('aria-expanded') === 'false' && b.textContent?.includes(noSeriesTitle));
    expect(expandBtn).toBeTruthy();
    expect(expandBtn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(expandBtn as HTMLElement);

    const thumbBtn = scope
      .getAllByRole('button')
      .find((b) => b.querySelector('img')?.getAttribute('src') === photo.src);
    if (!thumbBtn) throw new Error('Photo thumbnail button not found');

    const countImgSrc = (src: string) =>
      Array.from(container.querySelectorAll('img')).filter((img) => img.getAttribute('src') === src).length;

    // Before selecting: big photo (in right panel) should not show back-side.
    expect(countImgSrc(photo.backSrc!)).toBe(0);

    fireEvent.click(thumbBtn);

    // After selecting: big photo should show front side.
    expect(countImgSrc(photo.src)).toBeGreaterThan(0);

    const thumbBtnSelectedAfterFirst = scope
      .getAllByRole('button')
      .find((b) => b.getAttribute('aria-pressed') === 'true' && b.querySelector('img')?.getAttribute('src') === photo.src);
    expect(thumbBtnSelectedAfterFirst).toBeTruthy();

    // Second click toggles back.
    fireEvent.click(thumbBtn);
    // After toggle: big photo should show back side.
    expect(countImgSrc(photo.backSrc!)).toBeGreaterThan(0);
    if (photo.backCaption != null && photo.backCaption !== '') {
      expect(scope.getByText(photo.backCaption)).toBeInTheDocument();
    }
  });

  it('HistorySection covers selected entry + search empty state (desktop)', () => {
    const entries = getHistoryEntries();
    if (entries.length === 0) return;

    const entry0 = entries[0]!;

    searchParamsValue = new URLSearchParams(`entry=0`);
    pathnameValue = '/book/history';
    isMobileValue = false;

    render(withI18n(<HistorySection />));

    // Desktop list includes selected entry title.
    expect(screen.getAllByText(entry0.title || '#1').length).toBeGreaterThan(0);

    const inputs = screen.getAllByPlaceholderText('Поиск по названию, тексту…') as HTMLInputElement[];
    const input = inputs[0];
    fireEvent.change(input, { target: { value: 'zzzz-not-found' } });

    expect(screen.getAllByText('Не найдено').length).toBeGreaterThan(0);
  });

  it(
    'KinshipSpread: covers kinSelf / no relation / resolved relation',
    () => {
    const messages = getMessages('ru');
    const persons = getPersons();
    // getKinship rebuilds the full graph each call — keep scan small; ids must match data.json.
    const scan = persons.slice(0, Math.min(20, persons.length));

    // 1) kinSelf (same person).
    searchParamsValue = new URLSearchParams();
    pathnameValue = '/kinship';
    isMobileValue = false;
    routerPush.mockClear();
    const idSame = persons[0].id;

    const { unmount } = render(withI18n(<KinshipSpread />));
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: idSame } });
    fireEvent.change(selects[1], { target: { value: idSame } });
    expect(screen.getByText(messages.kinSelf)).toBeInTheDocument();
    unmount();

    // 2) no relation.
    let noRel: [string, string] | null = null;
    outer: for (let i = 0; i < scan.length; i++) {
      for (let j = 0; j < scan.length; j++) {
        if (i === j) continue;
        const a = scan[i]!.id;
        const b = scan[j]!.id;
        if (!getKinship(b, a) && !getKinship(a, b)) {
          noRel = [a, b];
          break outer;
        }
      }
    }
    if (!noRel) {
      // If dataset doesn't contain a no-relation pair, skip branch assertions.
      return;
    }

    const [idA, idB] = noRel;
    render(withI18n(<KinshipSpread />));
    const selects2 = screen.getAllByRole('combobox');
    fireEvent.change(selects2[0], { target: { value: idA } });
    fireEvent.change(selects2[1], { target: { value: idB } });
    expect(screen.getByText(messages.kinshipNoRelation)).toBeInTheDocument();

    // 3) resolved relation (kinship key should appear).
    let rel:
      | {
          idA: string;
          idB: string;
          key: string;
          pathLen: number;
        }
      | null = null;
    for (let i = 0; i < scan.length; i++) {
      for (let j = 0; j < scan.length; j++) {
        if (i === j) continue;
        const idA = scan[i]!.id;
        const idB = scan[j]!.id;
        const kin = getKinship(idB, idA); // this matches KinshipSpread's resultAtoB
        if (kin) {
          rel = { idA, idB, key: kin.key, pathLen: kin.path.length };
          break;
        }
      }
      if (rel) break;
    }

    if (rel) {
      fireEvent.change(selects2[0], { target: { value: rel.idA } });
      fireEvent.change(selects2[1], { target: { value: rel.idB } });
      expect(screen.getByText(messages[rel.key])).toBeInTheDocument();
      if (rel.pathLen > 2) {
        expect(screen.getByText(messages.kinshipChainLabel)).toBeInTheDocument();
      }
    }
    },
    60_000
  );
});

