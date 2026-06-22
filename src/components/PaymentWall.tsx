'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2, Star, Loader2, Shield, Lock,
  ArrowRight, LogIn, Crown, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// ============================================
// TYPES
// ============================================
interface PricingPlan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_annual: number | null;
  currency: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
  is_popular: boolean;
  description?: string;
}

type BillingCycle = 'monthly' | 'annual';

interface PaymentWallProps {
  /** If true, user is authenticated and can subscribe */
  isAuthenticated?: boolean;
  /** Callback to show login modal */
  onLoginClick?: () => void;
  /** Callback when payment is successfully initiated (user redirected to PayFast) */
  onPaymentInitiated?: () => void;
  /** Optional className for the wrapper */
  className?: string;
}

// ============================================
// PLAN STYLE MAP — matches database slugs
// ============================================
const PLAN_STYLES: Record<string, {
  icon: typeof Shield;
  popular: boolean;
  badge: string | null;
}> = {
  civil_legal_plan: { icon: Shield, popular: false, badge: null },
  labour_legal_plan: { icon: Zap, popular: true, badge: 'Most Popular' },
  extensive_plan: { icon: Crown, popular: false, badge: 'Best Value' },
};

// ============================================
// CURRENCY FORMATTING
// ============================================
function formatZAR(amount: number): string {
  return `R${amount.toLocaleString('en-ZA')}`;
}

function calculateAnnualSavings(monthlyPrice: number, annualPrice: number | null): number {
  if (!annualPrice) return 0;
  const monthlyCostForYear = monthlyPrice * 12;
  return Math.round(((monthlyCostForYear - annualPrice) / monthlyCostForYear) * 100);
}

