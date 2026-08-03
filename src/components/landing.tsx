'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BRIEF_PRICE } from '@/lib/types';
import type { MarketplaceBrief } from '@/lib/types';
import { ArrowRight, ChevronDown, ShieldCheck } from 'lucide-react';
import {
  IconExecutive, IconProblem, IconMarket, IconGrowth, IconCapital, IconRoi, IconLifetime,
  IconBrowse, IconPreview, IconPurchase, IconRocket, IconBook,
} from '@/components/landing-icons';
import SatelliteScene from '@/components/satellite-scene';

/** Fade-up on scroll into view (modern micro-interaction). */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${className} ${visible ? 'revealed' : 'reveal'}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/** Modern section eyebrow with hairlines. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center justify-center gap-3 text-[10px] text-[#2EC4C6] uppercase tracking-[0.3em] font-medium">
      <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#2EC4C6]/50" />
      {children}
      <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#2EC4C6]/50" />
    </p>
  );
}

const SECTIONS = [
  { icon: IconExecutive, title: 'Executive Summary', desc: 'The opportunity in one page — thesis, timing, and why now.' },
  { icon: IconProblem, title: 'Problem & Solution', desc: 'The market gap and the wedge that captures it.' },
  { icon: IconMarket, title: 'Market Sizing', desc: 'TAM, SAM, and SOM with defensible bottom-up math.' },
  { icon: IconGrowth, title: 'Growth Outlook', desc: 'CAGR and the 5-year trajectory of the category.' },
  { icon: IconCapital, title: 'Capital Requirements', desc: 'What it really costs to enter the market.' },
  { icon: IconRoi, title: 'ROI Outlook', desc: 'Return profile and profitability expectations.' },
  { icon: IconLifetime, title: 'Lifetime Access', desc: 'One purchase, forever — view or download any time.' },
];

const STEPS = [
  { icon: IconBrowse, title: 'Browse the marketplace', desc: 'Search by sector, filter by capital you can deploy, sort by ROI.' },
  { icon: IconPreview, title: 'Preview every brief', desc: 'Read the table of contents and sample sections before you buy.' },
  { icon: IconPurchase, title: 'Purchase once, own forever', desc: `${BRIEF_PRICE} — instant PDF access in your library, no subscription.` },
];

export default function LandingPage({ initialBriefs }: { initialBriefs?: MarketplaceBrief[] }) {
  const [briefs, setBriefs] = useState<MarketplaceBrief[]>(initialBriefs ?? []);
  const [loading, setLoading] = useState(!initialBriefs);

  useEffect(() => {
    if (initialBriefs) return;
    fetch('/api/public-briefs')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setBriefs(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [initialBriefs]);

  const featured = briefs.slice(0, 3);

  return (
    <div className="relative grain -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden">
      {/* ============ HERO ============ */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Cosmic background */}
        <div className="absolute inset-0 cosmic-stars" />
        <div className="absolute inset-0 cosmic-stars cosmic-stars-2" />
        <div className="absolute inset-0 cosmic-grid" />
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full nebula nebula-teal" />
        <div className="absolute -bottom-52 -right-32 w-[600px] h-[600px] rounded-full nebula nebula-indigo" />
        <div className="absolute top-1/3 right-1/4 w-[380px] h-[380px] rounded-full nebula nebula-purple" />

        {/* Satellite orbiting Earth — the centered centerpiece */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]">
          <div className="scale-[0.5] sm:scale-[0.7] md:scale-[0.88] lg:scale-100">
            <SatelliteScene size={620} />
          </div>
        </div>

        {/* Legibility veil — keeps the headline crisp while the visual shows through */}
        <div className="absolute inset-0 hero-veil pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center px-6 py-24 z-10">
          <Badge className="mx-auto mb-8 text-[10px] h-6 px-4 bg-white/[0.03] border border-white/15 text-[#2EC4C6] rounded-full uppercase tracking-[0.28em] backdrop-blur">
            <span className="w-1 h-1 rounded-full bg-[#2EC4C6] pulse-dot mr-2.5" />
            Institutional Commercial Space Intelligence
          </Badge>

          <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-light text-white tracking-[-0.03em] leading-[1.05]">
            The Commercial Space Economy,
            <span className="block mt-3 font-semibold cosmic-text tracking-[-0.02em]">Decoded.</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-400 mt-7 leading-relaxed max-w-xl mx-auto">
            Practical market intelligence, unit economics, and capital pathways for commercial space founders, operators, career-aware talent, and PE/VC investors.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Link href="/opportunities">
              <Button className="w-full sm:w-auto bg-[#2EC4C6] hover:bg-[#35D0D2] text-[#04222A] font-semibold h-12 px-9 rounded-lg text-sm transition-all duration-300 hover:shadow-[0_0_28px_rgba(46,196,198,0.28)] active:scale-[0.98]">
                <IconRocket className="w-4 h-4 mr-2" /> Explore Opportunities
              </Button>
            </Link>
            <Link href="#inside">
              <Button variant="outline" className="w-full sm:w-auto border-white/15 bg-white/[0.03] text-gray-200 hover:text-white hover:border-[#2EC4C6]/50 hover:bg-white/[0.05] h-12 px-9 rounded-lg text-sm backdrop-blur transition-all duration-300">
                <IconBook className="w-4 h-4 mr-2" /> See What&apos;s Inside
              </Button>
            </Link>
          </div>

          <p className="text-[11px] text-gray-600 mt-8">
            Prepared by Smooth Capital LLC &nbsp;·&nbsp; {BRIEF_PRICE} per brief &nbsp;·&nbsp; Lifetime access
          </p>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-2 text-[10px] text-gray-600 uppercase tracking-[0.25em] scroll-cue">
          Scroll <ChevronDown className="w-3.5 h-3.5" />
        </div>

        {/* bottom fade into page bg */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-b from-transparent to-[var(--background)]" />
      </section>

      {/* ============ STAT BAND ============ */}
      <section className="border-y border-white/5 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 md:divide-x md:divide-white/5">
          {[
            { value: '$1.2T+', label: 'Markets analyzed' },
            { value: '7', label: 'Analysis sections per brief' },
            { value: loading ? '—' : String(briefs.length), label: 'Briefs published' },
            { value: BRIEF_PRICE, label: 'One-time, lifetime access' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl md:text-[28px] font-semibold text-[#2EC4C6] cosmic-text tracking-tight">{s.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.25em] mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FEATURED BRIEFS ============ */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <Reveal>
          <div className="text-center mb-14">
            <Eyebrow>Featured Briefs</Eyebrow>
            <h2 className="text-3xl sm:text-[40px] font-semibold tracking-[-0.02em] text-white tracking-tight mt-4">Opportunities in orbit, on the ground</h2>
            <p className="text-sm text-gray-500 mt-4 max-w-xl mx-auto">
              Every brief is a complete teardown of one commercial space opportunity — the same format we use internally.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {loading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-xl glass-card animate-pulse" />
            ))
          ) : featured.length === 0 ? (
            <p className="text-sm text-gray-500 col-span-3 text-center py-10">Briefs coming soon.</p>
          ) : (
            featured.map((brief, i) => (
              <Reveal key={brief.id} delay={i * 120}>
                <Link
                  href={`/preview/${brief.id}`}
                  className="group block rounded-lg overflow-hidden glass-card hover:border-[#2EC4C6]/40 transition-all duration-500 hover:bg-white/[0.04]"
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    {brief.cover_image_url ? (
                      <img
                        src={brief.cover_image_url}
                        alt={`${brief.title} cover`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex items-center justify-center">
                        <img src="/brand/logo-white.webp" alt="Spacenomics" className="hidden dark:block h-10 opacity-40" width={800} height={446} loading="lazy" />
                        <img src="/brand/logo-navy.webp" alt="Spacenomics" className="block dark:hidden h-10 opacity-40" width={800} height={446} loading="lazy" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[15px] font-semibold text-white truncate group-hover:text-[#2EC4C6] transition-colors duration-300">{brief.title}</h3>
                      <Badge className="text-[9px] h-4 px-1.5 bg-[#2EC4C6]/10 text-[#2EC4C6] border border-[#2EC4C6]/20 rounded-full shrink-0">
                        {BRIEF_PRICE}
                      </Badge>
                    </div>
                    {brief.category && (
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider">{brief.category}</p>
                    )}
                    <p className="text-[11px] text-gray-500 line-clamp-2">{brief.summary || brief.subtitle}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#2EC4C6] opacity-0 group-hover:opacity-100 transition-opacity">
                      Preview the brief <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))
          )}
        </div>

        <Reveal delay={150}>
          <div className="text-center mt-12">
            <Link href="/opportunities">
              <Button variant="outline" className="border-white/15 bg-white/[0.03] text-gray-200 hover:text-white hover:border-[#2EC4C6]/50 hover:bg-white/[0.05] h-11 px-6 rounded-lg text-sm backdrop-blur transition-all duration-300">
                Browse all opportunities <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ============ WHAT'S INSIDE ============ */}
      <section id="inside" className="relative py-24 border-t border-white/5 scroll-mt-20">
        <div className="absolute inset-0 cosmic-stars cosmic-stars-2 opacity-40" />
        <div className="relative max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-14">
              <Eyebrow>Institutional Intelligence Stack</Eyebrow>
              <h2 className="text-3xl sm:text-[40px] font-semibold tracking-[-0.02em] text-white tracking-tight mt-4">Built for Founders, Talent, & Investors</h2>
              <p className="text-sm text-gray-500 mt-4 max-w-xl mx-auto">
                Turning space-economy hype into bottom-up unit economics, supply-chain clarity, equity benchmarks, and capital execution.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SECTIONS.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={(i % 3) * 100}>
                <div className="h-full rounded-lg glass-card p-6 hover:border-[#2EC4C6]/30 hover:bg-white/[0.05] transition-all duration-500 group">
                  <div className="w-9 h-9 rounded-md bg-[#2EC4C6]/10 border border-[#2EC4C6]/15 flex items-center justify-center mb-4 group-hover:shadow-[0_0_16px_rgba(46,196,198,0.25)] transition-shadow duration-500">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-white">{title}</h3>
                  <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Persona Audience Cards */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5">
            <Reveal delay={100}>
              <div className="h-full rounded-xl glass-card p-6 border border-[#2EC4C6]/20 bg-white/[0.02]">
                <Badge className="text-[9px] h-5 px-2 bg-[#2EC4C6]/10 text-[#2EC4C6] border border-[#2EC4C6]/20 rounded-full mb-3">A1 · Founders & Operators</Badge>
                <h3 className="text-lg font-semibold text-white">Commercial Space Ventures</h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Identify real TAM, validate bottom-up unit economics ($/kg, BOM costs), map vetted supply-chain vendors, and access capital formation playbooks.
                </p>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="h-full rounded-xl glass-card p-6 border border-white/10 bg-white/[0.02]">
                <Badge className="text-[9px] h-5 px-2 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full mb-3">A2 · Talent & Engineers</Badge>
                <h3 className="text-lg font-semibold text-white">Career & Equity Intelligence</h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Evaluate space startups, decode stock-option plans, track hiring waves, and benchmark equity compensation before taking your next role.
                </p>
              </div>
            </Reveal>
            <Reveal delay={300}>
              <div className="h-full rounded-xl glass-card p-6 border border-white/10 bg-white/[0.02]">
                <Badge className="text-[9px] h-5 px-2 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full mb-3">A3 · PE & VC Investors</Badge>
                <h3 className="text-lg font-semibold text-white">Diligence & Deal Flow</h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Access institutional venture briefs, sector risk registers, capital structure commentary, and private equity/SPAC advisory support.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <Reveal>
          <div className="text-center mb-14">
            <Eyebrow>How It Works</Eyebrow>
            <h2 className="text-3xl sm:text-[40px] font-semibold tracking-[-0.02em] text-white tracking-tight mt-4">From orbit to your inbox in three steps</h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 120}>
              <div className="relative h-full rounded-lg glass-card p-7 group">
                <span className="absolute top-5 right-6 text-5xl font-semibold text-white/[0.04]">{i + 1}</span>
                <div className="w-10 h-10 rounded-md bg-[#2EC4C6]/10 border border-[#2EC4C6]/15 flex items-center justify-center mb-5 group-hover:shadow-[0_0_16px_rgba(46,196,198,0.25)] transition-shadow duration-500">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative py-28 overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 cosmic-stars" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full nebula nebula-teal" />
        <Reveal>
          <div className="relative max-w-2xl mx-auto text-center px-6">
            <h2 className="text-3xl sm:text-[44px] font-semibold tracking-[-0.02em] text-white tracking-tight">
              Your next venture is <span className="cosmic-text">in orbit.</span>
            </h2>
            <p className="text-sm text-gray-400 mt-5">
              Stop reading headlines. Start reading the numbers — {BRIEF_PRICE} per brief, yours forever.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-9">
              <Link href="/opportunities">
                <Button className="bg-[#2EC4C6] hover:bg-[#35D0D2] text-[#04222A] font-semibold h-12 px-9 rounded-lg text-sm transition-all duration-300 hover:shadow-[0_0_28px_rgba(46,196,198,0.28)] active:scale-[0.98]">
                  <IconRocket className="w-4 h-4 mr-2" /> Explore the Marketplace
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" className="border-white/15 bg-white/[0.03] text-gray-200 hover:text-white hover:border-[#2EC4C6]/50 hover:bg-white/[0.05] h-12 px-9 rounded-lg text-sm backdrop-blur transition-all duration-300">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Sign In
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
