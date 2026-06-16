'use client';

import { Crown, Shield, Gavel, Briefcase, Building, ArrowUpRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { StaffMember } from '@/components/types';

export function OrgChartView({ staff }: { staff: StaffMember[] }) {
  const hierarchy: Record<string, { tier: number; label: string; roles: string[] }> = {
    'Executive Leadership': { tier: 1, label: 'Executive Leadership', roles: ['managing_director'] },
    'Management': { tier: 2, label: 'Management', roles: ['admin', 'systems_admin'] },
    'Legal Practice': { tier: 3, label: 'Legal Practice', roles: ['attorney'] },
    'Support Staff': { tier: 4, label: 'Support Staff', roles: ['paralegal'] },
  };

  const roleLabels: Record<string, string> = {
    managing_director: 'Managing Director', admin: 'Admin',
    attorney: 'Attorney', paralegal: 'Paralegal',
    systems_admin: 'Systems Admin', client: 'Client',
  };

  const tierColors: Record<number, { icon: string; line: string }> = {
    1: { icon: 'bg-[#c9a84c] text-[#0c1e3c]', line: 'border-[#c9a84c]/30' },
    2: { icon: 'bg-[#0c1e3c] text-[#c9a84c]', line: 'border-[#0c1e3c]/20' },
    3: { icon: 'bg-blue-50 text-blue-600', line: 'border-blue-200/50' },
    4: { icon: 'bg-emerald-50 text-emerald-600', line: 'border-emerald-200/50' },
    5: { icon: 'bg-slate-50 text-slate-600', line: 'border-slate-200/50' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0c1e3c]">Organizational Structure</h2>
        <p className="text-[13px] text-slate-500">Infinity Legal (Pty) Ltd - Hierarchical Order</p>
      </div>

      <div className="space-y-5">
        {Object.entries(hierarchy).sort((a, b) => a[1].tier - b[1].tier).map(([key, group]) => {
          const members = staff.filter(s => group.roles.includes(s.role));
          const colors = tierColors[group.tier] || tierColors[5];
          return (
            <div key={key} className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors.icon}`}>
                  {group.tier === 1 ? <Crown className="w-4 h-4" /> :
                   group.tier === 2 ? <Shield className="w-4 h-4" /> :
                   group.tier === 3 ? <Gavel className="w-4 h-4" /> :
                   group.tier === 4 ? <Briefcase className="w-4 h-4" /> :
                   <Building className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold text-[#0c1e3c]">{group.label}</h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Tier {group.tier} · {members.length} members</p>
                </div>
              </div>
              <div className={`ml-[18px] pl-5 border-l-2 ${colors.line} space-y-1`}>
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f7f8fa] transition-colors">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="bg-[#0c1e3c] text-[#c9a84c] text-[9px]">
                        {m.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-[12px] font-medium text-[#0c1e3c]">{m.full_name}</div>
                      <div className="text-[10px] text-slate-500">{roleLabels[m.role] || m.role.replace(/_/g, ' ')}</div>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-[12px] text-slate-400 italic p-2">No staff members in this tier</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
