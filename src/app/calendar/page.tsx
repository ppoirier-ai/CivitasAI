'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSupabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, CalendarPlus, Trash2, GripVertical } from 'lucide-react';
import type { VentureBrief, CalendarEvent } from '@/lib/types';
import { useAdminGuard } from '@/lib/auth';
import { Spinner } from '@/components/spinner';
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

const PALETTE = [
  { name: 'Teal', value: '#2EC4C6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Rose', value: '#F43F5E' },
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type DialogMode = 'add' | 'edit-event' | 'edit-brief';
type DragPayload = { kind: 'event' | 'brief'; id: string };

export default function CalendarPage() {
  const supabase = useSupabase();
  const { allowed, loading: guardLoading } = useAdminGuard();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [briefs, setBriefs] = useState<VentureBrief[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('add');
  const [dialogDate, setDialogDate] = useState('');
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [editBrief, setEditBrief] = useState<VentureBrief | null>(null);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PALETTE[0].value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [eventsReady, setEventsReady] = useState(true);

  const load = useCallback(async () => {
    const { data: briefData } = await supabase
      .from('venture_briefs')
      .select('*')
      .not('scheduled_date', 'is', null)
      .order('scheduled_date', { ascending: true });
    if (briefData) setBriefs(briefData as VentureBrief[]);
    // Standalone events — table may not exist yet if the migration hasn't run.
    try {
      const { data: eventData, error: eventErr } = await supabase
        .from('calendar_events')
        .select('*')
        .order('event_date', { ascending: true });
      if (eventErr) {
        setEventsReady(false);
      } else if (eventData) {
        setEvents(eventData as CalendarEvent[]);
      }
    } catch {
      setEventsReady(false);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!allowed) return;
    // Async fetch — setState happens after await, never synchronously in the
    // effect body (the rule's sync-detection is a false positive here).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [allowed, load]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });

  const briefsByDate: Record<string, VentureBrief[]> = {};
  briefs.forEach((b) => {
    if (b.scheduled_date) {
      if (!briefsByDate[b.scheduled_date]) briefsByDate[b.scheduled_date] = [];
      briefsByDate[b.scheduled_date].push(b);
    }
  });

  const eventsByDate: Record<string, CalendarEvent[]> = {};
  events.forEach((ev) => {
    if (!eventsByDate[ev.event_date]) eventsByDate[ev.event_date] = [];
    eventsByDate[ev.event_date].push(ev);
  });

  /* ————— Dialog helpers ————— */

  function openAdd(dateKey: string) {
    setDialogMode('add');
    setDialogDate(dateKey);
    setTitle('');
    setTime('');
    setDescription('');
    setColor(PALETTE[0].value);
    setError('');
    setDialogOpen(true);
  }

  function openEditEvent(ev: CalendarEvent) {
    setDialogMode('edit-event');
    setEditEvent(ev);
    setDialogDate(ev.event_date);
    setTitle(ev.title);
    setTime(ev.time ?? '');
    setDescription(ev.description ?? '');
    setColor(ev.color && PALETTE.some((p) => p.value === ev.color) ? ev.color : PALETTE[0].value);
    setError('');
    setDialogOpen(true);
  }

  function openEditBrief(b: VentureBrief) {
    setDialogMode('edit-brief');
    setEditBrief(b);
    setDialogDate(b.scheduled_date ?? '');
    setTitle('');
    setTime('');
    setDescription('');
    setColor('');
    setError('');
    setDialogOpen(true);
  }

  function closeDialog() {
    if (saving) return;
    setDialogOpen(false);
    setEditEvent(null);
    setEditBrief(null);
  }

  async function save() {
    if (dialogMode !== 'edit-brief' && !title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!dialogDate) {
      setError('Date is required.');
      return;
    }
    setSaving(true);
    setError('');

    let saveError = '';
    if (dialogMode === 'add') {
      const { error: err } = await supabase.from('calendar_events').insert({
        title: title.trim(),
        event_date: dialogDate,
        time: time || null,
        description: description || null,
        color,
      });
      if (err) saveError = err.message;
    } else if (dialogMode === 'edit-event' && editEvent) {
      const { error: err } = await supabase
        .from('calendar_events')
        .update({
          title: title.trim(),
          event_date: dialogDate,
          time: time || null,
          description: description || null,
          color,
        })
        .eq('id', editEvent.id);
      if (err) saveError = err.message;
    } else if (dialogMode === 'edit-brief' && editBrief) {
      const { error: err } = await supabase
        .from('venture_briefs')
        .update({ scheduled_date: dialogDate || null })
        .eq('id', editBrief.id);
      if (err) saveError = err.message;
    }

    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    setDialogOpen(false);
    setEditEvent(null);
    setEditBrief(null);
    await load();
  }

  async function remove() {
    setSaving(true);
    if (dialogMode === 'edit-event' && editEvent) {
      await supabase.from('calendar_events').delete().eq('id', editEvent.id);
    } else if (dialogMode === 'edit-brief' && editBrief) {
      await supabase.from('venture_briefs').update({ scheduled_date: null }).eq('id', editBrief.id);
    }
    setSaving(false);
    setDialogOpen(false);
    setEditEvent(null);
    setEditBrief(null);
    await load();
  }

  /* ————— Drag & drop ————— */

  function onDragStart(e: React.DragEvent, payload: DragPayload) {
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  }

  async function onDrop(e: React.DragEvent, dateKey: string) {
    e.preventDefault();
    try {
      const payload = JSON.parse(e.dataTransfer.getData('text/plain')) as DragPayload;
      if (payload.kind === 'event') {
        await supabase.from('calendar_events').update({ event_date: dateKey }).eq('id', payload.id);
      } else if (payload.kind === 'brief') {
        await supabase.from('venture_briefs').update({ scheduled_date: dateKey }).eq('id', payload.id);
      }
      await load();
    } catch {
      /* invalid payload — ignore */
    }
  }

  if (guardLoading || (allowed && loading)) return <Spinner />;
  if (!allowed) return null;

  const dialogTitle = dialogMode === 'add' ? 'Add Event' : dialogMode === 'edit-event' ? 'Edit Event' : 'Scheduled Brief';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            View and manage scheduled briefs &amp; events: click a day to add, drag to move.
          </p>
        </div>
        <Button
          onClick={() => openAdd(format(new Date(), 'yyyy-MM-dd'))}
          className="bg-[#2EC4C6] hover:bg-[#28B0B2] text-black font-medium h-8 px-3.5 text-xs rounded-lg"
        >
          <CalendarPlus className="w-3.5 h-3.5 mr-1.5" /> Add Event
        </Button>
      </div>

      <Card className="bg-gray-900/40 border-gray-800/40">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="w-8 h-8 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="w-8 h-8 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <CardTitle className="text-sm font-semibold text-white">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}
              className="text-[11px] text-[#2EC4C6] hover:text-white hover:bg-white/5 h-8 rounded-lg">
              Today
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1.5">
            {WEEKDAYS.map((d, i) => (
              <div key={i} className="text-center text-[10px] text-gray-600 font-medium py-1">{d}</div>
            ))}
          </div>
          {/* Month grid — no overflow clipping; full last row always visible */}
          <div className="grid grid-cols-7 gap-px bg-gray-800/30 rounded-lg pb-2">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayBriefs = briefsByDate[key] || [];
              const dayEvents = eventsByDate[key] || [];
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const hasItems = dayBriefs.length + dayEvents.length > 0;
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => openAdd(key)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, key)}
                  className={`min-h-[64px] sm:min-h-[84px] p-1 sm:p-1.5 cursor-pointer transition-colors duration-200 ${
                    inMonth ? 'bg-gray-900/60 hover:bg-gray-900/80' : 'bg-gray-900/20 hover:bg-gray-900/40'
                  } ${today ? 'ring-1 ring-[#2EC4C6]/50 ring-inset' : ''}`}
                >
                  <p className={`text-[10px] font-medium mb-0.5 ${
                    today ? 'text-[#2EC4C6]' : inMonth ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    {format(day, 'd')}
                  </p>

                  {/* Mobile: dots only */}
                  <div className="flex md:hidden flex-wrap gap-0.5">
                    {hasItems ? (
                      [...dayEvents.map((ev) => ev.color || '#2EC4C6'), ...dayBriefs.map(() => '#2EC4C6')]
                        .slice(0, 4)
                        .map((c, i) => (
                          <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                        ))
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-gray-800" />
                    )}
                  </div>

                  {/* Desktop: chips */}
                  <div className="hidden md:block space-y-0.5">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, { kind: 'event', id: ev.id })}
                        onClick={(e) => { e.stopPropagation(); openEditEvent(ev); }}
                        className="group/chip flex items-center gap-1 rounded-sm px-1 py-0.5 text-[9px] truncate leading-tight cursor-grab active:cursor-grabbing transition-opacity hover:opacity-90"
                        style={{ backgroundColor: `${ev.color || '#2EC4C6'}26`, color: ev.color || '#2EC4C6' }}
                        title={`${ev.title}${ev.time ? ` · ${ev.time}` : ''}: click to edit, drag to move`}
                      >
                        <GripVertical className="w-2 h-2 shrink-0 opacity-40" />
                        <span className="truncate">{ev.time ? `${ev.time} ` : ''}{ev.title}</span>
                      </div>
                    ))}
                    {dayBriefs.map((b) => (
                      <div
                        key={b.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, { kind: 'brief', id: b.id })}
                        onClick={(e) => { e.stopPropagation(); openEditBrief(b); }}
                        className="flex items-center gap-1 bg-[#2EC4C6]/15 text-[#2EC4C6]/90 rounded-sm px-1 py-0.5 text-[9px] truncate leading-tight cursor-grab active:cursor-grabbing hover:bg-[#2EC4C6]/25 transition-colors"
                        title={`${b.title}: click to reschedule, drag to move`}
                      >
                        <GripVertical className="w-2 h-2 shrink-0 opacity-40" />
                        <span className="truncate">{b.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {!eventsReady && (
            <p className="text-[11px] text-amber-500/80 mt-3">
              Standalone events are unavailable: run migration_calendar_events.sql in Supabase to enable them.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ————— Add / Edit dialog ————— */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {dialogMode === 'edit-brief'
                ? `Move or unschedule “${editBrief?.title}” on the calendar.`
                : dialogMode === 'add'
                  ? 'Add a standalone event to the calendar.'
                  : 'Update or delete this event.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {dialogMode !== 'edit-brief' && (
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Team sync, PDF draft due…"
                  className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg h-9 focus:border-[#2EC4C6]/50"
                  autoFocus
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Date</Label>
                <Input
                  type="date"
                  value={dialogDate}
                  onChange={(e) => setDialogDate(e.target.value)}
                  className="bg-gray-800/60 border-gray-700/50 text-white text-sm rounded-lg h-9 focus:border-[#2EC4C6]/50 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              {dialogMode !== 'edit-brief' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Time (optional)</Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="bg-gray-800/60 border-gray-700/50 text-white text-sm rounded-lg h-9 focus:border-[#2EC4C6]/50 [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              )}
            </div>

            {dialogMode !== 'edit-brief' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Description (optional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add context for this event…"
                    rows={2}
                    className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg focus:border-[#2EC4C6]/50 resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Color tag</Label>
                  <div className="flex items-center gap-2">
                    {PALETTE.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setColor(p.value)}
                        className={`w-6 h-6 rounded-full transition-all duration-200 ${
                          color === p.value ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white/70 scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: p.value }}
                        aria-label={p.name}
                        title={p.name}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {error && <p className="text-[11px] text-red-400">{error}</p>}

          <DialogFooter>
            {dialogMode !== 'add' && (
              <Button
                variant="ghost"
                onClick={remove}
                disabled={saving}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-9 px-3 text-xs mr-auto"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> {dialogMode === 'edit-brief' ? 'Unschedule' : 'Delete'}
              </Button>
            )}
            <Button variant="outline" onClick={closeDialog} disabled={saving} className="h-9 px-4 text-xs">
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={saving}
              className="h-9 px-4 text-xs bg-[#2EC4C6] hover:bg-[#28B0B2] text-black font-medium rounded-lg"
            >
              {saving ? 'Saving…' : dialogMode === 'add' ? 'Add Event' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
