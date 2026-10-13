import { NextResponse } from 'next/server';
import { fetchTransitStops, fetchTransitRoutes } from '@/lib/transit';

export async function GET() {
  try {
    const [stops, routes] = await Promise.all([
      fetchTransitStops(),
      fetchTransitRoutes(),
    ]);

    return NextResponse.json(
      {
        stops,
        routes,
      },
      {
        headers: {
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error in /api/transit/stops:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campus stops and routes' },
      { status: 500 }
    );
  }
}
