'use client';

import { useSupabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export default function SettingsPage() {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, [supabase]);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Account and connection details</p>
      </div>

      <Card className="bg-gray-900/40 border-gray-800/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-white tracking-tight">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3.5">
          {[
            { label: 'Email', value: user?.email || 'Loading...' },
            { label: 'User ID', value: user?.id ? `${user.id.slice(0, 12)}...` : 'Loading...', mono: true },
            { label: 'Project', value: 'Civitas (llfyegbvadfsrrilamgn)', mono: true },
            { label: 'Auth Provider', value: 'Google OAuth via Supabase' },
          ].map(({ label, value, mono }) => (
            <div key={label}>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">{label}</p>
              <p className={`text-xs text-gray-300 mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
