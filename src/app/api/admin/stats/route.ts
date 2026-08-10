import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * Admin console data: revenue, orders, customers, per-brief sales.
 * Admin-only (role from app_metadata in the signed-in JWT).
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (user.app_metadata?.role !== 'admin' && !isAdminEmail(user.email))) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const service = await createSupabaseServiceClient();

  const [purchasesRes, briefsRes, usersRes] = await Promise.all([
    service.from('purchases').select('*').order('created_at', { ascending: false }).limit(500),
    // Only pre-existing columns — is_public/price_cents exist after migration
    service.from('venture_briefs').select('id,title,status'),
    service.auth.admin.listUsers({ perPage: 500 }),
  ]);

  const purchases = (purchasesRes.data ?? []).filter(
    (p) => p.status === 'paid'
  );
  const briefs = briefsRes.data ?? [];
  const emailById: Record<string, string> = {};
  for (const u of usersRes.data?.users ?? []) {
    emailById[u.id] = u.email ?? 'unknown';
  }

  const totalRevenueCents = purchases.reduce((s, p) => s + (p.amount_cents ?? 0), 0);
  const customerIds = new Set(purchases.map((p) => p.user_id));

  const salesByBrief: Record<string, { count: number; revenue: number }> = {};
  for (const p of purchases) {
    const entry = (salesByBrief[p.brief_id] ??= { count: 0, revenue: 0 });
    entry.count += 1;
    entry.revenue += p.amount_cents ?? 0;
  }

  const perBrief = briefs.map((b) => {
    const s = salesByBrief[b.id] ?? { count: 0, revenue: 0 };
    return {
      id: b.id,
      title: b.title,
      status: b.status,
      sold: s.count,
      revenue_cents: s.revenue,
    };
  });

  const briefById = new Map(briefs.map((b) => [b.id, b]));

  const recentOrders = purchases.slice(0, 12).map((p) => ({
    id: p.id,
    customer_email: emailById[p.user_id] ?? 'unknown',
    brief_id: p.brief_id,
    brief_title: briefById.get(p.brief_id)?.title ?? 'Unknown brief',
    amount_cents: p.amount_cents ?? 0,
    created_at: p.created_at,
  }));

  return NextResponse.json({
    stats: {
      total_revenue_cents: totalRevenueCents,
      orders: purchases.length,
      customers: customerIds.size,
      published_briefs: briefs.filter((b) => b.status === 'published').length,
      total_briefs: briefs.length,
    },
    recentOrders,
    perBrief,
  });
}
