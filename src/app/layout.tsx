'use client';

import { Inter } from 'next/font/google';
import { useSupabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRole } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import PageTransition from '@/components/page-transition';
import {
  LayoutDashboard, FilePlus, CalendarDays, LogOut, Store, ShieldCheck, Settings, Satellite,
} from 'lucide-react';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans-var',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = useSupabase();
  const router = useRouter();
  const { user, role, loading } = useRole();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    router.push('/auth/login');
  };

  const isAdmin = role === 'admin';
  const signedIn = !!user;

  const navLinks = !signedIn
    ? [{ href: '/opportunities', label: 'Opportunities', icon: Store }]
    : isAdmin
      ? [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/opportunities', label: 'Opportunities', icon: Store },
          { href: '/briefs/new', label: 'New Brief', icon: FilePlus },
          { href: '/calendar', label: 'Calendar', icon: CalendarDays },
          { href: '/admin', label: 'Admin Console', icon: ShieldCheck },
        ]
      : [
          // Customers: purchase + access everything via the marketplace
          { href: '/opportunities', label: 'Opportunities', icon: Store },
        ];

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans min-h-screen bg-[#05070F] text-white antialiased flex flex-col`}>
        {/* Ambient deep-space backdrop (fixed, behind everything) */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 cosmic-stars opacity-40" />
          <div className="absolute -top-48 -right-48 w-[560px] h-[560px] rounded-full nebula nebula-indigo opacity-70" />
          <div className="absolute bottom-0 -left-56 w-[640px] h-[640px] rounded-full nebula nebula-teal opacity-60" />
        </div>

        {/* Orbital accent bar */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#2EC4C6]/70 to-transparent" />

        <header className="border-b border-white/5 bg-[#05070F]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-8">
                <Link href={signedIn ? (isAdmin ? '/dashboard' : '/opportunities') : '/opportunities'} className="flex items-center gap-3 group">
                  <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[#0A1222] to-[#101E3A] ring-1 ring-[#2EC4C6]/30 flex items-center justify-center shadow-[0_0_18px_rgba(46,196,198,0.25)]">
                    <Satellite className="w-4 h-4 text-[#2EC4C6]" />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#2EC4C6] pulse-dot" />
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-sm font-semibold tracking-[0.22em] text-white group-hover:text-[#2EC4C6] transition-colors duration-300">
                      SPACENOMICS
                    </span>
                    <span className="text-[9px] text-[#2EC4C6] tracking-[0.3em] uppercase ml-3 font-medium">
                      Venture Briefs
                    </span>
                  </div>
                </Link>
                <nav className="hidden md:flex items-center gap-1">
                  {navLinks.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all duration-300 smooth-ease"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="flex items-center gap-3">
                {!loading && !signedIn && (
                  <Link href="/auth/login">
                    <Button className="bg-[#2EC4C6] hover:bg-[#28B0B2] text-black font-medium h-8 px-3.5 text-xs rounded-lg">
                      Sign In
                    </Button>
                  </Link>
                )}
                {signedIn && (
                  <>
                    <span className="text-xs text-gray-500 hidden sm:inline max-w-[160px] truncate">{user?.email}</span>
                    {isAdmin && (
                      <Badge className="text-[9px] h-4 px-1.5 bg-[#2EC4C6]/10 text-[#2EC4C6] border-0 rounded-full hidden sm:inline-flex">
                        Admin
                      </Badge>
                    )}
                    <Link href="/settings">
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-white hover:bg-white/5 h-8 w-8 p-0">
                        <Settings className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="text-gray-500 hover:text-white hover:bg-white/5 h-8 px-2.5"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-1.5" />
                      <span className="text-xs">Sign Out</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
            {/* Mobile nav */}
            <nav className="flex md:hidden items-center gap-1 pb-2.5 overflow-x-auto">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all whitespace-nowrap"
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <PageTransition>{children}</PageTransition>
        </main>

        <footer className="border-t border-white/5 mt-auto py-6">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-[11px] text-gray-500 tracking-wide">
              Prepared by Smooth Capital LLC &bull; Spacenomics Venture Briefs
            </p>
            <p className="text-[9px] text-gray-700/60 mt-1.5 max-w-lg mx-auto">
              Educational and commercial intelligence only. Not investment advice. Not an offer to sell securities.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
