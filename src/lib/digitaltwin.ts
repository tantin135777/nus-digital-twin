import { CampusBuilding, BuildingEnergy, MonthlyEnergy, SolarPvPotential, MonthlySolarYield } from './types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Singapore Meteorological Data (BCA & EMA Solar PV Standards)
// Mean Annual Global Horizontal Irradiance (GHI): 1,580 kWh/m²/year
const SG_MONTHLY_GHI = [121, 143, 149, 141, 136, 129, 131, 133, 135, 131, 118, 113];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function deriveCategory(name: string): 'academic' | 'residential' | 'recreation' | 'admin' {
  const lower = name.toLowerCase();
  if (
    lower.includes('hall') ||
    lower.includes('residence') ||
    lower.includes('college') ||
    lower.includes('pgp') ||
    lower.includes('utown residence')
  ) {
    return 'residential';
  }
  if (
    lower.includes('sport') ||
    lower.includes('gym') ||
    lower.includes('pool') ||
    lower.includes('court') ||
    lower.includes('field') ||
    lower.includes('theatre') ||
    lower.includes('cultural') ||
    lower.includes('museum')
  ) {
    return 'recreation';
  }
  if (
    lower.includes('admin') ||
    lower.includes('ventas') ||
    lower.includes('office') ||
    lower.includes('alumni') ||
    lower.includes('centre for')
  ) {
    return 'admin';
  }
  return 'academic';
}

function generateMonthlyBreakdown(annualTotal: number, seed: number): MonthlyEnergy[] {
  const baseMonthly = annualTotal / 12;
  return MONTHS.map((month, idx) => {
    // slight seasonal variation (Singapore has slight tropical variations, monsoon/summer)
    const factor = 0.94 + ((seed + idx * 7) % 13) / 100;
    const monthlyTotal = Math.round(baseMonthly * factor * 10) / 10;
    const cooling = Math.round(monthlyTotal * 0.55 * 10) / 10;
    const equipment = Math.round(monthlyTotal * 0.3 * 10) / 10;
    const lighting = Math.round((monthlyTotal - cooling - equipment) * 10) / 10;

    return {
      month,
      cooling,
      equipment,
      lighting,
      total: monthlyTotal,
    };
  });
}

export function calculateSolarPvPotential(
  roofAreaM2: number,
  floorCount: number,
  annualEui: number,
  _seed: number
): SolarPvPotential {
  // BCA guidelines: ~65% of gross roof area is usable (HVAC, maintenance paths, parapet setbacks)
  const usableRatio = 0.65;
  const usableAreaM2 = Math.round(roofAreaM2 * usableRatio);

  // Modern monocrystalline silicon module efficiency: ~20.5% (approx 0.205 kWp / m²)
  const moduleEfficiency = 0.205;
  const peakCapacityKwp = Math.round(usableAreaM2 * moduleEfficiency * 10) / 10;

  // System performance ratio (PR) taking into account tropical heat derating & inverter losses (~0.75)
  const performanceRatio = 0.75;
  const annualIrradianceKwhM2 = 1580;

  // Total annual clean solar generation in MWh
  const annualGenerationKwh = usableAreaM2 * annualIrradianceKwhM2 * moduleEfficiency * performanceRatio;
  const annualGenerationMwh = Math.round((annualGenerationKwh / 1000) * 10) / 10;

  // Estimated gross floor area (GFA) & building annual electricity demand
  const gfa = roofAreaM2 * floorCount;
  const buildingAnnualConsumptionMwh = (gfa * annualEui) / 1000;
  const gridOffsetPercentage = Math.min(
    100,
    Math.round((annualGenerationMwh / buildingAnnualConsumptionMwh) * 1000) / 10
  );

  // Carbon Abatement: Singapore EMA Grid Emission Factor (GEF) = 0.4057 kg CO2/kWh = 0.4057 tCO2/MWh
  const co2AbatementTonnes = Math.round(annualGenerationMwh * 0.4057 * 10) / 10;

  // Equivalent mature urban trees planted (~0.022 tCO2 / tree / year)
  const treesEquivalent = Math.round(co2AbatementTonnes / 0.022);

  // Monthly breakdown based on Singapore BCA solar seasonal profile
  const monthlyBreakdown: MonthlySolarYield[] = MONTHS.map((month, idx) => {
    const irradiance = SG_MONTHLY_GHI[idx];
    const genKwh = Math.round(usableAreaM2 * irradiance * moduleEfficiency * performanceRatio);
    return {
      month,
      generationKwh: genKwh,
      irradianceKwhM2: irradiance,
    };
  });

  return {
    roofAreaM2,
    usableAreaM2,
    annualIrradianceKwhM2,
    peakCapacityKwp,
    annualGenerationMwh,
    gridOffsetPercentage,
    co2AbatementTonnes,
    treesEquivalent,
    monthlyBreakdown,
  };
}

