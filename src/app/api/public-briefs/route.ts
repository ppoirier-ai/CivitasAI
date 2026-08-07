import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enrichBriefs } from '@/lib/briefs';
import type { VentureBrief } from '@/lib/types';

/** ISR — cache the public marketplace response for up to 1 hour (fast repeat loads). */
export const revalidate = 3600;

/**
 * Public marketplace data (service role → bypasses RLS).
 * Returns published, public briefs enriched with machine-readable metrics
 * (roi_value, capital_min_m, capital_max_m) for sorting and range filtering.
 * Optional ?id= for single-brief lookups (used by the checkout page).
 */
export async function GET(request: Request) {
  const supabase = await createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('venture_briefs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const publicBriefs = enrichBriefs(data as VentureBrief[]);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  // CDN-cache the public marketplace payload for 1 hour (fast repeat loads).
  const headers = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60' };
  if (id) {
    const brief = publicBriefs.find((b) => b.id === id);
    if (!brief) {
      return NextResponse.json({ error: 'Brief not found' }, { status: 404, headers });
    }
    return NextResponse.json(brief, { headers });
  }

  return NextResponse.json(publicBriefs, { headers });
}
