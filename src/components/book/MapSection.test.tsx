import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnifiedMapSection } from './UnifiedMapSection';

const person = { id: 'p1', firstName: 'Иван', lastName: 'Петров' };
let localeValue = 'ru';

vi.mock('@/lib/i18n/context', () => ({
  useLocaleRoutes: () => ({
    locale: localeValue,
    t: (key: string) =>
      ({
        chapters_map: 'Maps',
        mapFilterAll: 'All on map',
        mapFilterReset: 'Reset',
        mapLayerFamily: 'Family',
        mapLayerArchives: 'Archives',
        mapLayerArchivesFamilySearchAlt: 'Archives B',
        mapLayerPodvigNaroda: 'Podvig Naroda: conscription places',
        mapLayerSelectAria: 'Layer',
      })[key] ?? key,
  }),
}));

vi.mock('@/lib/data/persons', () => ({
  getPersons: () => [person],
}));

vi.mock('@/lib/data/mapFallbacks', () => ({
  getPlaceFallbacks: () => ({}),
}));

vi.mock('@/hooks/usePersonsOverlayRevision', () => ({
  usePersonsOverlayRevision: () => 0,
}));

vi.mock('@/lib/utils/mapSectionEntries', () => ({
  buildMapEntries: () => ({
    markerEntries: [],
    lineEntries: [],
    personsOnMap: [
      {
        id: person.id,
        name: `${person.firstName} ${person.lastName}`,
        color: '#ff0000',
      },
    ],
  }),
}));

vi.mock('./useLeafletBookMap', () => ({
  useLeafletBookMap: () => ({ showPersonFilter: true }),
}));

describe('UnifiedMapSection (family layer)', () => {
  it('renders map region', () => {
    render(<UnifiedMapSection />);
    expect(screen.getByLabelText('Maps')).toBeInTheDocument();
  });

  it('resets the active filter when locale changes', () => {
    const { rerender } = render(<UnifiedMapSection />);

    fireEvent.click(screen.getByRole('button', { name: /All on map/i }));
    fireEvent.click(screen.getByRole('button', { name: /Иван Петров/i }));
    expect(screen.getByRole('button', { name: /Иван Петров/i })).toBeInTheDocument();
    expect(screen.getByTitle('Reset')).toBeInTheDocument();

    localeValue = 'en';
    rerender(<UnifiedMapSection />);

    expect(screen.getByRole('button', { name: /All on map/i })).toBeInTheDocument();
    expect(screen.queryByTitle('Reset')).not.toBeInTheDocument();
  });
});
