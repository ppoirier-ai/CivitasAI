import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import LandingPage from '@/components/landing';
import type { MarketplaceBrief } from '@/lib/types';
import { parseRoiMultiplier, parseCapitalMillions } from '@/lib/metrics';

const SITE_URL = 'https://civitas-ai-one.vercel.app';

/** Revalidate the landing data every hour (ISR) — new briefs appear without a deploy. */
export const revalidate = 3600;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Spacenomics — Institutional Space Market Intelligence & Venture Briefs',
  description:
    'Institutional-grade commercial space market intelligence, unit economics models, and venture briefs. Sizing TAM, capital requirements, and ROI for space founders, operators, talent, and investors.',
  keywords: [
    'space economy', 'commercial space economy', 'venture brief', 'space unit economics', 'space startups',
    'in-space manufacturing', 'space venture capital', 'orbital infrastructure', 'space market research', 'spacenomics',
    'space startup financial model', 'space supply chain database'
  ],
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Spacenomics',
    title: 'Spacenomics — Venture Briefs for the Commercial Space Economy',
    description:
      'Institutional-grade venture briefs on the most compelling opportunities in the commercial space economy. $99.99, lifetime access.',
    images: [{ url: '/covers/zblan.jpg', width: 900, height: 1165, alt: 'Spacenomics Venture Brief cover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spacenomics — Venture Briefs for the Commercial Space Economy',
    description: 'Institutional-grade venture briefs on the commercial space economy. $99.99, lifetime access.',
    images: ['/covers/zblan.jpg'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'Spacenomics',
      url: `${SITE_URL}/`,
      description:
        'Institutional-grade venture briefs on the most compelling opportunities in the commercial space economy.',
      publisher: { '@type': 'Organization', name: 'Smooth Capital LLC' },
    },
    {
      '@type': 'Product',
      name: 'Spacenomics Venture Brief',
      description:
        'A venture brief covering market sizing, competitive analysis, capital requirements, and ROI outlook for a commercial space opportunity.',
      brand: { '@type': 'Brand', name: 'Spacenomics' },
      offers: {
        '@type': 'Offer',
        price: '99.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/opportunities`,
      },
    },
  ],
};

/** Server-side brief fetch — rendered into the HTML at build/ISR time (instant first paint). */
async function getBriefs(): Promise<MarketplaceBrief[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data, error } = await supabase
      .from('venture_briefs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data ?? [])
      .filter((b) => b.status === 'published' && b.is_public !== false)
      .map((b) => ({
        ...b,
        roi_value: parseRoiMultiplier(b.roi),
        capital_min_m: parseCapitalMillions(b.capital_required)?.min ?? null,
        capital_max_m: parseCapitalMillions(b.capital_required)?.max ?? null,
      }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const briefs = await getBriefs();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage initialBriefs={briefs} />
    </>
  );
}
