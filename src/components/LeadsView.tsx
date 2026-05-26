'use client';

import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/LoadingSkeleton';

export function LeadsView({ leads, page, total, onPageChange, onRefresh, loading }: { leads: any[]; page: number; total: number; onPageChange: (p: number) => void; onRefresh: () => void; loading?: boolean }) {
  const totalPages = Math.ceil(total / 10);
  const statusColors: Record<string, string> = {
    new: 'bg-blue-50 text-blue-700 border-blue-100', contacted: 'bg-amber-50 text-amber-700 border-amber-100',
    qualified: 'bg-emerald-50 text-emerald-700 border-emerald-100', consultation_scheduled: 'bg-purple-50 text-purple-700 border-purple-100',
    retained: 'bg-teal-50 text-teal-700 border-teal-100', lost: 'bg-red-50 text-red-700 border-red-100',
    disqualified: 'bg-slate-50 text-slate-500 border-slate-100',
  };

  const pipelineColors: Record<string, string> = {
    new: 'text-blue-600', contacted: 'text-amber-600',
    qualified: 'text-emerald-600', consultation_scheduled: 'text-purple-600',
    retained: 'text-teal-600', lost: 'text-red-600',
    disqualified: 'text-slate-500',
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-slate-400';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c]">Leads Pipeline</h2>
          <p className="text-[13px] text-slate-500">{total} total leads</p>
        </div>
        <Button size="sm" variant="outline" onClick={onRefresh} className="border-[#0c1e3c]/20 text-[#0c1e3c] text-[12px] h-8">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {['new', 'contacted', 'qualified', 'consultation_scheduled', 'retained', 'lost', 'disqualified'].map(status => {
          const count = leads.filter(l => l.status === status).length;
          return (
            <div key={status} className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm text-center">
              <div className={`text-lg font-bold ${pipelineColors[status] || 'text-[#0c1e3c]'}`}>{count}</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider capitalize">{status.replace(/_/g, ' ')}</div>
            </div>
          );
        })}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading && leads.length === 0 ? (
            <TableSkeleton rows={5} cols={6} />
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b bg-[#0c1e3c]/[0.03]">
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Name</th>
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Email</th>
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Source</th>
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Status</th>
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Score</th>
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Value (ZAR)</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No leads found</td></tr>
                ) : (
                  leads.map(l => (
                  <tr key={l.id} className="border-b hover:bg-[#f7f8fa] transition-colors">
                    <td className="p-2.5 font-medium text-[#0c1e3c]">{l.name}</td>
                    <td className="p-2.5 text-slate-600">{l.email}</td>
                    <td className="p-2.5"><Badge variant="outline" className="text-[9px] border-slate-200 text-slate-600 capitalize">{l.source?.replace(/_/g, ' ')}</Badge></td>
                    <td className="p-2.5"><Badge className={`text-[9px] border ${statusColors[l.status] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>{(l.status || '').replace(/_/g, ' ')}</Badge></td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#f0f1f3] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${scoreColor(l.lead_score || 0)}`} style={{ width: `${l.lead_score || 0}%` }} />
                        </div>
                        <span className="text-[11px] font-medium text-slate-600">{l.lead_score || 0}</span>
                      </div>
                    </td>
                    <td className="p-2.5 font-medium text-[#0c1e3c]">R{(l.estimated_value || 0).toLocaleString()}</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}
              className="h-7 w-7 p-0 border-slate-200"><ChevronLeft className="w-3.5 h-3.5" /></Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
              className="h-7 w-7 p-0 border-slate-200"><ChevronRight className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