// ============================================
// PAYMENT WALL COMPONENT
// ============================================
export function PaymentWall({
  isAuthenticated = false,
  onLoginClick,
  onPaymentInitiated,
  className,
}: PaymentWallProps) {
  const { accessToken } = useAuth();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // Fetch pricing plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/pricing');
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setPlans(data.data);
        }
      } catch {
        // Will fall back to empty array
      } finally {
        setIsLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  // Handle subscribe button click
  const handleSubscribe = useCallback(async (planId: string) => {
    // Check authentication first
    if (!isAuthenticated || !accessToken) {
      onLoginClick?.();
      toast.error('Please sign in to subscribe', {
        description: 'You need an account to complete your subscription.',
      });
      return;
    }

    setLoadingPlanId(planId);

    try {
      const res = await fetch('/api/payfast/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ planId, billingCycle }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        // Create and submit hidden form to PayFast
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.data.payfastUrl;

        Object.entries(data.data.formData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();

        onPaymentInitiated?.();
      } else {
        // Handle API error
        const errorMessage = data.error?.message || data.error || 'Failed to initiate payment';
        if (res.status === 409) {
          toast.error('Active subscription found', {
            description: 'You already have an active subscription. Please cancel it first.',
          });
        } else if (res.status === 401) {
          onLoginClick?.();
          toast.error('Session expired', {
            description: 'Please sign in again to continue.',
          });
        } else {
          toast.error('Payment failed', {
            description: errorMessage,
          });
        }
      }
    } catch {
      toast.error('Network error', {
        description: 'Could not connect to the payment service. Please try again.',
      });
    } finally {
      setLoadingPlanId(null);
    }
  }, [isAuthenticated, accessToken, billingCycle, onLoginClick, onPaymentInitiated]);

  // Get the price for display based on billing cycle
  const getDisplayPrice = (plan: PricingPlan): number => {
    if (billingCycle === 'annual' && plan.price_annual) {
      return Math.round(plan.price_annual / 12);
    }
    return plan.price_monthly;
  };

  const getFullPrice = (plan: PricingPlan): number => {
    if (billingCycle === 'annual' && plan.price_annual) {
      return plan.price_annual;
    }
    return plan.price_monthly;
  };

  // Determine if a plan is "popular" based on database flag or slug map
  const isPopularPlan = (plan: PricingPlan): boolean => {
    return plan.is_popular || PLAN_STYLES[plan.slug]?.popular === true;
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-full mb-4">
          <Shield className="w-3.5 h-3.5 text-[#a88832]" />
          <span className="text-[#a88832] text-[11px] font-semibold uppercase tracking-wider">Secure Payment</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0c1e3c] tracking-tight">
          Choose your legal plan
        </h2>
        <p className="mt-3 text-slate-500 text-sm max-w-md mx-auto">
          All plans include POPIA compliance, AI-powered case analysis, and secure document management.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Label
            htmlFor="billing-toggle"
            className={`text-sm font-medium cursor-pointer transition-colors ${
              billingCycle === 'monthly' ? 'text-[#0c1e3c]' : 'text-slate-400'
            }`}
          >
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={billingCycle === 'annual'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
            aria-label="Toggle between monthly and annual billing"
            className="data-[state=checked]:bg-[#c9a84c]"
          />
          <Label
            htmlFor="billing-toggle"
            className={`text-sm font-medium cursor-pointer transition-colors ${
              billingCycle === 'annual' ? 'text-[#0c1e3c]' : 'text-slate-400'
            }`}
          >
            Annual
          </Label>
          {billingCycle === 'annual' && (
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold ml-1">
              Save up to 16%
            </Badge>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      {isLoadingPlans ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 max-w-4xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-40 mb-4" />
              <div className="h-10 bg-slate-200 rounded w-28 mb-6" />
              <div className="space-y-3 mb-8">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 bg-slate-100 rounded w-full" />
                ))}
              </div>
              <div className="h-11 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const planStyle = PLAN_STYLES[plan.slug];
            const popular = isPopularPlan(plan);
            const PlanIcon = planStyle?.icon || Shield;
            const badgeText = planStyle?.badge;
            const displayPrice = getDisplayPrice(plan);
            const savings = calculateAnnualSavings(plan.price_monthly, plan.price_annual);
            const isLoading = loadingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl transition-all duration-300 ${
                  popular
                    ? 'bg-[#0c1e3c] text-white shadow-2xl shadow-[#0c1e3c]/20 scale-[1.03] ring-2 ring-[#c9a84c]/40'
                    : 'bg-white border border-slate-200 hover:shadow-lg hover:shadow-slate-100/50 hover:border-slate-300'
                }`}
              >
                {/* Badge */}
                {(badgeText || popular) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1 bg-[#c9a84c] text-[#0c1e3c] text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md">
                      <Star className="w-3 h-3" />{badgeText || 'Most Popular'}
                    </span>
                  </div>
                )}

                <div className="p-6 lg:p-8">
                  {/* Plan header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        popular ? 'bg-[#c9a84c]/15' : 'bg-[#0c1e3c]/5'
                      }`}>
                        <PlanIcon className={`w-4 h-4 ${popular ? 'text-[#c9a84c]' : 'text-[#0c1e3c]'}`} />
                      </div>
                      <h3 className={`text-base font-semibold ${popular ? 'text-[#c9a84c]' : 'text-[#0c1e3c]'}`}>
                        {plan.name}
                      </h3>
                    </div>
                    <p className={`text-[12px] mt-1 ${popular ? 'text-[#8fa4c4]' : 'text-slate-500'}`}>
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mt-4">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-bold tracking-tight ${popular ? 'text-white' : 'text-[#0c1e3c]'}`}>
                          {formatZAR(displayPrice)}
                        </span>
                        <span className={`text-sm ${popular ? 'text-[#5a7199]' : 'text-slate-400'}`}>
                          /month
                        </span>
                      </div>
                      {billingCycle === 'annual' && plan.price_annual && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`text-xs ${popular ? 'text-[#7a8fb0]' : 'text-slate-400'}`}>
                            {formatZAR(plan.price_annual)}/year
                          </span>
                          {savings > 0 && (
                            <Badge className={`text-[9px] font-semibold px-1.5 py-0 ${
                              popular
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              Save {savings}%
                            </Badge>
                          )}
                        </div>
                      )}
                      {billingCycle === 'monthly' && plan.price_annual && (
                        <div className="mt-1">
                          <span className={`text-xs ${popular ? 'text-[#7a8fb0]' : 'text-slate-400'}`}>
                            Or {formatZAR(plan.price_annual)}/year (save {calculateAnnualSavings(plan.price_monthly, plan.price_annual)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1" role="list" aria-label={`${plan.name} features`}>
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#c9a84c]" aria-hidden="true" />
                        <span className={`text-[13px] leading-snug ${popular ? 'text-[#c4d3e8]' : 'text-slate-600'}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Subscribe Button */}
                  {isAuthenticated ? (
                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loadingPlanId !== null}
                      aria-label={`Subscribe to ${plan.name} plan`}
                      className={`w-full rounded-xl py-5 text-sm font-semibold transition-all ${
                        popular
                          ? 'bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] shadow-lg shadow-[#c9a84c]/20'
                          : 'bg-[#0c1e3c] text-white hover:bg-[#1a3358]'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Subscribe {formatZAR(getFullPrice(plan))}/{billingCycle === 'annual' ? 'year' : 'month'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={onLoginClick}
                      aria-label={`Sign in to subscribe to ${plan.name} plan`}
                      className={`w-full rounded-xl py-5 text-sm font-semibold transition-all ${
                        popular
                          ? 'bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] shadow-lg shadow-[#c9a84c]/20'
                          : 'bg-[#0c1e3c] text-white hover:bg-[#1a3358]'
                      }`}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign in to Subscribe
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trust indicators */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Lock className="w-3.5 h-3.5" />
          <span>256-bit SSL Encryption</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Shield className="w-3.5 h-3.5" />
          <span>POPIA Compliant</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          <span>PayFast Secure Payments</span>
        </div>
      </div>

      {/* Annual savings callout */}
      {billingCycle === 'monthly' && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setBillingCycle('annual')}
            className="text-[#a88832] text-xs font-medium hover:text-[#8a6e28] underline underline-offset-2 transition-colors"
          >
            Switch to annual billing and save up to 16%
          </button>
        </div>
      )}
    </div>
  );
}
