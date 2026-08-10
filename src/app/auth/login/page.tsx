'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSupabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Mail, MailCheck } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.549 3.921 1.453l2.814-2.814C17.503 2.988 15.139 2 12.545 2 7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"
      />
    </svg>
  );
}

function LoginForm() {
  const supabase = useSupabase();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '';
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [error, setError] = useState(
    urlError === 'auth' ? 'That sign-in link was invalid or expired. Please request a new one.' : ''
  );
  const [busy, setBusy] = useState<'magic' | 'google' | null>(null);
  const [sent, setSent] = useState(false);

  const redirectTo = () => {
    const url = new URL('/auth/callback', window.location.origin);
    if (next) url.searchParams.set('next', next);
    return url.toString();
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy('magic');
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo() },
    });
    if (otpError) {
      setError('Could not send the sign-in link. Please check the email and try again.');
      setBusy(null);
      return;
    }
    setSent(true);
    setBusy(null);
  };

  const handleGoogle = async () => {
    setError('');
    setBusy('google');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo() },
    });
    if (oauthError) {
      setError('Could not start Google sign-in. Please try again.');
      setBusy(null);
    }
    // On success the browser redirects away — nothing else to do.
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2EC4C6]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-[80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(46,196,198,0.03)_0%,_transparent_70%)]" />
      </div>

      <Card className="relative w-full max-w-sm bg-gray-900/80 border-gray-800/60 backdrop-blur-sm shadow-2xl shadow-black/30">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <img
              src="/brand/logo-white.webp"
              alt="SPACENOMICS"
              width={800}
              height={446}
              className="hidden dark:block h-12 sm:h-14 w-auto mx-auto mb-4"
            />
            <img
              src="/brand/logo-navy.webp"
              alt="SPACENOMICS"
              width={800}
              height={446}
              className="block dark:hidden h-12 sm:h-14 w-auto mx-auto mb-4"
            />
            <p className="text-[11px] text-[#2EC4C6] tracking-[0.2em] uppercase font-medium">
              Venture Brief Marketplace
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4 py-4">
              <MailCheck className="w-10 h-10 text-[#2EC4C6] mx-auto" />
              <div>
                <p className="text-sm text-white font-medium">Check your inbox</p>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  We sent a sign-in link to <span className="text-white">{email.trim()}</span>.
                  Click it to access your account. The link works for new and existing accounts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setSent(false); setError(''); }}
                className="text-[11px] text-[#2EC4C6] hover:text-white transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <Button
                onClick={handleGoogle}
                disabled={busy !== null}
                variant="outline"
                className="w-full border-gray-700/50 text-white hover:bg-gray-800/60 font-medium h-11 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {busy === 'google' ? (
                  'Redirecting to Google…'
                ) : (
                  <>
                    <GoogleIcon /> Continue with Google
                  </>
                )}
              </Button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-[10px] text-gray-600">or with email</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Email</Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg h-10 focus:border-[#2EC4C6]/50"
                  />
                </div>
                {error && <p className="text-[11px] text-red-400">{error}</p>}
                <Button
                  type="submit"
                  disabled={busy !== null}
                  className="w-full bg-[#2EC4C6] hover:bg-[#28B0B2] text-black font-medium h-11 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {busy === 'magic' ? (
                    'Sending link…'
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" /> Email me a sign-in link
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                  No password needed. New to Spacenomics? The same link creates your account.
                </p>
              </form>
            </>
          )}

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-[10px] text-gray-600">or</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <Button
            onClick={() => { window.location.href = '/opportunities'; }}
            variant="outline"
            className="w-full border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-600 font-medium h-10 rounded-lg"
          >
            Browse Opportunities as Guest
          </Button>

          <p className="text-[10px] text-gray-700 text-center mt-5">
            Purchases unlock lifetime access: view or download your briefs any time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2EC4C6] border-t-transparent" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
