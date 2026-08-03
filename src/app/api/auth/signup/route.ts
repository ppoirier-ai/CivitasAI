import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// VULN-05 fix: min 10 chars with upper + lower case and a number.
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;

/**
 * Customer self-signup.
 * Uses the Auth Admin API so accounts are created email-confirmed
 * (Supabase's "Confirm email" setting is ON for this project, which would
 * otherwise leave new customers without a session). Role is 'customer'.
 */
export async function POST(request: Request) {
  // VULN-05 fix: sliding-window rate limit — max 5 signups per IP per 15 min.
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown';
  const rl = checkRateLimit(`signup:${ip}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  let body: { email?: string; password?: string; display_name?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';
  const displayName = (body.display_name ?? '').trim();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (!PASSWORD_RE.test(password)) {
    return NextResponse.json(
      { error: 'Password must be at least 10 characters with upper and lower case letters and a number.' },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServiceClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: displayName || email.split('@')[0] },
    app_metadata: { role: 'customer' },
  });

  if (error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('already registered') || msg.includes('already exists') || error.code === 'user_already_exists') {
      return NextResponse.json(
        { error: 'An account with this email already exists. Sign in instead.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Mirror role into the profiles table (source of truth for role checks).
  // Older schema has CHECK (role IN ('admin','editor','viewer')) — fall back to
  // 'viewer' until migration_shop.sql adds 'customer'.
  let profileRole: string = 'customer';
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: data.user.id,
        display_name: displayName || email.split('@')[0],
        role: profileRole,
      },
      { onConflict: 'id' }
    );
  if (profileError) {
    profileRole = 'viewer';
    const { error: retryError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          display_name: displayName || email.split('@')[0],
          role: profileRole,
        },
        { onConflict: 'id' }
      );
    if (retryError) {
      console.error('Signup: profile upsert failed (both attempts)', retryError.message);
    }
  }

  return NextResponse.json({ ok: true, id: data.user.id });
}
