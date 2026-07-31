import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Public marketplace data (service role → bypasses RLS).
 * Returns published, public briefs. Optional ?id= for single-brief lookups
 * (used by the checkout page).
 */
export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  const { data, error } = await supabase
    .from('venture_briefs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const publicBriefs = (data ?? []).filter(
    (b) => b.status === 'published' && b.is_public !== false
  );

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id) {
    const brief = publicBriefs.find((b) => b.id === id);
    if (!brief) {
      return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
    }
    return NextResponse.json(brief);
  }

  return NextResponse.json(publicBriefs);
}
