-- ============================================================================
-- Spacenomics Venture Brief Manager — Shop / Customer / Admin migration
-- Run this ONCE in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/llfyegbvadfsrrilamgn/sql/new
-- Idempotent — safe to run twice.
-- ============================================================================

-- 1. Marketplace + pricing columns on venture_briefs --------------------------
ALTER TABLE venture_briefs
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS problem_solution TEXT,
  ADD COLUMN IF NOT EXISTS tam TEXT,
  ADD COLUMN IF NOT EXISTS sam TEXT,
  ADD COLUMN IF NOT EXISTS som TEXT,
  ADD COLUMN IF NOT EXISTS cagr TEXT,
  ADD COLUMN IF NOT EXISTS capital_required TEXT,
  ADD COLUMN IF NOT EXISTS profit_margin TEXT,
  ADD COLUMN IF NOT EXISTS purchase_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_cents INTEGER NOT NULL DEFAULT 9999;

-- 2. Purchases table (mock orders, $99.99 each) -------------------------------
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brief_id UUID NOT NULL REFERENCES venture_briefs(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL DEFAULT 9999,
  status TEXT NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS purchases_user_brief_uniq ON purchases (user_id, brief_id);
CREATE INDEX IF NOT EXISTS purchases_user_idx ON purchases (user_id);
CREATE INDEX IF NOT EXISTS purchases_brief_idx ON purchases (brief_id);

-- 3. RLS policies --------------------------------------------------------------
-- venture_briefs: only admins manage briefs; anon + customers read published briefs
ALTER TABLE venture_briefs ENABLE ROW LEVEL SECURITY;

-- VULN-02 fix: the old "briefs authenticated all" policy granted every
-- authenticated user (including self-registered customers) full read/write
-- access to drafts. Replaced by published-read + admin-only management.
DROP POLICY IF EXISTS "briefs authenticated all" ON venture_briefs;
DROP POLICY IF EXISTS "briefs public read" ON venture_briefs;

-- 1. Anyone (anon + signed-in customer) can read published, public briefs
CREATE POLICY "briefs public read published" ON venture_briefs
  FOR SELECT TO anon, authenticated
  USING (is_public = true AND status = 'published');

-- 2. Only users with app_metadata role = 'admin' can view/edit drafts and manage briefs
CREATE POLICY "briefs admin full access" ON venture_briefs
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- purchases: owner can read own purchases (writes go through service role API)
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "purchases owner read" ON purchases;
CREATE POLICY "purchases owner read" ON purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- profiles: allow the 'customer' role (older schema only allowed admin/editor/viewer)
DO $$
DECLARE c TEXT;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass AND contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', c);
  END LOOP;
END $$;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'editor', 'viewer', 'customer'));

-- 4. Publish + enrich the three existing seed briefs ---------------------------
UPDATE venture_briefs SET
  is_public = true,
  price_cents = 9999,
  summary = 'ZBLAN optical fiber — the first killer app for in-space manufacturing, with a $180B TAM and 45% CAGR.',
  category = 'Near-Term Business Opportunities',
  tags = ARRAY['zblan', 'in-space manufacturing', 'fiber optics', 'microgravity'],
  tam = '$180B global fiber optic market',
  sam = '$12B long-haul & specialty fiber',
  som = '$2.8B by 2031',
  cagr = '45% CAGR over 5 years',
  capital_required = '$45M for initial manufacturing capacity',
  profit_margin = '65–75% gross margin',
  problem_solution = 'ZBLAN fiber cannot be produced at scale on Earth due to gravity-induced crystallization. Manufacturing in microgravity unlocks pristine fiber with 10–100x lower signal loss, enabling next-generation telecom, sensing, and laser delivery.',
  video_url = 'https://www.youtube.com/@thespacenomics',
  purchase_url = NULL
WHERE title LIKE '%ZBLAN%';

UPDATE venture_briefs SET
  is_public = true,
  price_cents = 9999,
  summary = 'Orbital AI data centers — compute in space, powered by the sun, cooled by vacuum.',
  category = 'Near-Term Business Opportunities',
  tags = ARRAY['orbital ai', 'data centers', 'space compute', 'ai infrastructure'],
  tam = '$250B global data center market',
  sam = '$35B by 2035',
  som = '$6B near-term orbital compute',
  cagr = '35% CAGR over 5 years',
  capital_required = '$120M for first orbital compute node',
  profit_margin = '70%+ gross margin',
  problem_solution = 'Terrestrial AI data centers are constrained by power, cooling, and land. Orbital compute nodes leverage unlimited solar power and vacuum cooling to deliver high-throughput inference and training capacity.',
  video_url = 'https://www.youtube.com/@thespacenomics',
  purchase_url = NULL
WHERE title LIKE '%Orbital AI%';

UPDATE venture_briefs SET
  is_public = true,
  price_cents = 9999,
  summary = 'Starlink & satellite internet constellations — the $1.2T connectivity opportunity.',
  category = 'Existing Space Businesses',
  tags = ARRAY['starlink', 'satellite internet', 'constellations', 'connectivity'],
  tam = '$1.2T global connectivity market',
  sam = '$180B underserved & mobility',
  som = '$30B by 2030',
  cagr = '28% CAGR over 5 years',
  capital_required = '$10M–$50M for reseller/VAS entry',
  profit_margin = '55–70% gross margin',
  problem_solution = 'Over 3 billion people lack reliable broadband. LEO constellations close the gap, and the buildout creates downstream reseller, antenna, and value-added-service opportunities.',
  video_url = 'https://www.youtube.com/@thespacenomics',
  purchase_url = NULL
WHERE title LIKE '%Starlink%';
