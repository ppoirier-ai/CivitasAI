'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { UserRole } from '@/lib/types';

/**
 * Client-side role resolution.
 * Single source of truth is the `profiles` table (role column).
 * Falls back to auth.users app_metadata.role (set at account creation).
 */
export function resolveRole(user: User | null): UserRole {
  if (!user) return 'none';
  const fromMeta = user.app_metadata?.role as string | undefined;
  if (fromMeta === 'admin' || fromMeta === 'customer') return fromMeta;
  return 'customer';
}

export interface RoleState {
  user: User | null;
  role: UserRole;
  loading: boolean;
  /** Refetch the profile row (e.g. after a role change). */
  refresh: () => Promise<void>;
}

export function useRole(): RoleState {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('none');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u ?? null);
      if (!u) {
        setRole('none');
        return;
      }
      // Prefer DB profile role; fall back to app_metadata
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', u.id)
        .maybeSingle();
      const dbRole = profile?.role as string | undefined;
      if (dbRole === 'admin' || dbRole === 'customer') {
        setRole(dbRole);
      } else {
        setRole(resolveRole(u));
      }
    } catch {
      setRole(resolveRole(user));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refresh();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => {
      try {
        subscription.unsubscribe();
      } catch {
        /* noop */
      }
    };
  }, [supabase, refresh]);

  return { user, role, loading, refresh };
}

/** Route a freshly signed-in user to the right home. */
export function homeForRole(role: UserRole): string {
  return role === 'admin' ? '/' : '/library';
}

/**
 * Admin-only page guard (client side). Redirects non-admins to /library.
 * Server-side enforcement lives in proxy.ts.
 */
export function useAdminGuard() {
  const { role, loading } = useRole();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (role === 'admin') {
      setAllowed(true);
    } else {
      router.replace('/library');
    }
  }, [role, loading, router]);

  return { allowed, loading };
}
