'use client';

import { useSupabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRole } from '@/lib/auth';
import { useState } from 'react';
import { KeyRound, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const supabase = useSupabase();
  const { user, role, loading } = useRole();
  const [newPassword, setNewPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const isPasswordUser = (user?.app_metadata?.provider as string | undefined) === 'email';

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage('');
    setPwError('');
    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwBusy(false);
    if (error) {
      setPwError(error.message);
      return;
    }
    setNewPassword('');
    setPwMessage('Password updated.');
  };

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
            { label: 'Email', value: user?.email || (loading ? 'Loading...' : '-') },
            { label: 'User ID', value: user?.id ? `${user.id.slice(0, 12)}...` : (loading ? 'Loading...' : '-'), mono: true },
            { label: 'Role', value: role === 'admin' ? 'Admin' : role === 'customer' ? 'Customer' : '-' },
            { label: 'Project', value: 'Civitas (llfyegbvadfsrrilamgn)', mono: true },
            { label: 'Auth Provider', value: 'Email & password via Supabase' },
          ].map(({ label, value, mono }) => (
            <div key={label}>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">{label}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className={`text-xs text-gray-300 ${mono ? 'font-mono' : ''}`}>{value}</p>
                {label === 'Role' && role === 'admin' && (
                  <Badge className="text-[9px] h-4 px-1.5 bg-[#2EC4C6]/10 text-[#2EC4C6] border-0 rounded-full">Admin</Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {isPasswordUser && (
        <Card className="bg-gray-900/40 border-gray-800/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#2EC4C6]" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">New Password</Label>
                <Input
                  type="password" required value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8+ characters"
                  className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg h-10 focus:border-[#2EC4C6]/50"
                />
              </div>
              {pwError && <p className="text-[11px] text-red-400">{pwError}</p>}
              {pwMessage && (
                <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {pwMessage}
                </p>
              )}
              <Button type="submit" disabled={pwBusy || !newPassword}
                className="bg-[#2EC4C6] hover:bg-[#28B0B2] text-black font-medium h-9 px-4 text-xs rounded-lg disabled:opacity-40">
                {pwBusy ? 'Updating…' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
