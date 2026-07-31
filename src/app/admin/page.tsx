'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/lib/auth';
import { formatDateShort } from '@/lib/utils';
import { STATUS_LABELS } from '@/lib/types';
import {
  DollarSign, ShoppingCart, Users, FileText, ArrowUpRight, TrendingUp,
} from 'lucide-react';

interface AdminStats {
  stats: {
    total_revenue_cents: number;
    orders: number;
    customers: number;
    published_briefs: number;
    total_briefs: number;
  };
  recentOrders: {
    id: string;
    customer_email: string;
    brief_title: string;
    amount_cents: number;
    created_at: string;
  }[];
  perBrief: {
    id: string;
    title: string;
    status: string;
    sold: number;
    revenue_cents: number;
  }[];
}

const fmtMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminPage() {
  const { role, loading: roleLoading } = useRole();
  const [data, setData] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (roleLoading || role !== 'admin') return;
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d?.stats) setData(d);
      })
      .catch(() => {});
  }, [role, roleLoading]);

  if (roleLoading || !data) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2EC4C6] border-t-transparent" />
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="text-center py-24">
        <p className="text-sm text-gray-500">Admin access required.</p>
        <Link href="/library" className="inline-block mt-4 text-xs text-[#2EC4C6] hover:text-white">
          Go to My Library
        </Link>
      </div>
    );
  }

  const s = data.stats;
  const statCards = [
    { label: 'Total Revenue', value: s ? fmtMoney(s.total_revenue_cents) : '$0.00', icon: DollarSign, color: 'text-[#2EC4C6]', bg: 'bg-[#2EC4C6]/10' },
    { label: 'Orders', value: s ? String(s.orders) : '0', icon: ShoppingCart, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Customers', value: s ? String(s.customers) : '0', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Published Briefs', value: s ? String(s.published_briefs) : '0', icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Admin Console</h1>
          <p className="text-sm text-gray-500 mt-0.5">Store performance &amp; operations at a glance</p>
        </div>
        <Link href="/dashboard">
          <ButtonGhost>Brief Pipeline</ButtonGhost>
        </Link>
      </div>

      {/* Revenue stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="bg-gray-900/60 border-gray-800/50 hover:border-gray-700/50 transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-white tracking-tight truncate">{value}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent orders */}
      <Card className="bg-gray-900/60 border-gray-800/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Recent Orders</h2>
            <span className="text-[10px] text-gray-600">{data?.recentOrders.length ?? 0} latest</span>
          </div>
          {!data?.recentOrders.length ? (
            <div className="py-12 text-center">
              <p className="text-xs text-gray-600">No purchases yet — new orders will appear here as customers buy briefs.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {data.recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800/40 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{o.brief_title}</p>
                    <p className="text-[10px] text-gray-500 truncate">{o.customer_email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-[#2EC4C6]">{fmtMoney(o.amount_cents)}</p>
                    <p className="text-[10px] text-gray-600">{formatDateShort(o.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-brief sales */}
      <Card className="bg-gray-900/60 border-gray-800/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Sales by Brief</h2>
            <span className="text-[10px] text-gray-600">How each venture brief is performing</span>
          </div>
          {!data?.perBrief.length ? (
            <div className="py-12 text-center">
              <p className="text-xs text-gray-600">No briefs in the system.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {data.perBrief.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#2EC4C6]" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{b.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className="text-[9px] h-3.5 px-1.5 bg-gray-800 text-gray-400 border-0 rounded-full">
                          {STATUS_LABELS[b.status as keyof typeof STATUS_LABELS] ?? b.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-white">
                      {b.sold} sold <span className="text-gray-600">·</span>{' '}
                      <span className="text-[#2EC4C6]">{fmtMoney(b.revenue_cents)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ButtonGhost({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors">
      <TrendingUp className="w-3.5 h-3.5" /> {children}
      <ArrowUpRight className="w-3 h-3" />
    </span>
  );
}
