import { NextResponse } from 'next/server';
import { fetchCampusBuildings } from '@/lib/digitaltwin';

export async function GET() {
  try {
    const { buildings, buildingsGeoJson } = await fetchCampusBuildings();

    // Payload hygiene: strip raw footprint arrays from buildings array
    // (they are already present inside buildingsGeoJson)
    // while keeping the full nested eui object intact.
    const prunedBuildings = buildings.map((bldg) => {
      const { footprint: _omitted, ...safeBldg } = bldg;
      return safeBldg;
    });

    return NextResponse.json(
      {
        buildings: prunedBuildings,
        buildingsGeoJson,
      },
      {
        headers: {
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error in /api/buildings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campus buildings' },
      { status: 500 }
    );
  }
}
