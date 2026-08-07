export type BriefStatus =
  | 'draft'
  | 'draft_ready'
  | 'generating_cover'
  | 'cover_ready'
  | 'generating_pdf'
  | 'pdf_ready'
  | 'published';

export interface VentureBrief {
  id: string;
  title: string;
  subtitle: string | null;
  topic: string | null;
  target_customer: string | null;
  status: BriefStatus;
  google_doc_url: string | null;
  google_doc_content: string | null;
  cover_image_url: string | null;
  cover_scene_description: string | null;
  pdf_url: string | null;
  scheduled_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Venture Brief Requirements
  problem_solution: string | null;
  tam: string | null;
  sam: string | null;
  som: string | null;
  cagr: string | null;
  capital_required: string | null;
  profit_margin: string | null;
  // Marketplace
  purchase_url: string | null;
  video_url: string | null;
  summary: string | null;
  is_public: boolean;
  tags: string[];
  category: string | null;
  // Shop
  price_cents: number | null;
  // ROI (return on investment, free text e.g. "3.2x in 5 years")
  roi: string | null;
}

/**
 * Marketplace listing: the venture brief plus machine-readable metrics
 * attached server-side by /api/public-briefs (for sorting/filtering).
 */
export interface MarketplaceBrief extends VentureBrief {
  roi_value: number | null;
  capital_min_m: number | null;
  capital_max_m: number | null;
}

export interface Purchase {
  id: string;
  user_id: string;
  brief_id: string;
  amount_cents: number;
  status: string;
  created_at: string;
}

export interface PurchaseWithBrief {
  purchase: Purchase;
  brief: VentureBrief;
}

export type UserRole = 'admin' | 'customer' | 'none';

/** Flat $99.99 price for every venture brief (mock store). */
export const BRIEF_PRICE_CENTS = 9999;
export const BRIEF_PRICE = '$99.99';

export interface Approval {
  id: string;
  brief_id: string;
  step: 'draft_complete' | 'cover_ready' | 'pdf_ready';
  approved: boolean;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
}

/** Standalone calendar event (admin-managed, not tied to a brief). */
export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO date (yyyy-MM-dd). */
  event_date: string;
  time: string | null;
  description: string | null;
  color: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
  updated_at: string;
}

export const STATUS_LABELS: Record<BriefStatus, string> = {
  draft: 'Draft',
  draft_ready: 'Draft Complete',
  generating_cover: 'Generating Cover',
  cover_ready: 'Cover Ready',
  generating_pdf: 'Generating PDF',
  pdf_ready: 'PDF Ready',
  published: 'Published',
};

export const STATUS_COLORS: Record<BriefStatus, string> = {
  draft: 'bg-gray-500',
  draft_ready: 'bg-blue-500',
  generating_cover: 'bg-yellow-500 animate-pulse',
  cover_ready: 'bg-purple-500',
  generating_pdf: 'bg-yellow-500 animate-pulse',
  pdf_ready: 'bg-orange-500',
  published: 'bg-green-500',
};

export const STATUS_ORDER: BriefStatus[] = [
  'draft',
  'draft_ready',
  'generating_cover',
  'cover_ready',
  'generating_pdf',
  'pdf_ready',
  'published',
];
