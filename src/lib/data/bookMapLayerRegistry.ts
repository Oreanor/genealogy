import type { GeocodedPoint } from '@/lib/constants/map';
import type { IndexedEvent, IndexedEventGeoResolveOptions } from '@/lib/data/indexedEventsMap';
import manifest from '@/lib/data/bookMapLayers.json';
import indexedMain from '@/lib/data/indexedEvents.json';
import indexedAlt from '@/lib/data/kanivetsIndexedEvents.json';
import { mergeMapPlaceGeoOverlay } from '@/lib/data/mapPlaceGeoOverlay';

export type BookMapLayerKind = 'family' | 'indexed' | 'podvig_naroda';

type LayerJsonFamily = {
  id: string;
  kind: 'family';
  labelKey: string;
  dataSource?: string;
};

type LayerJsonPodvigNaroda = {
  id: string;
  kind: 'podvig_naroda';
  labelKey: string;
  dataSource?: string;
};

type LayerJsonIndexed = {
  id: string;
  kind: 'indexed';
  labelKey: string;
  eventsBundle: string;
  placeGeoOverlay: string | null;
  indexedGeoOptionsPreset: string | null;
  dataSource?: string;
};

type LayerJson = LayerJsonFamily | LayerJsonIndexed | LayerJsonPodvigNaroda;

const EVENT_BUNDLES: Record<string, IndexedEvent[]> = {
  main: (indexedMain as { events: IndexedEvent[] }).events,
  alt: (indexedAlt as { events: IndexedEvent[] }).events,
};

export type BookMapLayerOption = {
  id: string;
  kind: BookMapLayerKind;
  labelKey: string;
};

export type BookMapIndexedLayerResolved = {
  id: string;
  labelKey: string;
  events: IndexedEvent[];
  placeFallbacksForGeo: Record<string, GeocodedPoint>;
  indexedGeoOptions?: IndexedEventGeoResolveOptions;
};

function buildIndexedLayer(
  row: LayerJsonIndexed,
  placeFallbacks: Record<string, GeocodedPoint>,
): BookMapIndexedLayerResolved {
  const events = EVENT_BUNDLES[row.eventsBundle];
  if (!events) {
    throw new Error(`bookMapLayers.json: unknown eventsBundle "${row.eventsBundle}"`);
  }
  let placeFallbacksForGeo: Record<string, GeocodedPoint> = { ...placeFallbacks };
  if (row.placeGeoOverlay) {
    placeFallbacksForGeo = mergeMapPlaceGeoOverlay(placeFallbacksForGeo, row.placeGeoOverlay);
  }
  let indexedGeoOptions: IndexedEventGeoResolveOptions | undefined;
  if (row.indexedGeoOptionsPreset === 'sumyDefaultWhenUnresolved' && placeFallbacks.sumy) {
    indexedGeoOptions = { defaultWhenUnresolved: placeFallbacks.sumy };
  }
  return {
    id: row.id,
    labelKey: row.labelKey,
    events,
    placeFallbacksForGeo,
    indexedGeoOptions,
  };
}

/** Слои селекта вкладки «Карты» — порядок и подписи из `bookMapLayers.json`. */
export function getBookMapLayerOptions(): BookMapLayerOption[] {
  const { layers } = manifest as { layers: LayerJson[] };
  return layers.map((L) => ({ id: L.id, kind: L.kind, labelKey: L.labelKey }));
}

/** Конфиг indexed-слоя по `id` из манифеста, или null. */
export function resolveBookMapIndexedLayer(
  layerId: string,
  placeFallbacks: Record<string, GeocodedPoint>,
): BookMapIndexedLayerResolved | null {
  const { layers } = manifest as { layers: LayerJson[] };
  const row = layers.find((l): l is LayerJsonIndexed => l.id === layerId && l.kind === 'indexed');
  return row ? buildIndexedLayer(row, placeFallbacks) : null;
}
