import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { BRIEF_PRICE_CENTS } from '@/lib/types';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mock checkout — no real payment is processed.
 * Marks a $99.99 purchase for the signed-in customer (idempotent per brief).
 */
export async function POST(request: Request) {
  // B2 fix: throttle checkout attempts per IP (defense against abuse).
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown';
  const rl = checkRateLimit(`checkout:${ip}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  let body: { brief_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const briefId = (body.brief_id ?? '').trim();
  if (!UUID_RE.test(briefId)) {
    return NextResponse.json({ error: 'Invalid brief id.' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to purchase.' }, { status: 401 });
  }

  const service = await createSupabaseServiceClient();

  // Brief must be published (is_public/price_cents columns exist post-migration;
  // only status is required here — the marketplace only lists public briefs)
  const { data: brief, error: briefError } = await service
    .from('venture_briefs')
    .select('id,title,status')
    .eq('id', briefId)
    .maybeSingle();

  if (briefError || !brief) {
    return NextResponse.json({ error: 'This venture brief is not available.' }, { status: 404 });
  }
  if (brief.status !== 'published') {
    return NextResponse.json({ error: 'This venture brief is not available for purchase yet.' }, { status: 404 });
  }

  // Already owned → no double charge
  const { data: existing } = await service
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('brief_id', briefId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ alreadyOwned: true, brief_id: briefId });
  }

  const amountCents = BRIEF_PRICE_CENTS; // flat $99.99 price

  const { data: purchase, error: insertError } = await service
    .from('purchases')
    .insert({
      user_id: user.id,
      brief_id: briefId,
      amount_cents: amountCents,
      status: 'paid',
    })
    .select()
    .single();

  if (insertError) {
    console.error('Checkout insert failed:', insertError.message);
    return NextResponse.json(
      { error: 'Checkout is not ready yet — the store database has not been initialized. Run migration_shop.sql in the Supabase SQL Editor.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, purchase });
}
