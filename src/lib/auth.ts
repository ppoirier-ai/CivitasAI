'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { UserRole } from '@/lib/types';

export { isAdminEmail } from '@/lib/admin';
import { isAdminEmail } from '@/lib/admin';

/**
 * Client-side role resolution.
 * Order: admin email allowlist → profiles table role → app_metadata.role.
 */
export function resolveRole(user: User | null): UserRole {
  if (!user) return 'none';
  if (isAdminEmail(user.email)) return 'admin';
  const fromMeta = user.app_metadata?.role as string | undefined;
  if (fromMeta === 'admin' || fromMeta === 'customer') return fromMeta;
  return 'customer';
}

export interface RoleState {
  user: User | null;
  role: UserRole;
  loading: boolean;
  /** Re-read the current session and profile (e.g. after a role change). */
  refresh: () => Promise<void>;
}

export function useRole(): RoleState {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('none');
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);

  /** Apply a session snapshot: sets user + resolves role from profile/app_metadata. */
  const applySession = useCallback(
    async (u: User | null) => {
      userRef.current = u;
      setUser(u);
      if (!u) {
        setRole('none');
        setLoading(false);
        return;
      }
      // Email allowlist always wins — no need to hit the profiles table.
      if (isAdminEmail(u.email)) {
        setRole('admin');
        setLoading(false);
        return;
      }
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', u.id)
          .maybeSingle();
        const dbRole = profile?.role as string | undefined;
        setRole(
          dbRole === 'admin' || dbRole === 'customer' ? dbRole : resolveRole(u)
        );
      } catch {
        setRole(resolveRole(u));
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  const refresh = useCallback(async () => {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    await applySession(u ?? null);
  }, [supabase, applySession]);

  useEffect(() => {
    let active = true;
    // Initial load — setState happens in the async callback, never sync in the effect.
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return;
        return applySession(data.user ?? null);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session?.user ?? null);
    });
    return () => {
      active = false;
      try {
        subscription.unsubscribe();
      } catch {
        /* noop */
      }
    };
  }, [supabase, applySession]);

  return { user, role, loading, refresh };
}

/** Route a freshly signed-in user to the right home. */
export function homeForRole(role: UserRole): string {
  return role === 'admin' ? '/dashboard' : '/opportunities';
}

/**
 * Admin-only page guard (client side). Redirects non-admins to /library.
 * `allowed` is derived (no state); server-side enforcement lives in proxy.ts.
 */
export function useAdminGuard() {
  const { role, loading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (role !== 'admin') {
      router.replace('/opportunities');
    }
  }, [role, loading, router]);

  return { allowed: role === 'admin', loading };
}
