import type { MarketplaceBrief, VentureBrief } from '@/lib/types';
import { parseRoiMultiplier, parseCapitalMillions } from '@/lib/metrics';

/**
 * Enrich raw venture brief rows into marketplace listings:
 * keeps only published + public briefs and attaches machine-readable
 * metrics (roi_value, capital_min_m, capital_max_m) for sorting/filtering.
 * Shared by the landing page (ISR) and /api/public-briefs (marketplace).
 */
export function enrichBriefs(rows: VentureBrief[] | null | undefined): MarketplaceBrief[] {
  return (rows ?? [])
    .filter((b) => b.status === 'published' && b.is_public !== false)
    .map((b) => {
      const cap = parseCapitalMillions(b.capital_required);
      return {
        ...b,
        roi_value: parseRoiMultiplier(b.roi),
        capital_min_m: cap?.min ?? null,
        capital_max_m: cap?.max ?? null,
      };
    });
}
