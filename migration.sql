-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/llfyegbvadfsrrilamgn/sql/new

-- Add venture brief requirement fields
ALTER TABLE venture_briefs ADD COLUMN IF NOT EXISTS problem_solution TEXT;
ALTER TABLE venture_briefs ADD COLUMN IF NOT EXISTS tam TEXT;
ALTER TABLE venture_briefs ADD COLUMN IF NOT EXISTS sam TEXT;
ALTER TABLE venture_briefs ADD COLUMN IF NOT EXISTS som TEXT;
ALTER TABLE venture_briefs ADD COLUMN IF NOT EXISTS cagr TEXT;
ALTER TABLE venture_briefs ADD COLUMN IF NOT EXISTS capital_required TEXT;
ALTER TABLE venture_briefs ADD COLUMN IF NOT EXISTS profit_margin TEXT;
ALTER TABLE venture_briefs ADD COLUMN IF NOT EXISTS purchase_url TEXT;
ALTER TABLE venture_briefs ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE venture_briefs ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE venture_briefs ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE venture_briefs ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE venture_briefs ADD COLUMN IF NOT EXISTS category TEXT;

-- Enable anon read access for public briefs
DROP POLICY IF EXISTS "briefs_public_select" ON venture_briefs;
CREATE POLICY "briefs_public_select" ON venture_briefs
  FOR SELECT USING (is_public = true);

-- Insert seed data: 3 existing venture briefs with PDFs served from public folder
INSERT INTO venture_briefs (title, subtitle, topic, summary, problem_solution, tam, sam, som, cagr, capital_required, profit_margin, purchase_url, video_url, pdf_url, tags, category, is_public, status, created_by)
VALUES
(
  'ZBLAN Optical Fiber',
  'The First Killer App for In-Space Manufacturing',
  'Manufacturing ZBLAN optical fiber in microgravity eliminates crystallization defects, producing fiber with dramatically lower signal loss.',
  'ZBLAN fiber manufactured in microgravity achieves 100x lower signal attenuation than terrestrial production, unlocking a $12B market in undersea and long-haul telecom.',
  'Terrestrial ZBLAN production suffers from crystallization defects due to gravity. Microgravity manufacturing eliminates these defects, producing fiber with near-theoretical attenuation limits. Flawless Photonics leads this category with planned orbital production on ISS and future commercial platforms.',
  '$180B global fiber optic market',
  '$12B long-haul undersea and terrestrial backbone fiber',
  '$2.8B by 2031 (first-mover advantage)',
  '45% CAGR over next 5 years',
  '$45M for orbital production demo + initial manufacturing capacity',
  '65-75% gross margin once production scales',
  'https://smooth.fund/venture-briefs/zblan-fiber',
  'https://youtube.com/watch?v=thespacenomics',
  '/pdfs/zblan.pdf',
  ARRAY['in-space manufacturing', 'fiber optics', 'telecom', 'microgravity', 'ZBLAN'],
  'Near-Term Business Opportunities',
  true, 'published',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Orbital AI Data Centers',
  'Edge Computing in Low Earth Orbit',
  'Orbital data centers colocated with satellite ground stations reduce latency for global financial trading, real-time analytics, and AI inference.',
  'Fiber optic latency between NY-London is ~60ms. Orbital AI nodes cut this to under 10ms by processing data in orbit. LEO cloud infrastructure enables real-time global AI inference, defense ISR processing, and financial trading arbitrage.',
  '$250B edge computing market',
  '$6B low-latency financial and defense data processing',
  '$1.2B by 2030',
  '35% CAGR over next 5 years',
  '$120M for initial orbital node deployment (3 satellites)',
  '55-65% gross margin',
  'https://smooth.fund/venture-briefs/orbital-ai',
  'https://youtube.com/watch?v=thespacenomics',
  '/pdfs/orbital-ai.pdf',
  ARRAY['edge computing', 'AI', 'data centers', 'satellite', 'low latency', 'orbital'],
  'Near-Term Business Opportunities',
  true, 'published',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Starlink & Satellite Internet Constellations',
  'The $30B Telecom Upside No One Is Pricing Correctly',
  'Satellite internet constellations represent a structural shift in global telecom from GEO relay to LEO mesh with fundamentally different unit economics.',
  'Starlink alone is projected to be a $30B+ business. The transition from GEO to LEO constellations rewrites the economics of global connectivity: lower latency, higher throughput, global coverage.',
  '$1.2T global telecom market',
  '$80B satellite broadband serviceable',
  '$30B+ Starlink revenue by 2028',
  '28% CAGR over next 5 years',
  '$20B+ cumulative capex (Starlink)',
  '40-50% EBITDA margin at scale',
  'https://smooth.fund/venture-briefs/starlink',
  'https://youtube.com/watch?v=thespacenomics',
  '/pdfs/starlink.pdf',
  ARRAY['Starlink', 'satellite internet', 'constellations', 'telecom', 'Kuiper', 'LEO'],
  'Existing Space Businesses',
  true, 'published',
  '00000000-0000-0000-0000-000000000000'
);
