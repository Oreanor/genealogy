import { NextRequest, NextResponse } from 'next/server';

type NominatimItem = {
  lat: string;
  lon: string;
};

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  if (!q) {
    return NextResponse.json({ point: null });
  }

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
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
