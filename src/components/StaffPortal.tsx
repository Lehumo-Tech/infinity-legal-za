'use client';

import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import {
  Card, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { User, StaffMember } from '@/components/types';

export function StaffPortal({ staff, user }: { staff: StaffMember[]; user: User | null }) {
  const [filterRole, setFilterRole] = useState('all');

  const roles = [...new Set(staff.map(s => s.role))];

  const filtered = staff.filter(s => {
    if (filterRole !== 'all' && s.role !== filterRole) return false;
    return true;
  });

  const roleLabels: Record<string, string> = {
    managing_director: 'Managing Director', admin: 'Admin',
    attorney: 'Attorney', paralegal: 'Paralegal',
    systems_admin: 'Systems Admin', client: 'Client',
  };

  const roleColors: Record<string, string> = {
    managing_director: 'bg-[#c9a84c]/10 text-[#a88832] border-[#c9a84c]/20',
    admin: 'bg-blue-50 text-blue-700 border-blue-100',
    attorney: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    paralegal: 'bg-purple-50 text-purple-700 border-purple-100',
    systems_admin: 'bg-red-50 text-red-700 border-red-100',
    client: 'bg-slate-50 text-slate-700 border-slate-100',
  };

  const avatarBg: Record<string, string> = {
    managing_director: 'bg-[#c9a84c] text-[#0c1e3c]',
    admin: 'bg-blue-100 text-blue-700',
    attorney: 'bg-emerald-100 text-emerald-700',
    paralegal: 'bg-purple-100 text-purple-700',
    systems_admin: 'bg-red-100 text-red-700',
    client: 'bg-slate-100 text-slate-700',
  };

  // Group by role
  const grouped = filtered.reduce((acc, s) => {
    const group = s.role || 'other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(s);
    return acc;
  }, {} as Record<string, StaffMember[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c]">Staff Portal</h2>
          <p className="text-[13px] text-slate-500">{staff.length} team members</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40 h-8 text-[12px]"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map(r => <SelectItem key={r} value={r}>{roleLabels[r] || r.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {Object.entries(grouped).map(([group, members]) => (
        <div key={group}>
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.15em] mb-3">{roleLabels[group] || group.replace(/_/g, ' ')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map(m => (
              <Card key={m.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className={`text-[10px] font-semibold ${avatarBg[m.role] || 'bg-slate-100 text-slate-700'}`}>
                        {m.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[#0c1e3c]">{m.full_name}</div>
                      <Badge className={`text-[9px] border ${roleColors[m.role] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>{roleLabels[m.role] || m.role.replace(/_/g, ' ')}</Badge>
                      <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1"><Mail className="w-3 h-3" />{m.email}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
