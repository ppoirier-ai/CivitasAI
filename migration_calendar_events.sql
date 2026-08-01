-- ============================================================================
-- Spacenomics — Calendar events migration
-- Run this ONCE in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/llfyegbvadfsrrilamgn/sql/new
-- Idempotent — safe to run twice.
-- Enables standalone events (title / date / time / description / color tag)
-- managed directly by admins on the /calendar page. Brief scheduling uses the
-- existing venture_briefs.scheduled_date column (no change needed).
-- ============================================================================

-- 1. Calendar events table ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  time TEXT,
  description TEXT,
  color TEXT DEFAULT '#2EC4C6',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calendar_events_date_idx ON public.calendar_events (event_date);

-- 2. Row Level Security --------------------------------------------------------
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Admins (via profiles.role) manage events; authenticated users can read.
DROP POLICY IF EXISTS "calendar_events admin all" ON public.calendar_events;
CREATE POLICY "calendar_events admin all" ON public.calendar_events
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "calendar_events read" ON public.calendar_events;
CREATE POLICY "calendar_events read" ON public.calendar_events
  FOR SELECT TO authenticated USING (true);

-- 3. updated_at trigger --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calendar_events_updated_at ON public.calendar_events;
CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
