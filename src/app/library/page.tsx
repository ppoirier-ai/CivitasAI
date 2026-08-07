'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BRIEF_PRICE } from '@/lib/types';
import type { PurchaseWithBrief } from '@/lib/types';
import { formatDateShort } from '@/lib/utils';
import {
  BookOpen, Eye, Download, ShoppingBag, CheckCircle2, FileText,
} from 'lucide-react';
import { Spinner } from '@/components/spinner';

export default function LibraryPage() {
  const [purchases, setPurchases] = useState<PurchaseWithBrief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/my-library')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.purchases)) setPurchases(d.purchases);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">My Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {purchases.length === 0
              ? 'Your purchased venture briefs will appear here'
              : `${purchases.length} purchased brief${purchases.length !== 1 ? 's' : ''}: view or download any time`}
          </p>
        </div>
        <Link href="/opportunities">
          <Button className="bg-[#2EC4C6] hover:bg-[#28B0B2] text-black font-medium h-9 px-4 text-sm rounded-lg">
            <ShoppingBag className="w-4 h-4 mr-1.5" /> Browse Opportunities
          </Button>
        </Link>
      </div>

      {purchases.length === 0 ? (
        <Card className="bg-gray-900/40 border-gray-800/40 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-sm text-gray-500 mb-1">Your library is empty</p>
            <p className="text-xs text-gray-600 mb-5 max-w-xs text-center">
              Purchase a venture brief from the marketplace and it will be unlocked here forever.
            </p>
            <Link href="/opportunities">
              <Button className="bg-[#2EC4C6] hover:bg-[#28B0B2] text-black h-9 px-4 text-sm rounded-lg">
                <ShoppingBag className="w-4 h-4 mr-1.5" /> Explore Venture Opportunities
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchases.map(({ purchase, brief }) => (
            <Card key={purchase.id} className="bg-gray-900/40 border-gray-800/40 hover:border-gray-700/50 transition-all group hover:bg-gray-900/60">
              <CardContent className="p-0">
                {brief.cover_image_url ? (
                  <div className="aspect-[3/4] overflow-hidden rounded-t-lg">
                    <img src={brief.cover_image_url} alt={brief.title} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="aspect-[3/4] bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-t-lg flex items-center justify-center">
                    <span className="text-[10px] text-gray-600 uppercase tracking-widest">Spacenomics</span>
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white group-hover:text-[#2EC4C6] transition-colors leading-snug">
                        {brief.title}
                      </h3>
                      {brief.subtitle && (
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{brief.subtitle}</p>
                      )}
                    </div>
                    <Badge className="text-[9px] h-4 px-1.5 bg-emerald-500/10 text-emerald-400 border-0 rounded-full shrink-0">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Owned
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-600">
                    <span>Purchased {formatDateShort(purchase.created_at)}</span>
                    <span className="font-medium text-gray-400">{BRIEF_PRICE}</span>
                  </div>

                  {brief.pdf_url ? (
                    <div className="flex items-center gap-2">
                      <a href={brief.pdf_url} target="_blank" rel="noreferrer" className="flex-1">
                        <Button className="w-full bg-[#2EC4C6] hover:bg-[#28B0B2] text-black text-[10px] h-7 rounded-lg font-medium">
                          <Eye className="w-3 h-3 mr-1" /> View Brief
                        </Button>
                      </a>
                      <a href={brief.pdf_url} download className="flex-1">
                        <Button variant="outline" className="w-full border-gray-700/50 text-gray-300 hover:text-white text-[10px] h-7 rounded-lg font-medium">
                          <Download className="w-3 h-3 mr-1" /> Download
                        </Button>
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button disabled className="w-full bg-gray-800/50 text-gray-500 text-[10px] h-7 rounded-lg font-medium">
                        <FileText className="w-3 h-3 mr-1" /> PDF Coming Soon
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
