'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRole } from '@/lib/auth';
import { BRIEF_PRICE, BRIEF_PRICE_CENTS } from '@/lib/types';
import type { VentureBrief, PurchaseWithBrief } from '@/lib/types';
import {
  ArrowLeft, Lock, ShieldCheck, CheckCircle2, Eye, Download, BookOpen,
} from 'lucide-react';

export default function CheckoutPage() {
  const params = useParams<{ briefId: string }>();
  const briefId = params.briefId;
  const router = useRouter();
  const { user, loading: roleLoading } = useRole();

  const [brief, setBrief] = useState<VentureBrief | null>(null);
  const [owned, setOwned] = useState<PurchaseWithBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/29');
  const [cvc, setCvc] = useState('424');
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);

  // Load brief + ownership state
  useEffect(() => {
    if (!briefId) return;
    (async () => {
      try {
        const briefRes = await fetch(`/api/public-briefs?id=${briefId}`);
        const briefData = await briefRes.json().catch(() => null);
        if (briefRes.ok && briefData?.id) {
          setBrief(briefData);
        } else {
          setError('This venture brief is not available for purchase.');
        }
        // my-library is session-protected — tolerate redirect/HTML as "not owned"
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

  // Signed-out users → login first, then come back here
  useEffect(() => {
    if (!roleLoading && !user) {
      router.push(`/auth/login?next=/checkout/${briefId}`);
    }
  }, [roleLoading, user, router, briefId]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPaying(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief_id: briefId }),
      });
      const data = await res.json();
      if (data.alreadyOwned) {
        setOwned({ purchase: data, brief: brief! } as unknown as PurchaseWithBrief);
        setDone(true);
        return;
      }
      if (!res.ok) {
        setError(data.error || 'Checkout failed. Please try again.');
        setPaying(false);
        return;
      }
      setDone(true);
    } catch {
      setError('Network error — please try again.');
      setPaying(false);
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2EC4C6] border-t-transparent" />
      </div>
    );
  }

  if (error && !brief) {
    return (
      <div className="max-w-lg mx-auto text-center py-24">
        <p className="text-sm text-gray-500">{error}</p>
        <Link href="/opportunities">
          <Button variant="outline" className="mt-5 border-gray-700/50 text-gray-400 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Opportunities
          </Button>
        </Link>
      </div>
    );
  }

  // Success screen
  if (done) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="bg-gray-900/60 border-gray-800/50">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              {owned ? 'You already own this brief' : 'Purchase confirmed'}
            </h1>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              {brief?.title} is now in your library — view or download it any time, no further payment needed.
            </p>
            <div className="flex flex-col gap-2 mt-6">
              <Link href="/library">
                <Button className="w-full bg-[#2EC4C6] hover:bg-[#28B0B2] text-black font-medium h-10 rounded-lg">
                  <BookOpen className="w-4 h-4 mr-2" /> Go to My Library
                </Button>
              </Link>
              {brief?.pdf_url && (
                <a href={brief.pdf_url} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full border-gray-700/50 text-gray-300 hover:text-white h-10 rounded-lg">
                    <Eye className="w-4 h-4 mr-2" /> View Brief Now
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link href="/opportunities" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Opportunities
      </Link>

      <h1 className="text-xl font-bold text-white tracking-tight">Checkout</h1>

      <div className="grid md:grid-cols-5 gap-5">
        {/* Order summary */}
        <Card className="md:col-span-2 bg-gray-900/60 border-gray-800/50 h-fit">
          <CardContent className="p-5 space-y-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider">Order Summary</p>
            {brief?.cover_image_url && (
              <div className="aspect-[3/4] overflow-hidden rounded-lg">
                <img src={brief.cover_image_url} alt={brief.title} className="w-full h-full object-cover object-top" />
              </div>
            )}
            <h3 className="text-sm font-semibold text-white leading-snug">{brief?.title}</h3>
            {brief?.subtitle && <p className="text-[11px] text-gray-500">{brief.subtitle}</p>}
            <div className="flex items-center justify-between border-t border-gray-800/60 pt-3">
              <span className="text-xs text-gray-400">Venture brief</span>
              <span className="text-xs text-gray-300">{BRIEF_PRICE}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white">Total</span>
              <span className="text-base font-bold text-[#2EC4C6]">{BRIEF_PRICE}</span>
            </div>
            <p className="text-[9px] text-gray-700 leading-relaxed">
              One-time purchase. Includes lifetime access to the PDF — view and download without limits.
            </p>
          </CardContent>
        </Card>

        {/* Mock payment form */}
        <Card className="md:col-span-3 bg-gray-900/60 border-gray-800/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">Payment</p>
              <span className="flex items-center gap-1 text-[9px] text-amber-400/80">
                <ShieldCheck className="w-3 h-3" /> Demo checkout — no real charge
              </span>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Name on Card</Label>
                <Input required value={cardName} onChange={(e) => setCardName(e.target.value)}
                  placeholder="Jane Founder"
                  className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg h-10 focus:border-[#2EC4C6]/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Card Number</Label>
                <div className="relative">
                  <Input required value={cardNumber} onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242" inputMode="numeric"
                    className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg h-10 pr-9 focus:border-[#2EC4C6]/50" />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Expiry</Label>
                  <Input required value={expiry} onChange={(e) => setExpiry(e.target.value)}
                    placeholder="12/29" inputMode="numeric"
                    className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg h-10 focus:border-[#2EC4C6]/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">CVC</Label>
                  <Input required value={cvc} onChange={(e) => setCvc(e.target.value)}
                    placeholder="424" inputMode="numeric"
                    className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg h-10 focus:border-[#2EC4C6]/50" />
                </div>
              </div>

              {error && <p className="text-[11px] text-red-400">{error}</p>}

              <Button type="submit" disabled={paying}
                className="w-full bg-[#2EC4C6] hover:bg-[#28B0B2] text-black font-medium h-11 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50">
                {paying ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                    Processing…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Pay {BRIEF_PRICE} (Demo)
                  </span>
                )}
              </Button>
              <p className="text-[9px] text-gray-700 text-center">
                Mock payment only — no card is charged and no payment provider is involved.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
