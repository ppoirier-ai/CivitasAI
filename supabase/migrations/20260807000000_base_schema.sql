-- ============================================================================
-- CivitasAI (Spacenomics Venture Brief Manager) — base schema
-- Reconstructed from src/lib/types.ts for the new Supabase project.
-- Creates the core tables that the incremental migrations assume exist:
--   profiles, venture_briefs, approvals  (+ venture_assets storage bucket)
-- Idempotent — safe to run twice.
-- ============================================================================

-- 1. profiles ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','editor','viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles read own" ON public.profiles;
CREATE POLICY "profiles read own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles update own" ON public.profiles;
CREATE POLICY "profiles update own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. venture_briefs ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.venture_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  topic TEXT,
  target_customer TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','draft_ready','generating_cover','cover_ready','generating_pdf','pdf_ready','published')),
  google_doc_url TEXT,
  google_doc_content TEXT,
  cover_image_url TEXT,
  cover_scene_description TEXT,
  pdf_url TEXT,
  scheduled_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.venture_briefs ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS venture_briefs_updated_at ON public.venture_briefs;
CREATE TRIGGER venture_briefs_updated_at
  BEFORE UPDATE ON public.venture_briefs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. approvals ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES public.venture_briefs(id) ON DELETE CASCADE,
  step TEXT NOT NULL CHECK (step IN ('draft_complete','cover_ready','pdf_ready')),
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS approvals_brief_idx ON public.approvals (brief_id);

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approvals admin all" ON public.approvals;
CREATE POLICY "approvals admin all" ON public.approvals
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 4. venture_assets storage bucket (covers, PDFs) -----------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('venture_assets', 'venture_assets', true)
ON CONFLICT (id) DO NOTHING;
