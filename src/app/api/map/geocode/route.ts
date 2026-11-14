import { NextRequest, NextResponse } from 'next/server';
import { rejectIfDevOnlyApiDisabled } from '@/lib/server/devOnlyApi';

const MAX_QUERY_LENGTH = 200;

type NominatimItem = {
  lat: string;
  lon: string;
};

export async function GET(req: NextRequest) {
  const rejected = rejectIfDevOnlyApiDisabled();
  if (rejected) return rejected;

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  if (!q || q.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ point: null });
  }

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        // Nominatim usage policy requires an identifying User-Agent.
        'User-Agent': 'genealogy-map/1.0 (self-hosted app)',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ point: null }, { status: 200 });
    }

    const data = (await res.json()) as NominatimItem[];
    const first = data[0];
    if (!first) return NextResponse.json({ point: null });

    const lat = Number(first.lat);
    const lon = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ point: null });
    }

    return NextResponse.json({ point: { lat, lon } });
  } catch {
    return NextResponse.json({ point: null }, { status: 200 });
  }
}
