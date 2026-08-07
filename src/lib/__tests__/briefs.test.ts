import { describe, it, expect } from 'vitest';
import { enrichBriefs } from '../briefs';
import type { VentureBrief } from '../types';

function makeBrief(overrides: Partial<VentureBrief> = {}): VentureBrief {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Test Brief',
    subtitle: null,
    topic: null,
    target_customer: null,
    status: 'published',
    google_doc_url: null,
    google_doc_content: null,
    cover_image_url: null,
    cover_scene_description: null,
    pdf_url: null,
    scheduled_date: null,
    created_by: 'user',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    problem_solution: null,
    tam: null,
    sam: null,
    som: null,
    cagr: null,
    capital_required: null,
    profit_margin: null,
    purchase_url: null,
    video_url: null,
    summary: null,
    is_public: true,
    tags: [],
    category: null,
    price_cents: 9999,
    roi: null,
    ...overrides,
  };
}

describe('enrichBriefs (D1 shared marketplace enrichment)', () => {
  it('keeps only published + public briefs', () => {
    const rows = [
      makeBrief(),
      makeBrief({ id: 'draft', status: 'draft' }),
      makeBrief({ id: 'hidden', is_public: false }),
    ];
    const out = enrichBriefs(rows);
    expect(out.map((b) => b.id)).toEqual(['11111111-1111-1111-1111-111111111111']);
  });

  it('computes roi_value and capital range from free text', () => {
    const rows = [
      makeBrief({ roi: '4.2x in 5 years', capital_required: '$10M–$50M for entry' }),
    ];
    const [b] = enrichBriefs(rows);
    expect(b.roi_value).toBe(4.2);
    expect(b.capital_min_m).toBe(10);
    expect(b.capital_max_m).toBe(50);
  });

  it('sets null metrics when nothing is parseable', () => {
    const [b] = enrichBriefs([makeBrief()]);
    expect(b.roi_value).toBeNull();
    expect(b.capital_min_m).toBeNull();
    expect(b.capital_max_m).toBeNull();
  });

  it('tolerates null/undefined input', () => {
    expect(enrichBriefs(null)).toEqual([]);
    expect(enrichBriefs(undefined)).toEqual([]);
  });
});
