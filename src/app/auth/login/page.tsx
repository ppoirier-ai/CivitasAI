'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, User, ShieldCheck, ArrowLeft } from 'lucide-react';
import { homeForRole } from '@/lib/auth';
import type { UserRole } from '@/lib/types';

const ADMIN_PATHS = ['/', '/briefs', '/calendar', '/admin'];

function isAdminPath(p: string) {
  return ADMIN_PATHS.some(
    (x) => p === x || p.startsWith(`${x}/`)
  );
}

function LoginForm() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '';

  const [tab, setTab] = useState<'customer' | 'admin'>('customer');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  /** Resolve the role for the signed-in user, then route. */
  async function finishLogin(): Promise<UserRole> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 'none';
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const dbRole = profile?.role as string | undefined;
    if (dbRole === 'admin' || dbRole === 'customer') return dbRole;
    return (user.app_metadata?.role as UserRole | undefined) ?? 'customer';
  }

  function routeByRole(role: UserRole) {
    if (role === 'admin') {
      router.push(next && !isAdminPath(next) ? next : '/');
    } else {
      router.push(next && !isAdminPath(next) ? next : '/library');
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setError('Invalid email or password.');
      setBusy(false);
      return;
    }
    const role = await finishLogin();
    if (tab === 'admin' && role !== 'admin') {
      await supabase.auth.signOut();
      setError('This account does not have admin access. Sign in as a customer or use an admin account.');
      setBusy(false);
      return;
    }
    routeByRole(role);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setBusy(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, display_name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not create account.');
        setBusy(false);
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError('Account created — please sign in.');
        setMode('signin');
        setBusy(false);
        return;
      }
      routeByRole('customer');
    } catch {
      setError('Network error — please try again.');
      setBusy(false);
    }
  };

  const isAdminTab = tab === 'admin';

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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2EC4C6] to-[#1A8A8C] flex items-center justify-center mx-auto mb-4">
              <span className="text-lg font-black text-black">S</span>
            </div>
            <h1 className="text-lg font-bold tracking-[0.25em] text-white">SPACENOMICS</h1>
            <p className="text-[11px] text-[#2EC4C6] tracking-[0.2em] mt-1 uppercase font-medium">
              Venture Brief Marketplace
            </p>
          </div>

          {/* Customer / Admin tabs */}
          <div className="grid grid-cols-2 gap-1 bg-gray-800/60 rounded-lg p-1 mb-6">
            <button
              onClick={() => { setTab('customer'); setError(''); }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                !isAdminTab
                  ? 'bg-[#2EC4C6] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Customer
            </button>
            <button
              onClick={() => { setTab('admin'); setError(''); }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                isAdminTab
                  ? 'bg-[#2EC4C6] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Admin
            </button>
          </div>

          {isAdminTab ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Admin Email</Label>
                <Input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@spacenomics.ai"
                  className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg h-10 focus:border-[#2EC4C6]/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Password</Label>
                <Input
                  type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg h-10 focus:border-[#2EC4C6]/50"
                />
              </div>
              {error && <p className="text-[11px] text-red-400">{error}</p>}
              <Button type="submit" disabled={busy}
                className="w-full bg-[#2EC4C6] hover:bg-[#28B0B2] text-black font-medium h-11 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50">
                {busy ? 'Signing in…' : 'Sign in as Admin'}
              </Button>
              <p className="text-[10px] text-gray-700 text-center">
                Admin accounts are provisioned by Spacenomics and include brief generation &amp; analytics access.
              </p>
            </form>
          ) : mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Email</Label>
                <Input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg h-10 focus:border-[#2EC4C6]/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Password</Label>
                <Input
                  type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg h-10 focus:border-[#2EC4C6]/50"
                />
              </div>
              {error && <p className="text-[11px] text-red-400">{error}</p>}
              <Button type="submit" disabled={busy}
                className="w-full bg-[#2EC4C6] hover:bg-[#28B0B2] text-black font-medium h-11 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50">
                <ArrowRight className="w-4 h-4 mr-2" /> Sign In
              </Button>
              <button type="button" onClick={() => { setMode('signup'); setError(''); }}
                className="w-full text-center text-[11px] text-[#2EC4C6] hover:text-white transition-colors">
                New customer? Create an account
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Full Name</Label>
                <Input
                  type="text" required value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Founder"
                  className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg h-10 focus:border-[#2EC4C6]/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Email</Label>
                <Input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg h-10 focus:border-[#2EC4C6]/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Password</Label>
                <Input
                  type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8+ characters"
                  className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg h-10 focus:border-[#2EC4C6]/50"
                />
              </div>
              {error && <p className="text-[11px] text-red-400">{error}</p>}
              <Button type="submit" disabled={busy}
                className="w-full bg-[#2EC4C6] hover:bg-[#28B0B2] text-black font-medium h-11 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50">
                {busy ? 'Creating account…' : 'Create Account & Sign In'}
              </Button>
              <button type="button" onClick={() => { setMode('signin'); setError(''); }}
                className="w-full flex items-center justify-center gap-1 text-[11px] text-gray-500 hover:text-white transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to sign in
              </button>
            </form>
          )}

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-[10px] text-gray-600">or</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <Button onClick={() => router.push('/opportunities')} variant="outline"
            className="w-full border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-600 font-medium h-10 rounded-lg">
            Browse Opportunities as Guest
          </Button>

          <p className="text-[10px] text-gray-700 text-center mt-5">
            Purchases unlock lifetime access — view or download your briefs any time.
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
