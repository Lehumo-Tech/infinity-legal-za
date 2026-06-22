'use client';

import { DollarSign, CheckCircle2, Shield, Zap, Crown } from 'lucide-react';
import {
  Card, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Plan style map — matches database slugs
const PLAN_STYLES: Record<string, {
  border: string;
  buttonColor: string;
  badge: string | null;
  popular?: boolean;
  cardBg: string;
  textClass: string;
  subtextClass: string;
  icon: typeof Shield;
}> = {
  civil_legal_plan: {
    border: 'border-slate-200',
    buttonColor: 'bg-[#0c1e3c] text-white hover:bg-[#132d52]',
    badge: null,
    cardBg: 'bg-white',
    textClass: 'text-[#0c1e3c]',
    subtextClass: 'text-slate-500',
    icon: Shield,
  },
  labour_legal_plan: {
    border: 'border-[#c9a84c]/30',
    buttonColor: 'bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#a88832]',
    badge: 'Popular',
    popular: true,
    cardBg: 'bg-[#0c1e3c]',
    textClass: 'text-white',
    subtextClass: 'text-slate-300',
    icon: Zap,
  },
  extensive_plan: {
    border: 'border-slate-200',
    buttonColor: 'bg-[#0c1e3c] text-white hover:bg-[#132d52]',
    badge: 'Best Value',
    cardBg: 'bg-white',
    textClass: 'text-[#0c1e3c]',
    subtextClass: 'text-slate-500',
    icon: Crown,
  },
};

const defaultPlanStyle = {
  border: 'border-slate-200',
  buttonColor: 'bg-[#0c1e3c] text-white hover:bg-[#132d52]',
  badge: null,
  cardBg: 'bg-white',
  textClass: 'text-[#0c1e3c]',
  subtextClass: 'text-slate-500',
  icon: Shield,
};

interface PricingViewProps {
  plans: any[];
  onSubscribe?: (planId: string) => void;
  onLoginClick?: () => void;
  isAuthenticated?: boolean;
}

export function PricingView({ plans, onSubscribe, onLoginClick, isAuthenticated }: PricingViewProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#0c1e3c]">Pricing Plans</h2>
        <p className="text-[13px] text-slate-500 mt-1">All prices in South African Rand (ZAR). POPIA compliant by default.</p>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-[13px] text-slate-500">No pricing plans available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => {
            const style = PLAN_STYLES[plan.slug] || defaultPlanStyle;
            const features = Array.isArray(plan.features) ? plan.features : [];
            const PlanIcon = style.icon;
            const isPopular = style.popular || plan.is_popular;
            return (
              <Card key={plan.id} className={`relative shadow-sm ${style.cardBg} ${isPopular ? 'ring-2 ring-[#c9a84c]' : ''} border ${style.border}`}>
                {(style.badge || isPopular) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className={`text-[9px] border ${isPopular ? 'bg-[#c9a84c] text-[#0c1e3c] border-[#c9a84c]' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                      {style.badge || 'Popular'}
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isPopular ? 'bg-[#c9a84c]/15' : 'bg-[#0c1e3c]/5'}`}>
                      <PlanIcon className={`w-3.5 h-3.5 ${isPopular ? 'text-[#c9a84c]' : 'text-[#0c1e3c]'}`} />
                    </div>
                    <h3 className={`font-semibold text-[13px] ${style.textClass}`}>{plan.name}</h3>
                  </div>
                  {plan.description && (
                    <p className={`text-[11px] mt-0.5 ${isPopular ? 'text-[#8fa4c4]' : 'text-slate-400'}`}>{plan.description}</p>
                  )}
                  <div className="mt-3">
                    <span className={`text-2xl font-bold ${style.textClass}`}>R{Math.round(plan.price_monthly)}</span>
                    <span className={`text-[12px] ${style.subtextClass}`}>/month</span>
                  </div>
                  {plan.price_annual && (
                    <p className={`text-[10px] ${isPopular ? 'text-[#c9a84c]' : 'text-emerald-600'} mt-0.5`}>
                      R{Math.round(plan.price_annual)}/year — save {Math.round((1 - plan.price_annual / (plan.price_monthly * 12)) * 100)}%
                    </p>
                  )}
                  <Separator className={`my-4 ${isPopular ? 'bg-white/10' : ''}`} />
                  <ul className="space-y-2">
                    {features.map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-[12px] text-slate-600">
                        <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 text-[#c9a84c]`} />
                        <span className={isPopular ? 'text-slate-300' : ''}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full mt-4 ${style.buttonColor} text-[13px]`}
                    size="sm"
                    onClick={() => {
                      if (isAuthenticated && onSubscribe) {
                        onSubscribe(plan.id);
                      } else if (onLoginClick) {
                        onLoginClick();
                      }
                    }}
                  >
                    {isAuthenticated ? `Subscribe — R${Math.round(plan.price_monthly)}/mo` : `Choose ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
