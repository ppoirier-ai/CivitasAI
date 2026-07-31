import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { PurchaseWithBrief, VentureBrief } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** The signed-in customer's purchases, joined with their venture briefs. */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ purchases: [] });
  }

  const service = await createSupabaseServiceClient();

  const { data: purchases, error } = await service
    .from('purchases')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    // purchases table not created yet → treat as empty store
    return NextResponse.json({ purchases: [] });
  }

  const briefIds = [...new Set((purchases ?? []).map((p) => p.brief_id))];
  let briefs: Record<string, VentureBrief> = {};
  if (briefIds.length > 0) {
    const { data } = await service
      .from('venture_briefs')
      .select('*')
      .in('id', briefIds);
    briefs = Object.fromEntries((data ?? []).map((b) => [b.id, b])) as Record<string, VentureBrief>;
  }

  const result: PurchaseWithBrief[] = (purchases ?? []).flatMap((p) => {
    const brief = briefs[p.brief_id];
    if (!brief) return [];
    return [{ purchase: p, brief }];
  });

  return NextResponse.json({ purchases: result });
}
