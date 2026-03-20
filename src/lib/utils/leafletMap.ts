import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from '@/lib/constants/map';

const containerToMap: WeakMap<HTMLDivElement, import('leaflet').Map> = new WeakMap();

function ensureLeafletCss(): void {
  const cssId = 'leaflet-osm-styles';
  if (document.getElementById(cssId)) return;

  const link = document.createElement('link');
  link.id = cssId;
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
  link.crossOrigin = '';
  document.head.appendChild(link);
}

export async function initLeafletMap(
  container: HTMLDivElement,
  center: readonly [number, number] = MAP_DEFAULT_CENTER,
  zoom: number = MAP_DEFAULT_ZOOM
): Promise<{
  L: typeof import('leaflet');
  map: import('leaflet').Map;
}> {
  ensureLeafletCss();

  const L = await import('leaflet');

  const existing = containerToMap.get(container);
  if (existing) {
    existing.setView([center[0], center[1]], zoom, { animate: false });

    // If init races (dev/strict), clear previous layers and re-add the base tiles.
    existing.eachLayer((layer) => {
      existing.removeLayer(layer);
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(existing);

    return { L, map: existing };
  }

  const map = L.map(container, {
    zoomControl: true,
    attributionControl: true,
  }).setView([center[0], center[1]], zoom);

  containerToMap.set(container, map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  return { L, map };
}

export function destroyLeafletMap(container: HTMLDivElement | null): void {
  if (!container) return;
  const existing = containerToMap.get(container);
  if (existing) {
    existing.remove();
  }
  containerToMap.delete(container);
}

