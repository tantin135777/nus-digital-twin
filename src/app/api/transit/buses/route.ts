import { NextResponse } from 'next/server';
import { fetchLiveBuses } from '@/lib/transit';

export async function GET() {
  try {
    const transitState = await fetchLiveBuses();

    return NextResponse.json(transitState, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error in /api/transit/buses:', error);
    return NextResponse.json(
      {
        asOf: new Date().toISOString(),
        upstreamLastUpdated: new Date().toISOString(),
        stale: true,
        estimated: true,
        buses: [],
        isOffService: true,
      },
      { status: 500 }
    );
  }
}
