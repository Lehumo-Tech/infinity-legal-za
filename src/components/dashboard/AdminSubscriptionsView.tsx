'use client';

import React from 'react';
import {
  Crown, Zap, CheckCircle2, AlertTriangle, RefreshCw, Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface Subscription {
  id: string;
  status: string;
  plan?: { name: string; slug: string; price_monthly: number; features?: any };
  client?: { full_name: string | null; email: string };
  created_at: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

interface AdminSubscriptionsViewProps {
  token: string | null;
}

export function AdminSubscriptionsView({ token }: AdminSubscriptionsViewProps) {
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    loadSubscriptions();
  }, [token]);

  const loadSubscriptions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/subscriptions?admin=true&perPage=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.data?.subscriptions || data.data || []);
      }
    } catch (e) {
      console.error('Subscriptions load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const cancelledSubs = subscriptions.filter(s => s.status === 'cancelled' || s.cancel_at_period_end);
  const totalRevenue = activeSubs.reduce((sum, s) => sum + (s.plan?.price_monthly || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c]">Subscriptions</h2>
          <p className="text-[13px] text-slate-500">{subscriptions.length} total subscriptions</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSubscriptions} className="text-[12px] h-8">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
        {[
          { label: 'Active', value: activeSubs.length, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50', border: 'border-l-emerald-500' },
          { label: 'Cancelled', value: cancelledSubs.length, icon: AlertTriangle, color: 'text-red-600 bg-red-50', border: 'border-l-red-500' },
          { label: 'Total', value: subscriptions.length, icon: Crown, color: 'text-[#a88832] bg-[#c9a84c]/10', border: 'border-l-[#c9a84c]' },
          { label: 'Monthly Revenue', value: `R${totalRevenue.toLocaleString()}`, icon: Zap, color: 'text-purple-600 bg-purple-50', border: 'border-l-purple-500' },
        ].map(card => (
          <div key={card.label} className={`stat-card border-l-4 ${card.border}`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
              <card.icon className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-[#0c1e3c]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{card.value}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Subscription List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="card-premium">
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No subscriptions yet</h3>
            <p className="text-sm text-slate-400 mt-1">Subscriptions will appear here once clients sign up for plans</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map(sub => (
            <div key={sub.id} className="card-premium p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    sub.status === 'active' ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}>
                    <Crown className={`w-5 h-5 ${sub.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0c1e3c]">{sub.client?.full_name || 'Client'}</div>
                    <div className="text-[11px] text-slate-500">{sub.client?.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[#0c1e3c]">{sub.plan?.name || 'Unknown Plan'}</div>
                    <div className="text-[11px] text-slate-500">R{sub.plan?.price_monthly || '—'}/month</div>
                  </div>
                  <Badge className={`text-[10px] ${
                    sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    sub.status === 'past_due' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{sub.status}</Badge>
                </div>
              </div>
              {sub.cancel_at_period_end && (
                <div className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[11px]">
                  Scheduled for cancellation at end of billing period
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
