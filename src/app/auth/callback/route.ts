import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') ?? '/';

  // VULN-03 fix: only allow same-origin relative paths. Blocks protocol-relative
  // and backslash tricks like //attacker.com or /\attacker.com.
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    next = '/';
  }

  if (code) {
    // C1 fix: session cookies set during exchangeCodeForSession() must land on
    // the final redirect response. Build the response up front, write cookies
    // into it from setAll(), then copy them onto the redirect (Supabase docs
    // pattern — proxy.ts in this repo does the same).
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
      const response = NextResponse.redirect(`${origin}${next}`);
      for (const cookie of supabaseResponse.cookies.getAll()) {
        response.cookies.set(cookie);
      }
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Auth failed`);
}