export function enrichRawBuilding(raw: {
  elementId?: string;
  id?: string;
  name: string;
  address?: string;
  postal?: string;
  latitude: number;
  longitude: number;
}): CampusBuilding {
  const id = raw.elementId || raw.id || `bldg-${hashString(raw.name)}`;
  const seed = hashString(id + raw.name);

  // Procedural height: 18m to 48m
  const height = 18 + (seed % 31);
  const floorCount = Math.max(4, Math.min(12, Math.round(height / 3.8)));
  const category = deriveCategory(raw.name);

  // Annual EUI (kWh/m²): 130 to 235
  // Customize well-known landmark EUIs for demonstration accuracy
  let annualTotal = 130 + (seed % 95);
  const lowerName = raw.name.toLowerCase();
  if (lowerName.includes('stephen riady') || lowerName.includes('utown')) {
    annualTotal = 148; // Efficient (< 160)
  } else if (lowerName.includes('central library') || lowerName.includes('clb')) {
    annualTotal = 172; // Moderate (160 - 200)
  } else if (lowerName.includes('computing') || lowerName.includes('com3') || lowerName.includes('com1') || lowerName.includes('com2')) {
    annualTotal = 215; // Energy Intensive (> 200)
  } else if (lowerName.includes('science') || lowerName.includes('s17')) {
    annualTotal = 188;
  }

  const eui: BuildingEnergy = {
    annualTotal,
    monthlyBreakdown: generateMonthlyBreakdown(annualTotal, seed),
  };

  // Generate ~36m x 36m square polygon centered at [longitude, latitude]
  const dLat = 0.000162; // ~18m north/south
  const dLng = 0.000162; // ~18m east/west
  const footprint: [number, number][] = [
    [raw.longitude - dLng, raw.latitude - dLat],
    [raw.longitude + dLng, raw.latitude - dLat],
    [raw.longitude + dLng, raw.latitude + dLat],
    [raw.longitude - dLng, raw.latitude + dLat],
    [raw.longitude - dLng, raw.latitude - dLat],
  ];

  const roofAreaM2 = 1296; // ~36m x 36m
  const solarPv = calculateSolarPvPotential(roofAreaM2, floorCount, annualTotal, seed);

  return {
    id,
    name: raw.name,
    address: raw.address || 'Kent Ridge Campus, National University of Singapore',
    postal: raw.postal || 'Singapore 119077',
    latitude: raw.latitude,
    longitude: raw.longitude,
    height,
    floorCount,
    category,
    eui,
    solarPv,
    footprint,
  };
}

export const FALLBACK_BUILDINGS: Array<{
  elementId: string;
  name: string;
  address: string;
  postal: string;
  latitude: number;
  longitude: number;
}> = [
  {
    elementId: 'bldg-utown-src',
    name: 'Stephen Riady Centre (UTown)',
    address: '2 College Ave West',
    postal: '138607',
    latitude: 1.3040,
    longitude: 103.7738,
  },
  {
    elementId: 'bldg-com3',
    name: 'School of Computing (COM3)',
    address: '11 Research Link',
    postal: '119391',
    latitude: 1.2944,
    longitude: 103.7745,
  },
  {
    elementId: 'bldg-clb',
    name: 'Central Library (CLB)',
    address: '12 Kent Ridge Crescent',
    postal: '119275',
    latitude: 1.2966,
    longitude: 103.7725,
  },
  {
    elementId: 'bldg-s17',
    name: 'Faculty of Science (S17)',
    address: '10 Science Drive 2',
    postal: '117546',
    latitude: 1.2972,
    longitude: 103.7801,
  },
  {
    elementId: 'bldg-kr-mrt',
    name: 'Kent Ridge MRT Station',
    address: 'South Buona Vista Rd',
    postal: '119077',
    latitude: 1.2932,
    longitude: 103.7844,
  },
  {
    elementId: 'bldg-ucc',
    name: 'University Cultural Centre (UCC)',
    address: '50 Kent Ridge Crescent',
    postal: '119279',
    latitude: 1.3005,
    longitude: 103.7728,
  },
  {
    elementId: 'bldg-e3a',
    name: 'Faculty of Engineering (E3A)',
    address: '7 Engineering Drive 1',
    postal: '117574',
    latitude: 1.2995,
    longitude: 103.7712,
  },
  {
    elementId: 'bldg-yih',
    name: 'Yusof Ishak House (YIH)',
    address: '31 Lower Kent Ridge Road',
    postal: '119078',
    latitude: 1.2982,
    longitude: 103.7749,
  },
  {
    elementId: 'bldg-pgpr',
    name: "Prince George's Park Residences",
    address: "27 Prince George's Park",
    postal: '118425',
    latitude: 1.2915,
    longitude: 103.7808,
  },
  {
    elementId: 'bldg-ventas',
    name: 'University Hall (Ventus)',
    address: '8 Kent Ridge Crescent',
    postal: '119276',
    latitude: 1.2961,
    longitude: 103.7719,
  },
  {
    elementId: 'bldg-biz2',
    name: 'NUS Business School (Mochtar Riady Building)',
    address: '15 Kent Ridge Drive',
    postal: '119245',
    latitude: 1.2928,
    longitude: 103.7743,
  },
  {
    elementId: 'bldg-med-md6',
    name: 'Yong Loo Lin School of Medicine (MD6)',
    address: '14 Medical Drive',
    postal: '117599',
    latitude: 1.2958,
    longitude: 103.7788,
  },
  {
    elementId: 'bldg-i40',
    name: 'i4.0 Innovation 4.0 Building',
    address: '3 Research Link',
    postal: '117602',
    latitude: 1.2938,
    longitude: 103.7758,
  },
  {
    elementId: 'bldg-utown-erc',
    name: 'Education Resource Centre (ERC UTown)',
    address: '8 College Ave West',
    postal: '138608',
    latitude: 1.3048,
    longitude: 103.7729,
  },
];

