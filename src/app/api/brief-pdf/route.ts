import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const BUCKET = 'brief-pdfs';
/** Signed URLs expire fast: enough to open/download, useless if shared. */
const SIGNED_URL_TTL_SECONDS = 120;

/**
 * Ownership-gated PDF delivery.
 * GET /api/brief-pdf?id=<brief_id>
 * - 401 when not signed in
 * - 403 when the user does not own the brief (admins bypass)
 * - 302 redirect to a short-lived Supabase signed URL when owned
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing brief id' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const service = await createSupabaseServiceClient();

  // Resolve the brief + its storage key
  const { data: brief } = await service
    .from('venture_briefs')
    .select('id, pdf_url, title')
    .eq('id', id)
    .single();

  if (!brief || !brief.pdf_url) {
    return NextResponse.json({ error: 'PDF not available' }, { status: 404 });
  }

  // Ownership check (admins bypass so Patrick can QA any brief)
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const isAdmin =
    profile?.role === 'admin' ||
    user.app_metadata?.role === 'admin' ||
    isAdminEmail(user.email);

  if (!isAdmin) {
    const { data: purchase } = await service
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('brief_id', id)
      .maybeSingle();

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase required' }, { status: 403 });
    }
  }

  // pdf_url stores the storage object key, e.g. "brief-pdfs/zblan.pdf"
  const key = brief.pdf_url.startsWith(`${BUCKET}/`)
    ? brief.pdf_url.slice(BUCKET.length + 1)
    : brief.pdf_url;

  const { data: signed, error } = await service.storage
    .from(BUCKET)
    .createSignedUrl(key, SIGNED_URL_TTL_SECONDS);

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Could not sign URL' }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl, 302);
}
