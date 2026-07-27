'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Calendar, FileText, TrendingUp, CircleDot, CheckCircle2, ArrowUpRight, Trash2 } from 'lucide-react';
import type { VentureBrief } from '@/lib/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types';
import { formatDateShort } from '@/lib/utils';

export default function DashboardPage() {
  const supabase = useSupabase();
  const [briefs, setBriefs] = useState<VentureBrief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBriefs();
    const sub = supabase
      .channel('briefs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'venture_briefs' }, () => loadBriefs())
      .subscribe();
    return () => { void sub.unsubscribe(); };
  }, [supabase]);

  async function loadBriefs() {
    const { data } = await supabase
      .from('venture_briefs')
      .select('*')
      .order('updated_at', { ascending: false });
    if (data) setBriefs(data as VentureBrief[]);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this brief permanently?')) return;
    await supabase.from('venture_briefs').delete().eq('id', id);
    loadBriefs();
  }

  const stats = [
    {
      label: 'Drafts',
      count: briefs.filter((b) => b.status === 'draft').length,
      icon: FileText,
      color: 'text-gray-400',
      bg: 'bg-gray-800/50',
    },
    {
      label: 'In Progress',
      count: briefs.filter((b) => !['draft', 'published'].includes(b.status)).length,
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Published',
      count: briefs.filter((b) => b.status === 'published').length,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2EC4C6] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Venture Briefs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pipeline overview from draft to publication</p>
        </div>
        <Link href="/briefs/new">
          <Button className="bg-[#2EC4C6] hover:bg-[#28B0B2] text-black font-medium h-9 px-4 text-sm rounded-lg transition-all active:scale-[0.97]">
            <Plus className="w-4 h-4 mr-1.5" />
            New Brief
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stats.map(({ label, count, icon: Icon, color, bg }) => (
          <Card key={label} className="bg-gray-900/60 border-gray-800/50 hover:border-gray-700/50 transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">{count}</p>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Briefs List */}
      {briefs.length === 0 ? (
        <Card className="bg-gray-900/40 border-gray-800/40 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-sm text-gray-500 mb-4">No venture briefs yet</p>
            <Link href="/briefs/new">
              <Button className="bg-[#2EC4C6] hover:bg-[#28B0B2] text-black h-9 px-4 text-sm rounded-lg">
                <Plus className="w-4 h-4 mr-1.5" />
                Create Your First Brief
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {briefs.map((brief) => (
            <Link
              key={brief.id}
              href={`/briefs/${brief.id}`}
              className="group block bg-gray-900/40 border border-gray-800/40 hover:border-gray-700/50 rounded-lg p-4 transition-all hover:bg-gray-900/60"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 mb-1">
                    <CircleDot className={`w-2 h-2 shrink-0 ${STATUS_COLORS[brief.status].replace('bg-', 'text-').replace('animate-pulse', '')}`} />
                    <h3 className="text-sm font-medium text-white truncate group-hover:text-[#2EC4C6] transition-colors">
                      {brief.title}
                    </h3>
                    <Badge
                      className={`text-[10px] h-4.5 px-1.5 font-medium rounded-full border-0 ${STATUS_COLORS[brief.status]} text-white`}
                    >
                      {STATUS_LABELS[brief.status]}
                    </Badge>
                  </div>
                  {brief.subtitle && (
                    <p className="text-xs text-gray-500 truncate ml-4">{brief.subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {brief.scheduled_date && (
                    <span className="hidden sm:flex items-center gap-1 text-[11px] text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {formatDateShort(brief.scheduled_date)}
                    </span>
                  )}
                  <span className="hidden lg:block text-[11px] text-gray-600">{formatDateShort(brief.updated_at)}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#2EC4C6] transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
