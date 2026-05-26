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
  const [filterDept, setFilterDept] = useState('all');
  const [filterRole, setFilterRole] = useState('all');

  const departments = [...new Set(staff.map(s => s.department).filter(Boolean))];
  const roles = [...new Set(staff.map(s => s.role))];

  const filtered = staff.filter(s => {
    if (filterDept !== 'all' && s.department !== filterDept) return false;
    if (filterRole !== 'all' && s.role !== filterRole) return false;
    return true;
  });

  const roleLabels: Record<string, string> = {
    managing_director: 'Managing Director', senior_partner: 'Senior Partner',
    associate: 'Associate', paralegal: 'Paralegal', legal_officer: 'Legal Officer',
    supervising_officer: 'Supervising Officer', senior_consultant: 'Senior Consultant',
    consultant: 'Consultant', candidate_attorney: 'Candidate Attorney',
    hr_manager: 'HR Manager', finance_manager: 'Finance Manager',
    office_administrator: 'Office Admin', systems_admin: 'Systems Admin',
    receptionist: 'Receptionist',
  };

  const roleColors: Record<string, string> = {
    managing_director: 'bg-[#c9a84c]/10 text-[#a88832] border-[#c9a84c]/20', senior_partner: 'bg-[#c9a84c]/10 text-[#a88832] border-[#c9a84c]/20',
    associate: 'bg-blue-50 text-blue-700 border-blue-100', paralegal: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    legal_officer: 'bg-purple-50 text-purple-700 border-purple-100', supervising_officer: 'bg-amber-50 text-amber-700 border-amber-100',
    senior_consultant: 'bg-teal-50 text-teal-700 border-teal-100', consultant: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    candidate_attorney: 'bg-pink-50 text-pink-700 border-pink-100', hr_manager: 'bg-orange-50 text-orange-700 border-orange-100',
    finance_manager: 'bg-green-50 text-green-700 border-green-100', office_administrator: 'bg-slate-50 text-slate-700 border-slate-100',
    systems_admin: 'bg-red-50 text-red-700 border-red-100', receptionist: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  };

  const avatarBg: Record<string, string> = {
    managing_director: 'bg-[#c9a84c] text-[#0c1e3c]', senior_partner: 'bg-[#c9a84c] text-[#0c1e3c]',
    associate: 'bg-blue-100 text-blue-700', paralegal: 'bg-emerald-100 text-emerald-700',
    legal_officer: 'bg-purple-100 text-purple-700', supervising_officer: 'bg-amber-100 text-amber-700',
    senior_consultant: 'bg-teal-100 text-teal-700', consultant: 'bg-cyan-100 text-cyan-700',
    candidate_attorney: 'bg-pink-100 text-pink-700', hr_manager: 'bg-orange-100 text-orange-700',
    finance_manager: 'bg-green-100 text-green-700', office_administrator: 'bg-slate-100 text-slate-700',
    systems_admin: 'bg-red-100 text-red-700', receptionist: 'bg-yellow-100 text-yellow-700',
  };

  // Group by department
  const grouped = filtered.reduce((acc, s) => {
    const dept = s.department || 'unassigned';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(s);
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
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-40 h-8 text-[12px]"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(d => <SelectItem key={d} value={d!}>{d?.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40 h-8 text-[12px]"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map(r => <SelectItem key={r} value={r}>{roleLabels[r] || r.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {Object.entries(grouped).map(([dept, members]) => (
        <div key={dept}>
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.15em] mb-3 capitalize">{dept.replace(/_/g, ' ')} Department</h3>
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
                      {m.supervisor && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Reports to: {m.supervisor.full_name}
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${m.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        <span className="text-[9px] text-slate-500">{m.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
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