export function buildCampusGeoJson(buildings: CampusBuilding[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const bldg of buildings) {
    if (!bldg.footprint) continue;

    // 1. Campus physical building extrusion (36m x 36m)
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [bldg.footprint],
      },
      properties: {
        id: bldg.id,
        name: bldg.name,
        category: bldg.category,
        height: bldg.height,
        floorCount: bldg.floorCount,
        eui: bldg.eui.annualTotal,
        annualTotal: bldg.eui.annualTotal,
        featureType: 'building',
      },
    });

    // 2. 3D Energy Pillar (14m x 14m core rooftop polygon)
    const pDLat = 0.000063; // ~7m north/south
    const pDLng = 0.000063; // ~7m east/west
    const pillarPolygon: [number, number][] = [
      [bldg.longitude - pDLng, bldg.latitude - pDLat],
      [bldg.longitude + pDLng, bldg.latitude - pDLat],
      [bldg.longitude + pDLng, bldg.latitude + pDLat],
      [bldg.longitude - pDLng, bldg.latitude + pDLat],
      [bldg.longitude - pDLng, bldg.latitude - pDLat],
    ];

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [pillarPolygon],
      },
      properties: {
        id: `${bldg.id}-pillar`,
        buildingId: bldg.id,
        name: `${bldg.name} Energy Pillar`,
        category: bldg.category,
        baseHeight: bldg.height,
        height: bldg.height + bldg.eui.annualTotal * 0.75,
        eui: bldg.eui.annualTotal,
        annualTotal: bldg.eui.annualTotal,
        featureType: 'pillar',
      },
    });

    // 3. 3D Rooftop Solar PV Array (~28m x 28m panel array, 0.6m elevation above roof)
    const sDLat = 0.000126; // ~14m north/south
    const sDLng = 0.000126; // ~14m east/west
    const solarPolygon: [number, number][] = [
      [bldg.longitude - sDLng, bldg.latitude - sDLat],
      [bldg.longitude + sDLng, bldg.latitude - sDLat],
      [bldg.longitude + sDLng, bldg.latitude + sDLat],
      [bldg.longitude - sDLng, bldg.latitude + sDLat],
      [bldg.longitude - sDLng, bldg.latitude - sDLat],
    ];

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [solarPolygon],
      },
      properties: {
        id: `${bldg.id}-solar-pv`,
        buildingId: bldg.id,
        name: `${bldg.name} Solar PV Array`,
        category: bldg.category,
        baseHeight: bldg.height,
        height: bldg.height + 0.6,
        peakCapacityKwp: bldg.solarPv?.peakCapacityKwp || 172.6,
        annualGenerationMwh: bldg.solarPv?.annualGenerationMwh || 204.8,
        gridOffsetPercentage: bldg.solarPv?.gridOffsetPercentage || 18.5,
        co2AbatementTonnes: bldg.solarPv?.co2AbatementTonnes || 83.1,
        featureType: 'solar-pv',
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

export async function fetchCampusBuildings(): Promise<{
  buildings: CampusBuilding[];
  buildingsGeoJson: GeoJSON.FeatureCollection;
}> {
  const apiUrl = process.env.NUS_DIGITAL_TWIN_API || 'https://www.nus-digital-twin.com/api/v1/buildings';

  let rawList: any[] = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        rawList = data;
      }
    }
  } catch {
    // If upstream network fails or times out, smoothly fallback
  }

  if (rawList.length === 0) {
    rawList = FALLBACK_BUILDINGS;
  }

  const enriched = rawList.map((item) => enrichRawBuilding(item));
  const buildingsGeoJson = buildCampusGeoJson(enriched);

  return {
    buildings: enriched,
    buildingsGeoJson,
  };
}

