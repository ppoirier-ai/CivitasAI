import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isAdminEmail } from '@/lib/auth';

/**
 * Auth callback for magic link (email OTP) and OAuth (Google) sign-in.
 * Supabase redirects here with a `code`; we exchange it for a session,
 * then route the user based on their role.
 *
 * Session cookies set during exchangeCodeForSession() must land on the final
 * redirect response: build the response up front, write cookies into it from
 * setAll(), then copy them onto the redirect (same pattern as proxy.ts).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') ?? '';

  // VULN-03 fix: only allow same-origin relative paths. Blocks protocol-relative
  // and backslash tricks like //attacker.com or /\attacker.com.
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    next = '';
  }

  if (code) {
    const supabaseResponse = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const isAdmin =
        isAdminEmail(user?.email) || user?.app_metadata?.role === 'admin';
      const dest = next || (isAdmin ? '/dashboard' : '/opportunities');
      const redirect = NextResponse.redirect(new URL(dest, origin));
      supabaseResponse.cookies.getAll().forEach((cookie) =>
        redirect.cookies.set(cookie)
      );
      return redirect;
    }
  }

  // Missing/invalid code — back to login with an error hint.
  return NextResponse.redirect(new URL('/auth/login?error=auth', origin));
}
