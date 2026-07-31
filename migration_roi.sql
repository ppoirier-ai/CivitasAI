-- ============================================================================
-- Spacenomics Venture Brief Manager — ROI column migration
-- Run ONCE in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/llfyegbvadfsrrilamgn/sql/new
-- Idempotent — safe to run twice.
--
-- Adds the ROI field (return on investment, free text like "3.2x in 5 years")
-- and seeds placeholder values for the three existing briefs so the
-- marketplace "Highest ROI" sort has data. Edit the numbers to your liking.
-- ============================================================================

ALTER TABLE venture_briefs ADD COLUMN IF NOT EXISTS roi TEXT;

UPDATE venture_briefs SET roi = '4.2x in 5 years' WHERE title LIKE '%ZBLAN%' AND roi IS NULL;
UPDATE venture_briefs SET roi = '3.1x in 5 years' WHERE title LIKE '%Orbital AI%' AND roi IS NULL;
UPDATE venture_briefs SET roi = '2.4x in 5 years' WHERE title LIKE '%Starlink%' AND roi IS NULL;
