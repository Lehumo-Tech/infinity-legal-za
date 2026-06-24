'use client';

import React from 'react';
import {
  Crown, Zap, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { MembershipCard } from './MembershipCard';
import { PaymentWall } from '@/components/PaymentWall';

interface ClientSubscriptionViewProps {
  token: string | null;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
  } | null;
  subscription: any;
  pricingPlans: any[];
  onSubscriptionChange: () => void;
}

export function ClientSubscriptionView({
  token,
  user,
  subscription,
  pricingPlans,
  onSubscriptionChange,
}: ClientSubscriptionViewProps) {
  const [cancelling, setCancelling] = React.useState(false);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) return;
    setCancelling(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Subscription scheduled for cancellation');
        onSubscriptionChange();
      } else {
        toast.error(data.error?.message || 'Failed to cancel');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#0c1e3c]">My Subscription</h2>
        <p className="text-[13px] text-slate-500 mt-1">Manage your legal plan and membership</p>
      </div>

      {subscription ? (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Membership Card */}
          <MembershipCard
            clientName={user?.full_name || 'Member'}
            contractNumber={subscription.contract_number || subscription.membership_number || `INF-${new Date(subscription.created_at || Date.now()).toISOString().slice(0,7).replace('-','')}-${Math.random().toString(36).substring(2,7).toUpperCase()}`}
            planName={subscription.plan?.name}
            planSlug={subscription.plan?.slug}
            status={subscription.status}
            membershipNumber={subscription.membership_number}
            validFrom={subscription.created_at}
            validTo={subscription.current_period_end}
          />

          {/* Plan Details */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/15 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-[#a88832]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0c1e3c]">{subscription.plan?.name || 'Active Plan'}</h3>
                  <p className="text-[11px] text-slate-500">{subscription.plan?.slug?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Status</span>
                  <Badge className={subscription.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{subscription.status}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Monthly Price</span>
                  <span className="font-medium">R{subscription.plan?.price_monthly || '—'}</span>
                </div>
                {subscription.days_remaining !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Days Remaining</span>
                    <span className="font-medium">{subscription.days_remaining}</span>
                  </div>
                )}
                {subscription.cancel_at_period_end && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[12px]">
                    Your subscription will cancel at the end of the billing period.
                  </div>
                )}
              </div>
              <Separator className="my-4" />
              {subscription.plan?.features && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Included Features</p>
                  <ul className="space-y-1.5">
                    {(Array.isArray(subscription.plan.features) ? subscription.plan.features : []).map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-[12px] text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a84c]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!subscription.cancel_at_period_end && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 text-red-600 border-red-200 hover:bg-red-50 text-[12px]"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <PaymentWall isAuthenticated={true} onPaymentInitiated={onSubscriptionChange} className="max-w-4xl mx-auto" />
      )}
    </div>
  );
}
