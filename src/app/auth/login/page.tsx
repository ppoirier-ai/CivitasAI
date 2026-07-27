'use client';

import { useSupabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const supabase = useSupabase();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error) console.error('Login error:', error);
  };

  const handleGuestLogin = () => {
    router.push('/');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2EC4C6]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-[80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(46,196,198,0.03)_0%,_transparent_70%)]" />
      </div>

      <Card className="relative w-full max-w-sm bg-gray-900/80 border-gray-800/60 backdrop-blur-sm shadow-2xl shadow-black/30">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2EC4C6] to-[#1A8A8C] flex items-center justify-center mx-auto mb-4">
              <span className="text-lg font-black text-black">S</span>
            </div>
            <h1 className="text-lg font-bold tracking-[0.25em] text-white">SPACENOMICS</h1>
            <p className="text-[11px] text-[#2EC4C6] tracking-[0.2em] mt-1 uppercase font-medium">
              Venture Brief Manager
            </p>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-[10px] text-gray-600 uppercase tracking-wider">Sign In</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleGuestLogin}
              className="w-full bg-[#2EC4C6] hover:bg-[#28B0B2] text-black font-medium h-11 rounded-lg transition-all active:scale-[0.98]"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Continue as Guest
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-[10px] text-gray-600">or</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            <Button
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium h-11 rounded-lg transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4 mr-2.5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </Button>
          </div>

          <p className="text-[10px] text-gray-700 text-center mt-6">
            Guest mode lets you explore. Google sign-in enables full account features.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
