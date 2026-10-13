import { TransitState, ActiveBus } from './types';

export const PROXY_BASE_URL =
  process.env.NUS_TRANSIT_API || 'https://nus-transit-cache-429047621215.asia-southeast1.run.app';

export const ROUTE_COLORS: Record<string, string> = {
  A1: '#EF4444', // Red
  A2: '#F59E0B', // Amber
  D1: '#3B82F6', // Blue
  D2: '#10B981', // Emerald
  K: '#8B5CF6',  // Purple
  L: '#EC4899',  // Pink
  E: '#14B8A6',  // Teal
  BTC: '#F97316',// Orange
};

export function isSingaporeOffService(date: Date = new Date()): boolean {
  // SGT is UTC+8
  const sgtHour = (date.getUTCHours() + 8) % 24;
  // Off service hours: 23:00 to 07:00 SGT
  return sgtHour >= 23 || sgtHour < 7;
}

export async function fetchLiveBuses(): Promise<TransitState> {
  const isOffHours = isSingaporeOffService();
  const url = `${PROXY_BASE_URL}/api/transit/buses`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const rawBuses: ActiveBus[] = Array.isArray(data.buses) ? data.buses : [];
      const isOffService = isOffHours || rawBuses.length === 0;

      return {
        asOf: data.asOf || new Date().toISOString(),
        upstreamLastUpdated: data.upstreamLastUpdated || new Date().toISOString(),
        stale: Boolean(data.stale),
        estimated: true,
        buses: rawBuses,
        isOffService,
      };
    }
  } catch {
    // Network offline or error
  }

  return {
    asOf: new Date().toISOString(),
    upstreamLastUpdated: new Date().toISOString(),
    stale: true,
    estimated: true,
    buses: [],
    isOffService: isOffHours || true,
  };
}

export const FALLBACK_STOPS: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [103.77438, 1.30398] },
      properties: { name: 'UTOWN', caption: 'University Town', LongName: 'University Town', ShortName: 'UTown', latitude: 1.30398, longitude: 103.77438 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [103.77445, 1.29442] },
      properties: { name: 'COM3', caption: 'School of Computing', LongName: 'School of Computing (COM3)', ShortName: 'COM3', latitude: 1.29442, longitude: 103.77445 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [103.78440, 1.29320] },
      properties: { name: 'KR-MRT', caption: 'Kent Ridge MRT', LongName: 'Kent Ridge MRT Station', ShortName: 'KR MRT', latitude: 1.29320, longitude: 103.78440 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [103.77250, 1.29660] },
      properties: { name: 'CLB', caption: 'Central Library', LongName: 'Central Library', ShortName: 'CLB', latitude: 1.29660, longitude: 103.77250 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [103.78038, 1.29105] },
      properties: { name: 'PGPR', caption: "Prince George's Park", LongName: "Prince George's Park Residences", ShortName: 'PGPR', latitude: 1.29105, longitude: 103.78038 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [103.78010, 1.29720] },
      properties: { name: 'LT27', caption: 'Lecture Theatre 27', LongName: 'Science / LT27', ShortName: 'LT27', latitude: 1.29720, longitude: 103.78010 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [103.77580, 1.29910] },
      properties: { name: 'UHC', caption: 'University Health Centre', LongName: 'University Health Centre', ShortName: 'UHC', latitude: 1.29910, longitude: 103.77580 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [103.77190, 1.29610] },
      properties: { name: 'VENTUS', caption: 'University Hall', LongName: 'Opp University Hall (Ventus)', ShortName: 'Ventus', latitude: 1.29610, longitude: 103.77190 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [103.77430, 1.29280] },
      properties: { name: 'BIZ2', caption: 'NUS Business School', LongName: 'Business School (BIZ2)', ShortName: 'BIZ2', latitude: 1.29280, longitude: 103.77430 },
    },
  ],
};

export const FALLBACK_ROUTES: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [103.78038, 1.29105],
          [103.78440, 1.29320],
          [103.78010, 1.29720],
          [103.77580, 1.29910],
          [103.77438, 1.30398],
          [103.77250, 1.29660],
          [103.77445, 1.29442],
          [103.78038, 1.29105],
        ],
      },
      properties: {
        route: 'A1',
        length_m: 4916,
        closed: true,
        color: ROUTE_COLORS.A1,
        stops: [
          { code: 'PGPR', arc_m: 0, seq: 0 },
          { code: 'KR-MRT', arc_m: 506, seq: 1 },
          { code: 'LT27', arc_m: 1249, seq: 2 },
          { code: 'UHC', arc_m: 1980, seq: 3 },
          { code: 'UTOWN', arc_m: 2650, seq: 4 },
          { code: 'CLB', arc_m: 3540, seq: 5 },
          { code: 'COM3', arc_m: 4120, seq: 6 },
          { code: 'PGPR', arc_m: 4916, seq: 7 },
        ],
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [103.78038, 1.29105],
          [103.77445, 1.29442],
          [103.77250, 1.29660],
          [103.77438, 1.30398],
          [103.77580, 1.29910],
          [103.78010, 1.29720],
          [103.78440, 1.29320],
          [103.78038, 1.29105],
        ],
      },
      properties: {
        route: 'A2',
        length_m: 4916,
        closed: true,
        color: ROUTE_COLORS.A2,
        stops: [
          { code: 'PGPR', arc_m: 0, seq: 0 },
          { code: 'COM3', arc_m: 680, seq: 1 },
          { code: 'CLB', arc_m: 1320, seq: 2 },
          { code: 'UTOWN', arc_m: 2210, seq: 3 },
          { code: 'UHC', arc_m: 2880, seq: 4 },
          { code: 'LT27', arc_m: 3610, seq: 5 },
          { code: 'KR-MRT', arc_m: 4350, seq: 6 },
          { code: 'PGPR', arc_m: 4916, seq: 7 },
        ],
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [103.77438, 1.30398],
          [103.77250, 1.29660],
          [103.77445, 1.29442],
          [103.77430, 1.29280],
          [103.77438, 1.30398],
        ],
      },
      properties: {
        route: 'D1',
        length_m: 3820,
        closed: true,
        color: ROUTE_COLORS.D1,
        stops: [
          { code: 'UTOWN', arc_m: 0, seq: 0 },
          { code: 'CLB', arc_m: 950, seq: 1 },
          { code: 'COM3', arc_m: 1600, seq: 2 },
          { code: 'BIZ2', arc_m: 2100, seq: 3 },
          { code: 'UTOWN', arc_m: 3820, seq: 4 },
        ],
      },
    },
  ],
};

export async function fetchTransitStops(): Promise<GeoJSON.FeatureCollection> {
  const url = `${PROXY_BASE_URL}/api/transit/stops`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.type === 'FeatureCollection' && Array.isArray(data.features)) {
        return data;
      }
    }
  } catch {
    // Network fallback
  }

  return FALLBACK_STOPS;
}

export async function fetchTransitRoutes(): Promise<GeoJSON.FeatureCollection> {
  const url = `${PROXY_BASE_URL}/api/transit/routes`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.type === 'FeatureCollection' && Array.isArray(data.features)) {
        // Inject route color if missing
        const enrichedFeatures = data.features.map((f: any) => ({
          ...f,
          properties: {
            ...f.properties,
            color: ROUTE_COLORS[f.properties?.route] || '#38BDF8',
          },
        }));
        return {
          ...data,
          features: enrichedFeatures,
        };
      }
    }
  } catch {
    // Network fallback
  }

  return FALLBACK_ROUTES;
}

