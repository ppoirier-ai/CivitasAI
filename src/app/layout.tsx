'use client';

import { useSupabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRole } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, FilePlus, CalendarDays, LogOut, Store, BookOpen, ShieldCheck, Settings,
} from 'lucide-react';
import './globals.css';

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
          { href: '/', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/opportunities', label: 'Opportunities', icon: Store },
          { href: '/briefs/new', label: 'New Brief', icon: FilePlus },
          { href: '/calendar', label: 'Calendar', icon: CalendarDays },
          { href: '/admin', label: 'Admin Console', icon: ShieldCheck },
        ]
      : [
          { href: '/library', label: 'My Library', icon: BookOpen },
          { href: '/opportunities', label: 'Opportunities', icon: Store },
        ];

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0A1222] text-white antialiased flex flex-col">
        {/* Teal accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-[#2EC4C6] via-[#2EC4C6]/50 to-transparent" />

        <header className="border-b border-gray-800/60 bg-[#0D1529]/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-8">
                <Link href={signedIn ? (isAdmin ? '/' : '/library') : '/opportunities'} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2EC4C6] to-[#1A8A8C] flex items-center justify-center">
                    <span className="text-xs font-black text-black">S</span>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-sm font-bold tracking-[0.2em] text-white group-hover:text-[#2EC4C6] transition-colors">
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
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all"
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
          {children}
        </main>

        <footer className="border-t border-gray-800/40 mt-auto py-5">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-[11px] text-gray-600">
              Prepared by Smooth Capital LLC &bull; Spacenomics Venture Briefs
            </p>
            <p className="text-[9px] text-gray-700/60 mt-1 max-w-lg mx-auto">
              Educational and commercial intelligence only. Not investment advice. Not an offer to sell securities.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
