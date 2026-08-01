'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { VentureBrief } from '@/lib/types';
import { useAdminGuard } from '@/lib/auth';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from 'date-fns';

export default function CalendarPage() {
  const supabase = useSupabase();
  const { allowed, loading: guardLoading } = useAdminGuard();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [briefs, setBriefs] = useState<VentureBrief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      const { data } = await supabase.from('venture_briefs').select('*').not('scheduled_date', 'is', null).order('scheduled_date', { ascending: true });
      if (data) setBriefs(data as VentureBrief[]);
      setLoading(false);
    })();
  }, [supabase, allowed]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });

  const byDate: Record<string, VentureBrief[]> = {};
  briefs.forEach((b) => { if (b.scheduled_date) { const k = b.scheduled_date; if (!byDate[k]) byDate[k] = []; byDate[k].push(b); } });

  async function unschedule(id: string) {
    await supabase.from('venture_briefs').update({ scheduled_date: null }).eq('id', id);
    const { data } = await supabase.from('venture_briefs').select('*').not('scheduled_date', 'is', null).order('scheduled_date', { ascending: true });
    if (data) setBriefs(data as VentureBrief[]);
  }

  if (guardLoading || (allowed && loading)) return <div className="flex items-center justify-center py-32"><div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2EC4C6] border-t-transparent" /></div>;
  if (!allowed) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Calendar</h1>
        <p className="text-sm text-gray-500 mt-0.5">View and manage scheduled venture briefs</p>
      </div>

      <Card className="bg-gray-900/40 border-gray-800/40">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-8 h-8 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-sm font-semibold text-white">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-8 h-8 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          {/* Headers */}
          <div className="grid grid-cols-7 mb-1.5">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] text-gray-600 font-medium py-1">{d}</div>
            ))}
          </div>
          {/* Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-800/30 rounded-lg overflow-hidden">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayBriefs = byDate[key] || [];
              const inMonth = isSameMonth(day, currentMonth);
              return (
                <div key={day.toISOString()} className={`min-h-[80px] p-1.5 ${inMonth ? 'bg-gray-900/60' : 'bg-gray-900/20'} ${isToday(day) ? 'ring-1 ring-[#2EC4C6]/50' : ''}`}>
                  <p className={`text-[10px] font-medium mb-0.5 ${isToday(day) ? 'text-[#2EC4C6]' : inMonth ? 'text-gray-400' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </p>
                  <div className="space-y-0.5">
                    {dayBriefs.map((b) => (
                      <div key={b.id} className="group relative">
                        <Link href={`/briefs/${b.id}`}
                          className="block text-[9px] bg-[#2EC4C6]/15 text-[#2EC4C6]/90 rounded-sm px-1 py-0.5 truncate hover:bg-[#2EC4C6]/25 transition-colors leading-tight">
                          {b.title}
                        </Link>
                        <button onClick={() => unschedule(b.id)}
                          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          title="Remove">&times;</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
