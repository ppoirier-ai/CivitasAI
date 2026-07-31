'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/lib/auth';
import { BRIEF_PRICE } from '@/lib/types';
import { firstMoneyToken, firstPercent } from '@/lib/metrics';
import type { MarketplaceBrief, PurchaseWithBrief } from '@/lib/types';
import {
  ArrowLeft, Lock, Eye, Download, ShoppingBag, CheckCircle2, BookOpen,
  ListOrdered, TrendingUp, DollarSign, BarChart3, Gauge, FileText, Play,
} from 'lucide-react';

interface TocEntry {
  id: string;
  label: string;
  content: string;
}

export default function PreviewPage() {
  const params = useParams<{ id: string }>();
  const briefId = params.id;
  const router = useRouter();
  const { role, loading: roleLoading } = useRole();

  const [brief, setBrief] = useState<MarketplaceBrief | null>(null);
  const [owned, setOwned] = useState<PurchaseWithBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!briefId) return;
    (async () => {
      try {
        const briefRes = await fetch(`/api/public-briefs?id=${briefId}`);
        const briefData = await briefRes.json().catch(() => null);
        if (briefRes.ok && briefData?.id) {
          setBrief(briefData);
        } else {
          setError('This venture brief is not available.');
        }
        // my-library is session-protected — a signed-out visitor gets a
        // redirect (HTML), so tolerate non-JSON responses as "not owned".
        const libRes = await fetch('/api/my-library').catch(() => null);
        if (libRes && libRes.ok) {
          const libData = await libRes.json().catch(() => ({ purchases: [] }));
          const ownedEntry = (libData?.purchases ?? []).find(
            (p: PurchaseWithBrief) => p.brief?.id === briefId
          );
          if (ownedEntry) setOwned(ownedEntry);
        }
      } catch {
        setError('Could not load this brief. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [briefId]);

  const toc: TocEntry[] = brief
    ? [
        { id: 'executive-summary', label: 'Executive Summary', content: brief.summary || brief.subtitle || '' },
        { id: 'problem-solution', label: 'Problem & Solution', content: brief.problem_solution || '' },
        {
          id: 'market-sizing',
          label: 'Market Sizing (TAM · SAM · SOM)',
          content: [brief.tam, brief.sam, brief.som].filter(Boolean).join(' · '),
        },
        { id: 'growth', label: 'Growth Outlook', content: brief.cagr || '' },
        { id: 'capital', label: 'Capital Requirements', content: brief.capital_required || '' },
        { id: 'profitability', label: 'Profitability', content: brief.profit_margin || '' },
        { id: 'roi', label: 'ROI Outlook', content: brief.roi || '' },
        {
          id: 'opportunity',
          label: 'Opportunity Profile',
          content: [brief.category, brief.tags?.join(', ')].filter(Boolean).join(' — '),
        },
      ].filter((e) => e.content)
    : [];

  const handlePurchase = () => {
    if (role === 'none') {
      router.push(`/auth/login?next=/checkout/${briefId}`);
      return;
    }
    router.push(`/checkout/${briefId}`);
  };

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2EC4C6] border-t-transparent" />
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="max-w-lg mx-auto text-center py-24">
        <p className="text-sm text-gray-500">{error || 'Brief not found'}</p>
        <Link href="/opportunities">
          <Button variant="outline" className="mt-5 border-gray-700/50 text-gray-400 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Opportunities
          </Button>
        </Link>
      </div>
    );
  }

  const metrics = [
    brief.tam && { label: 'TAM', value: firstMoneyToken(brief.tam) ?? brief.tam, icon: BarChart3, color: 'text-[#2EC4C6]' },
    brief.cagr && { label: 'CAGR', value: firstPercent(brief.cagr) ?? brief.cagr, icon: TrendingUp, color: 'text-emerald-300' },
    brief.roi && { label: 'ROI', value: brief.roi_value ? `${brief.roi_value}x` : brief.roi, icon: Gauge, color: 'text-blue-300' },
    brief.capital_required && { label: 'Capital', value: firstMoneyToken(brief.capital_required) ?? brief.capital_required, icon: DollarSign, color: 'text-amber-300' },
  ].filter(Boolean) as { label: string; value: string; icon: typeof BarChart3; color: string }[];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/opportunities" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Opportunities
        </Link>
        <span className="inline-flex items-center gap-1.5 text-[10px] text-gray-600 uppercase tracking-wider">
          <Lock className="w-3 h-3" /> Sample preview — full brief delivered as PDF
        </span>
      </div>

      {/* Header */}
      <div className="space-y-4">
        {brief.cover_image_url && (
          <div className="aspect-[4/1] overflow-hidden rounded-xl">
            <img src={brief.cover_image_url} alt={brief.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="text-[9px] h-4 px-1.5 bg-[#2EC4C6]/10 text-[#2EC4C6] border-0 rounded-full uppercase tracking-wider">
              Preview
            </Badge>
            {brief.category && (
              <Badge className="text-[9px] h-4 px-1.5 bg-gray-800 text-gray-400 border-0 rounded-full">{brief.category}</Badge>
            )}
            {owned && (
              <Badge className="text-[9px] h-4 px-1.5 bg-emerald-500/10 text-emerald-400 border-0 rounded-full">
                <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Owned
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-2">{brief.title}</h1>
          {brief.subtitle && <p className="text-sm text-gray-500 mt-1">{brief.subtitle}</p>}
        </div>

        {/* Metric chips */}
        {metrics.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {metrics.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-gray-900/60 border border-gray-800/50 rounded-lg p-3">
                <Icon className={`w-4 h-4 ${color} mb-1`} />
                <p className="text-[9px] text-gray-600 uppercase tracking-wider">{label}</p>
                <p className="text-sm text-white font-medium truncate">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Preview content + ToC */}
        <div className="lg:col-span-2 space-y-5">
          {/* Table of contents */}
          {toc.length > 0 && (
            <Card className="bg-gray-900/60 border-gray-800/50">
              <CardContent className="p-5">
                <h2 className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  <ListOrdered className="w-4 h-4 text-[#2EC4C6]" /> Table of Contents
                </h2>
                <ol className="space-y-1">
                  {toc.map((entry, i) => (
                    <li key={entry.id}>
                      <a
                        href={`#${entry.id}`}
                        className="flex items-center gap-2.5 text-xs text-gray-400 hover:text-[#2EC4C6] py-1.5 px-2 rounded-md hover:bg-white/5 transition-all"
                      >
                        <span className="text-[10px] font-bold text-[#2EC4C6]/70 w-4 text-right shrink-0">{i + 1}</span>
                        <span className="truncate">{entry.label}</span>
                      </a>
                    </li>
                  ))}
                </ol>
                <p className="text-[10px] text-gray-700 mt-3 pt-3 border-t border-gray-800/50 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Full analysis, charts, and references are included in the PDF.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Sections */}
          {toc.map((entry, i) => (
            <Card key={entry.id} id={entry.id} className="bg-gray-900/40 border-gray-800/40 scroll-mt-20">
              <CardContent className="p-5">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Section {i + 1}</p>
                <h3 className="text-sm font-semibold text-white mb-2">{entry.label}</h3>
                {entry.id === 'market-sizing' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[['TAM', brief.tam], ['SAM', brief.sam], ['SOM', brief.som]].map(([label, value]) => (
                      <div key={label} className="bg-gray-800/40 rounded-lg p-3">
                        <p className="text-[9px] text-gray-600 uppercase tracking-wider">{label}</p>
                        <p className="text-xs text-gray-200 font-medium mt-0.5">{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 leading-relaxed">{entry.content}</p>
                )}
              </CardContent>
            </Card>
          ))}

          {brief.video_url && (
            <a href={brief.video_url} target="_blank" rel="noreferrer">
              <Button variant="outline" className="w-full border-gray-700/50 text-gray-400 hover:text-white h-10 rounded-lg">
                <Play className="w-4 h-4 mr-2" /> Watch the related Spacenomics video
              </Button>
            </a>
          )}
        </div>

        {/* Purchase card */}
        <div className="lg:col-span-1 lg:sticky lg:top-24">
          <Card className="bg-gray-900/70 border-gray-800/50 shadow-2xl shadow-black/30">
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">One-time purchase</p>
                <p className="text-3xl font-bold text-white tracking-tight mt-1">{BRIEF_PRICE}</p>
                <p className="text-[11px] text-gray-500 mt-1">{brief.title}</p>
              </div>

              {owned ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> You own this brief
                  </p>
                  {brief.pdf_url && (
                    <>
                      <a href={brief.pdf_url} target="_blank" rel="noreferrer" className="block">
                        <Button className="w-full bg-[#2EC4C6] hover:bg-[#28B0B2] text-black font-medium h-10 rounded-lg">
                          <Eye className="w-4 h-4 mr-2" /> View Brief
                        </Button>
                      </a>
                      <a href={brief.pdf_url} download className="block">
                        <Button variant="outline" className="w-full border-gray-700/50 text-gray-300 hover:text-white h-10 rounded-lg">
                          <Download className="w-4 h-4 mr-2" /> Download PDF
                        </Button>
                      </a>
                    </>
                  )}
                  <Link href="/library" className="block">
                    <Button variant="ghost" className="w-full text-gray-500 hover:text-white h-10 rounded-lg">
                      <BookOpen className="w-4 h-4 mr-2" /> Go to My Library
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <Button onClick={handlePurchase} className="w-full bg-[#2EC4C6] hover:bg-[#28B0B2] text-black font-medium h-11 rounded-lg transition-all active:scale-[0.98]">
                    <ShoppingBag className="w-4 h-4 mr-2" /> Purchase · {BRIEF_PRICE}
                  </Button>
                  <ul className="space-y-2">
                    {[
                      'Full venture brief as PDF',
                      'Market sizing, competitive & capital analysis',
                      'Lifetime access — view or download anytime',
                      'Free updates to the brief',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[11px] text-gray-500">
                        <CheckCircle2 className="w-3 h-3 text-[#2EC4C6] mt-0.5 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
