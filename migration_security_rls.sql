-- ============================================================================
-- Spacenomics Venture Brief Manager — Security hardening migration (VULN-02)
-- Fixes over-permissive RLS on venture_briefs that let any self-registered
-- customer read/write internal draft briefs.
-- Run this ONCE in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/llfyegbvadfsrrilamgn/sql/new
-- Idempotent — safe to run twice.
-- ============================================================================

-- 1. Drop the dangerous policy (from migration_shop.sql) granting ALL
--    authenticated users full read/write access, plus the old anon policy.
DROP POLICY IF EXISTS "briefs authenticated all" ON venture_briefs;
DROP POLICY IF EXISTS "briefs public read" ON venture_briefs;

-- 2. Anyone (anon + signed-in customer) can read published, public briefs.
DROP POLICY IF EXISTS "briefs public read published" ON venture_briefs;
CREATE POLICY "briefs public read published" ON venture_briefs
  FOR SELECT TO anon, authenticated
  USING (is_public = true AND status = 'published');

-- 3. Only users whose JWT app_metadata role is 'admin' can view/edit drafts
--    and manage briefs (INSERT/UPDATE/DELETE included via FOR ALL).
DROP POLICY IF EXISTS "briefs admin full access" ON venture_briefs;
CREATE POLICY "briefs admin full access" ON venture_briefs
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Verify: list the current policies on venture_briefs.
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'venture_briefs';
