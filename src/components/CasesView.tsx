'use client';

import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/LoadingSkeleton';

export function CasesView({ cases, page, total, onPageChange, onRefresh, loading }: { cases: any[]; page: number; total: number; onPageChange: (p: number) => void; onRefresh: () => void; loading?: boolean }) {
  const totalPages = Math.ceil(total / 10);
  const statusColors: Record<string, string> = {
    intake: 'bg-blue-50 text-blue-700 border-blue-100',
    review: 'bg-amber-50 text-amber-700 border-amber-100',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    on_hold: 'bg-orange-50 text-orange-700 border-orange-100',
    closed: 'bg-slate-50 text-slate-700 border-slate-100',
    archived: 'bg-slate-50 text-slate-500 border-slate-100',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c]">Cases</h2>
          <p className="text-[13px] text-slate-500">{total} total cases</p>
        </div>
        <Button size="sm" variant="outline" onClick={onRefresh} className="border-[#0c1e3c]/20 text-[#0c1e3c] text-[12px] h-8">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading && cases.length === 0 ? (
            <TableSkeleton rows={5} cols={7} />
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b bg-[#0c1e3c]/[0.03]">
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Case Ref</th>
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Title</th>
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Type</th>
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Status</th>
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Client</th>
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Value (ZAR)</th>
                </tr>
              </thead>
              <tbody>
                {cases.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No cases found</td></tr>
                ) : (
                  cases.map(c => (
                    <tr key={c.id} className="border-b hover:bg-[#f7f8fa] transition-colors">
                      <td className="p-2.5 font-mono text-[#a88832]">{c.case_ref}</td>
                      <td className="p-2.5 font-medium text-[#0c1e3c] max-w-xs truncate">{c.title}</td>
                      <td className="p-2.5"><Badge variant="outline" className="text-[9px] border-slate-200 text-slate-600">{(c.case_type || '').replace(/_/g, ' ')}</Badge></td>
                      <td className="p-2.5"><Badge className={`text-[9px] border ${statusColors[c.status] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>{(c.status || '').replace(/_/g, ' ')}</Badge></td>
                      <td className="p-2.5 text-slate-600">{c.client?.full_name || '-'}</td>
                      <td className="p-2.5 font-medium text-[#0c1e3c]">R{(c.estimated_value || 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-slate-500">Page {page} of {totalPages} ({total} results)</p>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}
              className="h-7 w-7 p-0 border-slate-200">
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (p > totalPages) return null;
              return (
                <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => onPageChange(p)}
                  className={`h-7 w-7 p-0 text-[11px] ${p === page ? 'bg-[#0c1e3c] hover:bg-[#0c1e3c]' : 'border-slate-200 text-slate-600'}`}>
                  {p}
                </Button>
              );
            })}
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
              className="h-7 w-7 p-0 border-slate-200">
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
