'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSupabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ArrowUpRight, Play, TrendingUp, DollarSign, BarChart3, Filter, X, Eye } from 'lucide-react';
import Link from 'next/link';
import type { VentureBrief } from '@/lib/types';

export default function OpportunitiesPage() {
  const supabase = useSupabase();
  const [briefs, setBriefs] = useState<VentureBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    loadPublicBriefs();
  }, []);

  async function loadPublicBriefs() {
    const { data } = await supabase
      .from('venture_briefs')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setBriefs(data as VentureBrief[]);
    setLoading(false);
  }

  const categories = useMemo(() => {
    const cats = new Set<string>();
    briefs.forEach((b) => { if (b.category) cats.add(b.category); });
    return ['all', ...Array.from(cats).sort()];
  }, [briefs]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    briefs.forEach((b) => b.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [briefs]);

  const filtered = useMemo(() => {
    let result = [...briefs];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.subtitle?.toLowerCase().includes(q) ||
          b.summary?.toLowerCase().includes(q) ||
          b.tags?.some((t) => t.toLowerCase().includes(q)) ||
          b.category?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((b) => b.category === categoryFilter);
    }

    // Sort
    switch (sortBy) {
      case 'newest': result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case 'oldest': result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      case 'title': result.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'cagr': result.sort((a, b) => {
        const aCagr = parseFloat(a.cagr || '0');
        const bCagr = parseFloat(b.cagr || '0');
        return bCagr - aCagr;
      }); break;
    }

    return result;
  }, [briefs, search, categoryFilter, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2EC4C6] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white tracking-tight">Venture Opportunities</h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Institutional-grade venture briefs on the most compelling opportunities in the commercial space economy. Each brief includes market sizing, competitive analysis, and capital requirements.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities, keywords, tags..."
            className="pl-9 bg-gray-900/60 border-gray-800/50 text-white text-sm placeholder:text-gray-600 rounded-lg h-10 focus:border-[#2EC4C6]/50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                categoryFilter === cat
                  ? 'bg-[#2EC4C6]/15 border-[#2EC4C6]/40 text-[#2EC4C6]'
                  : 'bg-gray-900/40 border-gray-800/50 text-gray-500 hover:text-gray-300 hover:border-gray-700'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-gray-600 uppercase tracking-wider">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs bg-gray-900/60 border border-gray-800/50 text-gray-400 rounded-lg px-2 py-1 focus:outline-none focus:border-[#2EC4C6]/50"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title A-Z</option>
              <option value="cagr">Highest CAGR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-600">{filtered.length} opportunity{filtered.length !== 1 ? 'ies' : 'y'} found</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className="bg-gray-900/40 border-gray-800/40 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <p className="text-sm text-gray-500">No opportunities match your search</p>
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setCategoryFilter('all'); }} className="text-[#2EC4C6] mt-2 text-xs">
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((brief) => (
            <Card key={brief.id} className="bg-gray-900/40 border-gray-800/40 hover:border-gray-700/50 transition-all group hover:bg-gray-900/60">
              <CardContent className="p-0">
                {/* Cover image */}
                {brief.cover_image_url ? (
                  <div className="aspect-[3/1] overflow-hidden rounded-t-lg">
                    <img src={brief.cover_image_url} alt={brief.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="aspect-[3/1] bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-t-lg flex items-center justify-center">
                    <span className="text-[10px] text-gray-600 uppercase tracking-widest">Spacenomics</span>
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* Title */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white group-hover:text-[#2EC4C6] transition-colors leading-snug">
                        {brief.title}
                      </h3>
                      {brief.category && (
                        <Badge className="text-[9px] h-4 px-1.5 bg-gray-800 text-gray-400 border-0 rounded-full shrink-0">
                          {brief.category}
                        </Badge>
                      )}
                    </div>
                    {brief.subtitle && (
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{brief.subtitle}</p>
                    )}
                  </div>

                  {/* Summary */}
                  {brief.summary && (
                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{brief.summary}</p>
                  )}

                  {/* Key metrics */}
                  <div className="grid grid-cols-3 gap-2">
                    {brief.tam && (
                      <div className="bg-gray-800/30 rounded-md p-1.5 text-center">
                        <BarChart3 className="w-3 h-3 text-[#2EC4C6]/60 mx-auto mb-0.5" />
                        <p className="text-[9px] text-gray-600 uppercase tracking-wider">TAM</p>
                        <p className="text-[10px] text-gray-300 font-medium truncate">{brief.tam.replace(/[^0-9$BTMkb]/g, '')}</p>
                      </div>
                    )}
                    {brief.cagr && (
                      <div className="bg-gray-800/30 rounded-md p-1.5 text-center">
                        <TrendingUp className="w-3 h-3 text-emerald-400/60 mx-auto mb-0.5" />
                        <p className="text-[9px] text-gray-600 uppercase tracking-wider">CAGR</p>
                        <p className="text-[10px] text-emerald-300 font-medium">{brief.cagr.replace(/[^0-9.%]/g, '')}</p>
                      </div>
                    )}
                    {brief.capital_required && (
                      <div className="bg-gray-800/30 rounded-md p-1.5 text-center">
                        <DollarSign className="w-3 h-3 text-amber-400/60 mx-auto mb-0.5" />
                        <p className="text-[9px] text-gray-600 uppercase tracking-wider">Capital</p>
                        <p className="text-[10px] text-amber-300 font-medium truncate">{brief.capital_required.replace(/[^0-9$BTMkb]/g, '')}</p>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {brief.tags && brief.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {brief.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[8px] bg-gray-800/50 text-gray-500 px-1.5 py-0.5 rounded-full">{tag}</span>
                      ))}
                      {brief.tags.length > 3 && (
                        <span className="text-[8px] text-gray-600">+{brief.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {brief.pdf_url && (
                      <a href={brief.pdf_url} target="_blank" rel="noreferrer" className="flex-1">
                        <Button className="w-full bg-[#2EC4C6] hover:bg-[#28B0B2] text-black text-[10px] h-7 rounded-lg font-medium">
                          <Eye className="w-3 h-3 mr-1" /> View Brief
                        </Button>
                      </a>
                    )}
                    {brief.purchase_url && !brief.pdf_url && (
                      <a href={brief.purchase_url} target="_blank" rel="noreferrer" className="flex-1">
                        <Button className="w-full bg-[#2EC4C6] hover:bg-[#28B0B2] text-black text-[10px] h-7 rounded-lg font-medium">
                          Purchase Brief <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                      </a>
                    )}
                    {brief.video_url && (
                      <a href={brief.video_url} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="border-gray-700/50 text-gray-400 h-7 w-7 p-0 rounded-lg">
                          <Play className="w-3 h-3" />
                        </Button>
                      </a>
                    )}
                    {brief.id && (
                      <Link href={`/briefs/${brief.id}`} className="ml-auto">
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-white h-7 text-[10px] rounded-lg">
                          Details
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
