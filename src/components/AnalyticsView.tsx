'use client';

import { DollarSign, FolderKanban, UserPlus, Users } from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import type { Stats } from '@/components/types';

export function AnalyticsView({ token, stats }: { token: string | null; stats: Stats | null }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0c1e3c]">Analytics Dashboard</h2>
        <p className="text-[13px] text-slate-500">Firm performance metrics and insights</p>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: `R${(stats.totalRevenue / 1000000).toFixed(2)}M`, icon: DollarSign, iconBg: 'bg-[#c9a84c]/10 text-[#a88832]', borderAccent: 'border-l-[#c9a84c]' },
              { label: 'Active Cases', value: stats.activeCases, icon: FolderKanban, iconBg: 'bg-blue-50 text-blue-600', borderAccent: 'border-l-blue-500' },
              { label: 'New Leads', value: stats.newLeads, icon: UserPlus, iconBg: 'bg-emerald-50 text-emerald-600', borderAccent: 'border-l-emerald-500' },
              { label: 'Total Clients', value: stats.totalClients, icon: Users, iconBg: 'bg-purple-50 text-purple-600', borderAccent: 'border-l-purple-500' },
            ].map(card => (
              <Card key={card.label} className={`shadow-sm border-l-[3px] ${card.borderAccent}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                      <card.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-xl font-bold text-[#0c1e3c]">{card.value}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{card.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="px-5 pt-5 pb-2">
                <CardTitle className="text-[13px] font-semibold text-[#0c1e3c]">Case Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="space-y-3">
                  {[
                    { status: 'Active', count: stats.activeCases, total: stats.totalCases || 1, color: 'bg-emerald-500' },
                    { status: 'Pending Review', count: stats.pendingCases, total: stats.totalCases || 1, color: 'bg-amber-500' },
                    { status: 'Closed', count: stats.closedCases, total: stats.totalCases || 1, color: 'bg-slate-400' },
                  ].map(item => (
                    <div key={item.status} className="flex items-center gap-3">
                      <span className="text-[12px] text-slate-600 w-28">{item.status}</span>
                      <div className="flex-1 bg-[#f0f1f3] rounded-full h-1.5">
                        <div className={`${item.color} rounded-full h-1.5`} style={{ width: `${(item.count / item.total) * 100}%` }} />
                      </div>
                      <span className="text-[12px] font-medium text-[#0c1e3c] w-8 text-right">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="px-5 pt-5 pb-2">
                <CardTitle className="text-[13px] font-semibold text-[#0c1e3c]">Task Overview</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="space-y-1">
                  {[
                    { status: 'Pending', count: stats.pendingTasks, color: 'bg-amber-500' },
                    { status: 'Overdue', count: stats.overdueTasks, color: 'bg-red-500' },
                    { status: 'Documents', count: stats.totalDocuments, color: 'bg-blue-500' },
                  ].map(item => (
                    <div key={item.status} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#f7f8fa]">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <span className="text-[12px] text-slate-700">{item.status}</span>
                      </div>
                      <span className="text-[12px] font-medium text-[#0c1e3c]">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
