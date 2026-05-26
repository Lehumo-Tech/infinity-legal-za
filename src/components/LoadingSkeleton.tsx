'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1 bg-slate-100" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-t border-slate-50">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1 bg-slate-50" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-100 p-5 space-y-3">
          <Skeleton className="h-4 w-2/3 bg-slate-50" />
          <Skeleton className="h-8 w-1/2 bg-slate-50" />
          <Skeleton className="h-3 w-full bg-slate-50" />
        </div>
      ))}
    </div>
  );
}

export function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-100 p-5 space-y-2">
          <Skeleton className="h-3 w-20 bg-slate-50" />
          <Skeleton className="h-7 w-24 bg-slate-50" />
          <Skeleton className="h-3 w-16 bg-slate-50" />
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-5">
      <div className="flex justify-start"><Skeleton className="h-16 w-[70%] rounded-2xl bg-slate-50" /></div>
      <div className="flex justify-end"><Skeleton className="h-12 w-[50%] rounded-2xl bg-slate-50" /></div>
      <div className="flex justify-start"><Skeleton className="h-20 w-[60%] rounded-2xl bg-slate-50" /></div>
    </div>
  );
}
