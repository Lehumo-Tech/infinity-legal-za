'use client';

import React from 'react';
import { Crown, Phone, QrCode, Shield } from 'lucide-react';

interface MembershipCardProps {
  clientName: string;
  contractNumber?: string | null;
  planName?: string | null;
  planSlug?: string | null;
  status?: string | null;
  membershipNumber?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
}

const PLAN_ACCENT: Record<string, { gradient: string; label: string }> = {
  civil_legal_plan: { gradient: 'from-[#0c1e3c] via-[#1a3358] to-[#0c1e3c]', label: 'CIVIL' },
  'civil-legal': { gradient: 'from-[#0c1e3c] via-[#1a3358] to-[#0c1e3c]', label: 'CIVIL' },
  labour_legal_plan: { gradient: 'from-[#0c1e3c] via-[#1a3358] to-[#132d52]', label: 'LABOUR' },
  'labour-legal': { gradient: 'from-[#0c1e3c] via-[#1a3358] to-[#132d52]', label: 'LABOUR' },
  extensive_plan: { gradient: 'from-[#0c1e3c] via-[#1a3358] to-[#1a3358]', label: 'EXTENSIVE' },
  'extensive-cover': { gradient: 'from-[#0c1e3c] via-[#1a3358] to-[#1a3358]', label: 'EXTENSIVE' },
};

function maskContract(num?: string | null): string {
  if (!num) return 'INF-****-*****';
  const parts = num.split('-');
  if (parts.length >= 3) {
    return `${parts[0]}-****-${parts[2]}`;
  }
  return num.slice(0, 4) + '****' + num.slice(-4);
}

export function MembershipCard({
  clientName,
  contractNumber,
  planName,
  planSlug,
  status,
  membershipNumber,
  validFrom,
  validTo,
}: MembershipCardProps) {
  const plan = PLAN_ACCENT[planSlug || ''] || PLAN_ACCENT.civil_legal_plan;
  const isActive = status === 'active';

  const fromDate = validFrom
    ? new Date(validFrom).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })
    : '—';
  const toDate = validTo
    ? new Date(validTo).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })
    : '—';

  return (
    <div
      className={`relative w-full max-w-[420px] aspect-[1.586/1] rounded-2xl overflow-hidden bg-gradient-to-br ${plan.gradient} shadow-xl border border-[#c9a84c]/15`}
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Decorative diagonal gold stripe */}
      <div className="absolute top-0 right-0 w-40 h-40 overflow-hidden pointer-events-none">
        <div className="absolute -top-12 -right-12 w-52 h-52 bg-gradient-to-br from-[#c9a84c]/15 to-[#c9a84c]/5 rotate-45 transform origin-center" />
      </div>

      {/* Top gold line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#c9a84c]/60 to-transparent" />

      {/* Card content */}
      <div className="relative h-full flex flex-col justify-between p-5 sm:p-6">
        {/* Top row: Logo + Plan badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/15 flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#c9a84c]" />
            </div>
            <div>
              <p className="text-[#c9a84c] text-[10px] font-bold tracking-[0.2em] uppercase">Infinity Legal</p>
              <p className="text-[#7a94b8] text-[8px] tracking-widest uppercase">Membership Card</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {isActive ? 'Active' : status || 'Pending'}
            </span>
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#c9a84c]/15">
              <Crown className="w-3.5 h-3.5 text-[#c9a84c]" />
            </div>
          </div>
        </div>

        {/* Middle: Client name + Plan type */}
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-white text-lg sm:text-xl font-bold tracking-wide leading-tight truncate">
            {clientName || 'Member'}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[#c9a84c] text-[11px] font-semibold tracking-wider uppercase">
              {planName || plan.label || 'Plan'}
            </span>
            <span className="text-[#7a94b8] text-[10px]">|</span>
            <span className="text-[#8fa4c4] text-[10px] font-mono">
              {maskContract(contractNumber)}
            </span>
          </div>
        </div>

        {/* Bottom row: Dates + Helpline + QR placeholder */}
        <div className="flex items-end justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[7px] text-[#7a94b8] uppercase tracking-wider">Valid From</p>
                <p className="text-[11px] text-white font-medium">{fromDate}</p>
              </div>
              <div>
                <p className="text-[7px] text-[#7a94b8] uppercase tracking-wider">Valid To</p>
                <p className="text-[11px] text-white font-medium">{toDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-[#c9a84c]" />
              <span className="text-[10px] text-[#c9a84c] font-semibold tracking-wide">0861 INFINITY</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {membershipNumber && (
              <p className="text-[8px] text-[#7a94b8] font-mono text-right">
                {membershipNumber}
              </p>
            )}
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-[#c9a84c]/20 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-[#c9a84c]/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gold line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a84c]/40 to-transparent" />
    </div>
  );
}
